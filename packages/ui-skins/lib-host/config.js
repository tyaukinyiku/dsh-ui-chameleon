const DEFAULTS = {
    enabled: true,
    defaultPack: 'default',
    defaultTheme: '',
    defaultLayout: '',
    defaultCss: '',
    defaultTokens: {},
    workspaceFileEnabled: true,
    workspaceFilePath: '.dsh/ui.json',
    workspaceFilePollMs: 2000,
    observerSlot: 'conversation.session.header.utilities',
    observerId: 'ui-skins-observer',
    observerOrder: 0,
    externalPacks: [],
};
/** 填充默认值 + 字段校验；配置错误响亮抛出。 */
export function parseConfig(input) {
    const raw = (input ?? {});
    const config = { ...DEFAULTS, defaultTokens: {} };
    for (const key of Object.keys(raw)) {
        if (!(key in DEFAULTS))
            throw new Error(`ui-skins 配置未知字段: ${key}`);
    }
    if (raw.externalPacks !== undefined) {
        if (!Array.isArray(raw.externalPacks))
            throw new Error('ui-skins 配置 externalPacks 期望数组');
        config.externalPacks = raw.externalPacks.map((item, i) => {
            const o = item;
            if (!o || typeof o !== 'object')
                throw new Error(`ui-skins 配置 externalPacks[${i}] 期望对象`);
            for (const k of Object.keys(o)) {
                if (!['source', 'id', 'enabled', 'cssFiles'].includes(k)) {
                    throw new Error(`ui-skins 配置 externalPacks[${i}] 未知字段: ${k}`);
                }
            }
            if (typeof o.source !== 'string' || !o.source) {
                throw new Error(`ui-skins 配置 externalPacks[${i}].source 期望非空字符串`);
            }
            const entry = { source: o.source };
            if (o.id !== undefined) {
                if (typeof o.id !== 'string')
                    throw new Error(`ui-skins 配置 externalPacks[${i}].id 期望 string`);
                entry.id = o.id;
            }
            if (o.enabled !== undefined) {
                if (typeof o.enabled !== 'boolean')
                    throw new Error(`ui-skins 配置 externalPacks[${i}].enabled 期望 boolean`);
                entry.enabled = o.enabled;
            }
            if (o.cssFiles !== undefined) {
                if (!Array.isArray(o.cssFiles) || o.cssFiles.some((f) => typeof f !== 'string')) {
                    throw new Error(`ui-skins 配置 externalPacks[${i}].cssFiles 期望 string[]`);
                }
                entry.cssFiles = o.cssFiles;
            }
            return entry;
        });
    }
    const str = (key) => {
        const value = raw[key];
        if (value !== undefined && typeof value !== 'string') {
            throw new Error(`ui-skins 配置 ${key} 期望 string`);
        }
        if (typeof value === 'string')
            config[key] = value;
    };
    str('defaultPack');
    str('defaultTheme');
    str('defaultLayout');
    str('defaultCss');
    str('workspaceFilePath');
    str('observerSlot');
    str('observerId');
    const num = (key) => {
        const value = raw[key];
        if (value !== undefined && typeof value !== 'number') {
            throw new Error(`ui-skins 配置 ${key} 期望 number`);
        }
        if (typeof value === 'number')
            config[key] = value;
    };
    num('workspaceFilePollMs');
    num('observerOrder');
    const bool = (key) => {
        const value = raw[key];
        if (value !== undefined && typeof value !== 'boolean') {
            throw new Error(`ui-skins 配置 ${key} 期望 boolean`);
        }
        if (typeof value === 'boolean')
            config[key] = value;
    };
    bool('enabled');
    bool('workspaceFileEnabled');
    if (raw.defaultTokens !== undefined) {
        const tokens = raw.defaultTokens;
        if (typeof tokens !== 'object' || tokens === null || Array.isArray(tokens)) {
            throw new Error('ui-skins 配置 defaultTokens 期望对象');
        }
        for (const [key, value] of Object.entries(tokens)) {
            if (typeof value !== 'string')
                throw new Error(`ui-skins 配置 defaultTokens.${key} 期望 string`);
            config.defaultTokens[key] = value;
        }
    }
    return config;
}
/** Standard Schema（https://standardschema.dev）形态的配置校验器。 */
export const Config = {
    '~standard': {
        vendor: 'dsh-ui-chameleon',
        version: 1,
        validate(value) {
            try {
                return { value: parseConfig(value) };
            }
            catch (error) {
                return { issues: [{ message: String(error) }] };
            }
        },
    },
};
/** dsh 层（组合层）的 UiLayerConfig 形态。 */
export function configToLayer(config) {
    return {
        pack: config.defaultPack || null,
        theme: config.defaultTheme || null,
        layout: config.defaultLayout || null,
        css: config.defaultCss || null,
        tokens: { ...config.defaultTokens },
    };
}
/** 客户端运行时需要的配置面（经 /ui-skins/state 下发）。 */
export function observerOf(config) {
    return { slotKey: config.observerSlot, id: config.observerId, order: config.observerOrder };
}
