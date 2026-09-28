/**
 * 外部 web-ui 皮肤单元适配器：skin.json → UiPackDescriptor。
 *
 * 安全边界：只把外部单元当**数据**读（skin.json / CSS / 预览图），不执行外部代码；
 * 需要执行的部分（功能插件）由 dsh 自己的 loader 按用户显式安装加载。
 *
 * CSS 资产优先级：entry.cssFiles 显式 > 单元内 *.css 发现 > lib/client.js 启发式提取。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, resolve, sep } from 'node:path';
export const EXTERNAL_ROUTE_PREFIX = '/ui-skins/external';
/** 从给定起点向上找 node_modules 目录（包名解析锚点）。 */
function findNodeModules(start) {
    let dir = start;
    for (let i = 0; i < 10; i++) {
        const cand = join(dir, 'node_modules');
        if (existsSync(cand) && statSync(cand).isDirectory())
            return cand;
        const parent = resolve(dir, '..');
        if (parent === dir)
            break;
        dir = parent;
    }
    return null;
}
/** 解析外部单元根目录：路径直用；包名在若干 node_modules 锚点里找。 */
export function resolveExternalRoot(source, searchFrom = []) {
    if (source.startsWith('/') || source.startsWith('.')) {
        const abs = resolve(source);
        return existsSync(abs) && statSync(abs).isDirectory() ? abs : null;
    }
    const anchors = new Set();
    for (const from of searchFrom) {
        const nm = findNodeModules(from);
        if (nm)
            anchors.add(nm);
    }
    for (const nm of anchors) {
        const abs = join(nm, ...source.split('/'));
        if (existsSync(abs) && statSync(abs).isDirectory())
            return abs;
    }
    return null;
}
function readJson(file) {
    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    }
    catch {
        return null;
    }
}
/** 启发式：从 JS bundle 的字符串字面量里提取 CSS 文本（css-modules 注入产物）。
 *  三种引号**独立扫描**（单一交替正则会被短字符串里的异种引号吞掉后续大字面量）。 */
