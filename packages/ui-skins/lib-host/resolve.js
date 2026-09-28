/** 层级顺序：低 → 高。 */
export const LEVELS_LOW_TO_HIGH = ['dsh', 'workspace', 'session'];
const SCALAR_FIELDS = ['pack', 'theme', 'layout', 'css'];
const LAYER_KEYS = new Set([...SCALAR_FIELDS, 'tokens', 'components']);
function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
}
function describeType(value) {
    if (value === null)
        return 'null';
    if (Array.isArray(value))
        return 'array';
    return typeof value;
}
function normalizeComponentRef(input, where, errors) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        errors.push(`${where}: 期望 { pack, name } 对象，得到 ${describeType(input)}`);
        return undefined;
    }
    const raw = input;
    const pack = raw.pack;
    const name = raw.name;
    if (typeof pack !== 'string' || !pack)
        errors.push(`${where}.pack: 期望非空 string`);
    if (typeof name !== 'string' || !name)
        errors.push(`${where}.name: 期望非空 string`);
    const ref = {
        pack: typeof pack === 'string' ? pack : '',
        name: typeof name === 'string' ? name : '',
    };
    if (raw.key !== undefined) {
        if (typeof raw.key === 'string')
            ref.key = raw.key;
        else
            errors.push(`${where}.key: 期望 string`);
    }
    if (raw.id !== undefined) {
        if (typeof raw.id === 'string')
            ref.id = raw.id;
        else
            errors.push(`${where}.id: 期望 string`);
    }
    if (raw.order !== undefined) {
        if (typeof raw.order === 'number' && Number.isFinite(raw.order))
            ref.order = raw.order;
        else
            errors.push(`${where}.order: 期望 number`);
    }
    if (raw.priority !== undefined) {
        if (typeof raw.priority === 'number' && Number.isFinite(raw.priority))
            ref.priority = raw.priority;
        else
            errors.push(`${where}.priority: 期望 number`);
    }
    for (const key of Object.keys(raw)) {
        if (!['pack', 'name', 'key', 'id', 'order', 'priority'].includes(key)) {
            errors.push(`${where}: 未知字段 ${key}`);
        }
    }
    return ref;
}
/**
 * 校验并规范化一层配置。写路径把 errors 视为拒绝理由（配置错误要响亮）；
 * 读路径把 errors 并入 UiSpec.warnings 后继续（读路径优雅降级）。
 */
export function normalizeLayerConfig(input, where = 'layer') {
    const errors = [];
    const config = {};
    if (input === undefined)
        return { config, errors };
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        return { config, errors: [`${where}: 期望对象，得到 ${describeType(input)}`] };
    }
    const raw = input;
    for (const field of SCALAR_FIELDS) {
        if (!hasOwn(raw, field))
            continue;
        const value = raw[field];
        if (value === null || typeof value === 'string') {
            ;
            config[field] = value;
        }
        else {
            errors.push(`${where}.${field}: 期望 string | null，得到 ${describeType(value)}`);
        }
    }
    if (hasOwn(raw, 'tokens')) {
        const value = raw.tokens;
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            errors.push(`${where}.tokens: 期望对象，得到 ${describeType(value)}`);
        }
        else {
            const tokens = {};
            for (const [key, item] of Object.entries(value)) {
                if (item === null || typeof item === 'string')
                    tokens[key] = item;
                else
                    errors.push(`${where}.tokens.${key}: 期望 string | null，得到 ${describeType(item)}`);
            }
            config.tokens = tokens;
        }
    }
    if (hasOwn(raw, 'components')) {
        const value = raw.components;
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            errors.push(`${where}.components: 期望对象，得到 ${describeType(value)}`);
        }
        else {
            const components = {};
            for (const [key, item] of Object.entries(value)) {
                if (item === null) {
                    components[key] = null;
                    continue;
                }
                const ref = normalizeComponentRef(item, `${where}.components.${key}`, errors);
                if (ref)
                    components[key] = ref;
            }
            config.components = components;
        }
    }
    for (const key of Object.keys(raw)) {
        if (!LAYER_KEYS.has(key))
            errors.push(`${where}: 未知字段 ${key}`);
    }
    return { config, errors };
}
/**
 * 同语义的层合并：把多层配置压成一层（低 → 高）。
 * 用于工作区层内部合成（.dsh/ui.json < 存储绑定）等场景。
 */