export function extractCssFromBundle(js) {
    const out = [];
    const seen = new Set();
    const patterns = [
        { re: /"((?:[^"\\\n]|\\.){30,})"/g, json: true },
        { re: /'((?:[^'\\\n]|\\.){30,})'/g, json: false },
        { re: /`((?:[^`\\]|\\.){30,})`/g, json: false },
    ];
    for (const { re, json } of patterns) {
        let m;
        while ((m = re.exec(js)) !== null) {
            const raw = m[1];
            if (!raw)
                continue;
            let s;
            if (json) {
                try {
                    s = JSON.parse(`"${raw}"`);
                }
                catch {
                    continue;
                }
            }
            else {
                s = raw.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\`/g, '`').replace(/\\\\/g, '\\');
            }
            if (!looksLikeCss(s) || seen.has(s))
                continue;
            seen.add(s);
            out.push(sanitizeCssChunk(s));
        }
    }
    return out.join('\n');
}
/** 逐段净化：配平引号/圆括号/花括号——残缺碎片会毒化整表 CSS 解析（规则被解析器丢弃）。 */
function sanitizeCssChunk(s) {
    let braces = 0;
    let parens = 0;
    let inStr = '';
    for (let i = 0; i < s.length; i += 1) {
        const c = s[i];
        if (inStr) {
            if (c === '\\')
                i += 1;
            else if (c === inStr)
                inStr = '';
            continue;
        }
        if (c === '"' || c === "'")
            inStr = c;
        else if (c === '{')
            braces += 1;
        else if (c === '}')
            braces = Math.max(0, braces - 1);
        else if (c === '(')
            parens += 1;
        else if (c === ')')
            parens = Math.max(0, parens - 1);
    }
    let tail = '';
    if (inStr)
        tail += inStr;
    if (parens > 0 && parens <= 5)
        tail += ')'.repeat(parens);
    if (braces > 0 && braces <= 5)
        tail += '}'.repeat(braces);
    return tail ? s + '\n' + tail : s;
}
function looksLikeCss(s) {
    // 排除 JS / GLSL 等同形文本（注意 CSS 合法含 @import，不能用裸 `import ` 排除）
    if (/=>|require\(|\bfunction\s*\(|\bimport\s*[{*'"`]|#version|void\s+main|gl_Position|uniform\s|precision\s+highp/.test(s)) {
        return false;
    }
    return s.includes('{') && s.includes('}') && /\{[^{}]*[:;][^{}]*\}/.test(s) && /[.#\[*:a-zA-Z]|--|@media|:root/.test(s);
}
function walkCss(dir, depth, out) {
    if (depth <= 0)
        return;
    for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name.startsWith('.'))
            continue;
        const abs = join(dir, name);
        const st = statSync(abs);
        if (st.isDirectory())
            walkCss(abs, depth - 1, out);
        else if (extname(name).toLowerCase() === '.css')
            out.push(abs);
    }
}
/** 把一个外部皮肤单元适配为 UiPackDescriptor。 */
export function adaptExternalPack(root, entry) {
    const warnings = [];
    const assets = new Map();
    const skin = readJson(join(root, 'skin.json')) ?? {};
    if (!existsSync(join(root, 'skin.json')))
        warnings.push('skin.json 缺失，仅按目录启发式适配');
    const skinId = typeof skin.id === 'string' && skin.id ? skin.id : basename(root);
    const id = entry.id || `ext-${skinId}`;
    const pack = {
        id,
        title: typeof skin.name === 'string' && skin.name ? skin.name : skinId,
        description: [skin.tagline, skin.description]
            .filter((v) => typeof v === 'string' && !!v)
            .join(' '),
    };
    if (typeof skin.accent === 'string' && skin.accent) {
        pack.baseTokens = { '--ui-accent': skin.accent };
    }
    if (typeof skin.bodyAttr === 'string' && skin.bodyAttr)
        pack.bodyAttr = skin.bodyAttr;
    // 预览图 → /ui-skins/external/<id>/asset/<rel>（登记白名单）
    const preview = skin.preview;
    if (preview && typeof preview === 'object') {
        const mapped = {};
        for (const variant of ['light', 'dark']) {
            const rel = preview[variant];
            if (typeof rel !== 'string' || !rel)
                continue;
            const relNorm = rel.replace(/^\.?\//, '');
            const abs = resolve(root, relNorm);
            if (abs.startsWith(root + sep) && existsSync(abs)) {
                assets.set(relNorm, abs);
                mapped[variant] = `${EXTERNAL_ROUTE_PREFIX}/${id}/asset/${relNorm}`;
            }
            else {
                warnings.push(`预览图缺失: ${relNorm}`);
            }
        }
        if (mapped.light || mapped.dark)
            pack.preview = mapped;
    }
    // CSS 资产：显式 > 发现 > 提取
    const cssFiles = [];
    let cssOrigin = 'none';
    if (entry.cssFiles && entry.cssFiles.length > 0) {
        cssOrigin = 'files';
        for (const rel of entry.cssFiles) {
            const relNorm = rel.replace(/^\.?\//, '');
            const abs = resolve(root, relNorm);
            if (abs.startsWith(root + sep) && existsSync(abs)) {
                cssFiles.push(abs);
                assets.set(relNorm, abs);
            }
            else
                warnings.push(`cssFiles 缺失: ${relNorm}`);
        }
    }
    else {
        walkCss(root, 3, cssFiles);
        if (cssFiles.length > 0)
            cssOrigin = 'discover';
    }
    let cssText = '';
    if (cssFiles.length > 0) {
        cssText = cssFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
    }
    else {
        for (const cand of ['lib/client.js', 'client.js', 'dist/client.js', 'lib/client.mjs']) {
            const abs = join(root, cand);
            if (!existsSync(abs))
                continue;
            const extracted = extractCssFromBundle(readFileSync(abs, 'utf8'));
            if (extracted.trim()) {
                cssText = extracted;
                cssOrigin = 'extract';
                break;
            }
        }
    }
    if (cssOrigin === 'none')
        warnings.push('未找到 CSS 资产（可配 cssFiles 显式声明）');
    if (cssText.trim())
        pack.baseCss = cssText;
    const pkgName = readJson(join(root, 'package.json'))?.name;
    pack.external = {
        kind: 'external-skin',
        source: entry.source,
        originalId: skinId,
        package: typeof pkgName === 'string' ? pkgName : typeof skin.package === 'string' ? skin.package : undefined,
        cssOrigin,
    };
    return { pack, root, assets, warnings };
}