export function mergeLayerConfigs(...layers) {
    const merged = {};
    for (const layer of layers) {
        if (!layer)
            continue;
        for (const field of ['pack', 'theme', 'layout', 'css']) {
            if (hasOwn(layer, field))
                merged[field] = layer[field];
        }
        if (layer.tokens) {
            const tokens = { ...(merged.tokens ?? {}) };
            for (const [key, value] of Object.entries(layer.tokens)) {
                if (value === null)
                    delete tokens[key];
                else
                    tokens[key] = value;
            }
            if (Object.keys(tokens).length > 0)
                merged.tokens = tokens;
            else
                delete merged.tokens;
        }
        if (layer.components) {
            const components = { ...(merged.components ?? {}) };
            for (const [key, value] of Object.entries(layer.components)) {
                if (value === null)
                    delete components[key];
                else
                    components[key] = value;
            }
            if (Object.keys(components).length > 0)
                merged.components = components;
            else
                delete merged.components;
        }
    }
    return merged;
}
function pickScalar(layers, field) {
    for (let i = LEVELS_LOW_TO_HIGH.length - 1; i >= 0; i -= 1) {
        const level = LEVELS_LOW_TO_HIGH[i];
        const config = layers[level];
        if (config && hasOwn(config, field))
            return { value: config[field], level };
    }
    return { value: undefined };
}
/** 三级解析：产出可直接交给浏览器应用的 UiSpec。 */
export function resolveUi(input) {
    const { layers } = input;
    const warnings = [];
    const provenance = {
        pack: 'none',
        theme: 'none',
        layout: 'none',
        tokens: {},
        components: {},
        css: [],
    };
    // ---- 1. pack：高 → 低第一个“有此键”的层 ----
    const packPick = pickScalar(layers, 'pack');
    let pack;
    if (typeof packPick.value === 'string') {
        pack = [...(input.packs ?? [])].find((item) => item.id === packPick.value);
        if (!pack) {
            warnings.push(`UI pack 未注册: ${packPick.value}`);
        }
        else {
            provenance.pack = packPick.level ?? 'none';
        }
    }
    else if (packPick.value === null) {
        provenance.pack = packPick.level ?? 'none'; // 显式清除：不使用任何 pack
    }
    // ---- 2. theme / layout：显式清除或未选择 → 回到 pack 默认 ----
    const themePick = pickScalar(layers, 'theme');
    let themeId = null;
    let theme;
    {
        const fallback = pack?.defaultTheme ?? null;
        if (themePick.value === undefined || themePick.value === null) {
            themeId = fallback;
            provenance.theme = themeId ? 'pack-default' : 'none';
            theme = themeId && pack ? pack.themes?.[themeId] : undefined;
        }
        else {
            const candidate = themePick.value;
            const resolved = pack?.themes?.[candidate];
            const drift = provenance.pack !== 'none' && themePick.level !== provenance.pack;
            if (resolved) {
                themeId = candidate;
                theme = resolved;
                provenance.theme = themePick.level ?? 'none';
            }
            else if (drift || !pack) {
                // 漂移继承（低层为旧 pack/无 pack 语境命名）或 pack 已被高层清除：静默回落
                themeId = drift ? fallback : null;
                provenance.theme = themeId ? 'pack-default' : 'none';
                theme = themeId && pack ? pack.themes?.[themeId] : undefined;
            }
            else {
                // 同层显式配错：响亮
                themeId = candidate;
                provenance.theme = themePick.level ?? 'none';
                warnings.push(`UI pack ${pack.id} 未提供主题: ${candidate}`);
            }
        }
    }
    const layoutPick = pickScalar(layers, 'layout');
    let layoutId = null;
    let layout;
    {
        const fallback = pack?.defaultLayout ?? null;
        if (layoutPick.value === undefined || layoutPick.value === null) {
            layoutId = fallback;
            provenance.layout = layoutId ? 'pack-default' : 'none';
            layout = layoutId && pack ? pack.layouts?.[layoutId] : undefined;
        }
        else {
            const candidate = layoutPick.value;
            const resolved = pack?.layouts?.[candidate];
            const drift = provenance.pack !== 'none' && layoutPick.level !== provenance.pack;
            if (resolved) {
                layoutId = candidate;
                layout = resolved;
                provenance.layout = layoutPick.level ?? 'none';
            }
            else if (drift || !pack) {
                layoutId = drift ? fallback : null;
                provenance.layout = layoutId ? 'pack-default' : 'none';
                layout = layoutId && pack ? pack.layouts?.[layoutId] : undefined;
            }
            else {
                layoutId = candidate;
                provenance.layout = layoutPick.level ?? 'none';
                warnings.push(`UI pack ${pack.id} 未提供布局: ${candidate}`);
            }
        }
    }
    // ---- 3. css：pack 基础 → 主题 → 布局，再叠层级附加 css（null 清空层级部分）----
    const cssChunks = [];
    if (pack?.baseCss) {
        cssChunks.push(pack.baseCss);
        provenance.css.push('pack-base');
    }
    if (theme?.css) {
        cssChunks.push(theme.css);
        provenance.css.push('theme');
    }
    if (layout?.css) {
        cssChunks.push(layout.css);
        provenance.css.push('layout');
    }
    const levelCss = [];
    for (const level of LEVELS_LOW_TO_HIGH) {
        const config = layers[level];
        if (!config || !hasOwn(config, 'css'))
            continue;
        const value = config.css;
        if (value === null) {
            levelCss.length = 0;
            provenance.css = provenance.css.filter((entry) => entry === 'pack-base' || entry === 'theme' || entry === 'layout');
        }
        else if (typeof value === 'string') {
            levelCss.push(value);
            provenance.css.push(level);
        }
    }
    cssChunks.push(...levelCss);
    // ---- 4. tokens：pack → 主题 → 布局打底，层覆盖低 → 高；null 删除覆盖 ----
    const baseTokens = {
        ...(pack?.baseTokens ?? {}),
        ...(theme?.tokens ?? {}),
        ...(layout?.tokens ?? {}),
    };
    for (const key of Object.keys(baseTokens))
        provenance.tokens[key] = 'pack';
    const overrides = {};
    for (const level of LEVELS_LOW_TO_HIGH) {
        const config = layers[level];
        if (!config?.tokens)
            continue;
        for (const [key, value] of Object.entries(config.tokens)) {
            if (value === null) {
                delete overrides[key];
                if (hasOwn(baseTokens, key))
                    provenance.tokens[key] = 'pack';
                else
                    delete provenance.tokens[key];
            }
            else {
                overrides[key] = value;
                provenance.tokens[key] = level;
            }
        }
    }
    const tokens = { ...baseTokens, ...overrides };
    // ---- 5. components：pack → 布局打底，层覆盖低 → 高；null = 清除（回到 dsh 原生 UI）----
    const components = {
        ...(pack?.baseComponents ?? {}),
        ...(layout?.components ?? {}),
    };
    for (const key of Object.keys(components))
        provenance.components[key] = 'pack';
    for (const level of LEVELS_LOW_TO_HIGH) {
        const config = layers[level];
        if (!config?.components)
            continue;
        for (const [key, value] of Object.entries(config.components)) {
            if (value === null) {
                delete components[key];
                delete provenance.components[key];
            }
            else {
                components[key] = value;
                provenance.components[key] = level;
            }
        }
    }
    return {
        packId: pack?.id ?? null,
        bodyAttr: pack?.bodyAttr ?? null,
        hooks: pack?.hooksUrl ? { url: pack.hooksUrl, assetBase: pack.assetBase ?? '' } : null,
        themeId,
        layoutId,
        tokens,
        css: cssChunks.join('\n'),
        components,
        provenance,
        warnings,
    };
}
