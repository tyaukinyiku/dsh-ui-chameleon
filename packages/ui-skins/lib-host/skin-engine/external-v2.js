/**
 * 外部皮肤 v2 引擎传输面（A 路线：渲染委托官方引擎语义）。
 *
 * 职责：
 *   1. 收编（installEngineAdaptation）：把适配器产出的外部单元（本地 v2 目录 /
 *      市场源 / v1 提取）经官方 CSS 安全管线（css-safety/transform.ts）验证，
 *      通过者标记 engineManaged —— 渲染整体交给 vendored skin-controller（原子
 *      activation、六层装饰层、L2 语义打标、完整 hooks 上下文），pack 不再自带
 *      CSS/bodyAttr/hooks（避免双轨渲染）；被安全管线拒绝者保留旧适配路径（fail-closed）。
 *   2. 传输：`/ui-skins/external/v2/*` 提供引擎所需 API 面——
 *        GET  /catalog                       → CatalogSkin[]（boot/选择器数据面）
 *        GET  /skins/<id>/stylesheet         → 安全管线变换后的主样式（:root 之外
 *                                              逐选择器锚定 html[data-dsh-skin]，派生 token 兜底）
 *        GET  /skins/<id>/patches            → 变换后的 L3 补丁（404 当缺省）
 *        GET  /skins/<id>/hooks.mjs          → 逃逸舱原文（provenance 信任门控）
 *        GET  /skins/<id>/<rel>              → 单元资产（白名单；市场源按需代理）
 *
 * 信任边界（对齐皮肤中心）：hooks.mjs 是可执行代码，只对①官方市场通道拉取、
 * ②dsh-market.provenance.json 字节验证、③reviewed-hooks 历史注册表 三种身份放行；
 * 其余单元 hooks 一律 404（声明式部分照常加载）。
 *
 * URL 解析语义（引擎约定）：stylesheet 经 <link> 挂载，相对 url() 以路由 URL
 * 为基准解析到 /skins/<id>/<rel>，故 CSS 文本不做绝对化改写。
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { MARKET_ASSET_BASE } from '../external.js';
import { transformSkinCss, SkinCssSafetyError } from './css-safety/transform.js';
import { verifyMarketProvenance, verifyReviewedLegacyHooks } from './provenance.js';
export const EXTERNAL_V2_PREFIX = '/ui-skins/external/v2';
function str(v, fallback = '') {
    return typeof v === 'string' && v ? v : fallback;
}
/** skin.json → 引擎 catalog 清单（缺省字段给最小可用值）。 */
function toCatalogManifest(skinId, raw, hasPatches, hasHooks, hooksEntry) {
    const contributesRaw = (raw?.contributes ?? {});
    const bg = contributesRaw.backgroundMedia;
    // buildBackgroundMedia 以 `${assetBase}/${src}` 拼接 → src 归一为无前导 ./
    const normalizeSrc = (v) => {
        if (!v || typeof v.src !== 'string' || !v.src)
            return undefined;
        const type = v.type === 'video' ? 'video' : 'image';
        return { type, src: v.src.replace(/^\.\//, ''), scrim: typeof v.scrim === 'string' ? v.scrim : undefined };
    };
    const previewRaw = raw?.preview;
    const preview = {
        light: str(previewRaw?.light, 'preview/light.webp'),
        dark: str(previewRaw?.dark, 'preview/dark.webp'),
    };
    const manifest = {
        id: skinId,
        name: str(raw?.name, skinId),
        nameEn: str(raw?.nameEn) || undefined,
        tagline: str(raw?.tagline) || undefined,
        description: str(raw?.description) || undefined,
        accent: str(raw?.accent) || undefined,
        order: typeof raw?.order === 'number' ? raw.order : undefined,
        author: str(raw?.author) || undefined,
        license: str(raw?.license) || undefined,
        attribution: str(raw?.attribution) || undefined,
        preview,
        tags: Array.isArray(raw?.tags) ? raw.tags.filter((t) => typeof t === 'string') : undefined,
        contributes: {
            stylesheet: 'stylesheet',
            ...(hasPatches ? { patches: 'patches' } : {}),
            ...(bg
                ? {
                    backgroundMedia: {
                        light: normalizeSrc(bg.light),
                        dark: normalizeSrc(bg.dark),
                    },
                }
                : {}),
        },
    };
    if (hasHooks) {
        manifest.facets = { client: { entry: hooksEntry, apiVersion: 'x-org.linxin666.skin-center/v1alpha1' } };
    }
    return manifest;
}
/**
 * 收编外部单元为引擎渲染：安全管线验证 + 信任判定 + pack 去双轨。
 * 返回引擎单元表（供传输面服务）；未通过者原样保留旧适配路径并进 warnings。
 */
export function installEngineAdaptation(external) {
    const units = [];
    for (const adapted of external) {
        if (!adapted.ok || !adapted.raw || !adapted.pack.external)
            continue;
        const raw = adapted.raw;
        const skinId = adapted.pack.external.originalId;
        if (!skinId || !raw.stylesheet.trim()) {
            adapted.warnings.push('引擎收编跳过：缺 skin id 或样式文本，走旧适配路径');
            continue;
        }
        // 安全管线预检（fail-closed）：:root 由管线锚定，url() 必须单元内相对。
        try {
            transformSkinCss(raw.stylesheet, { skinId, filename: 'skin.css' });
        }
        catch (error) {
            const detail = error instanceof SkinCssSafetyError ? error.violations.join('; ') : String(error);
            adapted.warnings.push(`引擎收编跳过（CSS 安全管线拒绝），走旧适配路径：${detail}`);
            continue;
        }
        const manifestRaw = raw.manifest;
        const facets = (manifestRaw?.facets ?? {});
        const hooksEntry = typeof facets.client?.entry === 'string' && facets.client.entry ? facets.client.entry : 'hooks.mjs';
        const hasHooks = !!adapted.hooks && adapted.hooks.trim().length > 0;
        // 信任门控（对齐皮肤中心 provenance 模型）：
        //   市场源 = 官方市场通道（同源已审内容）；
        //   本地目录 = dsh-market.provenance.json 字节验证 或 reviewed-hooks 历史注册表。
        const hooksTrusted = hasHooks &&
            (raw.market === true ||
                (adapted.root !== '' &&
                    (verifyMarketProvenance(adapted.root, skinId, hooksEntry) ||
                        verifyReviewedLegacyHooks(adapted.root, skinId, hooksEntry))));
        if (hasHooks && !hooksTrusted) {
            adapted.warnings.push(`hooks 未通过 provenance 信任门控（仅声明式部分生效；如需完整美术层请从 dsh-market.com 安装）`);
        }
        const unit = {
            packId: adapted.pack.id,
            skinId,
            root: adapted.root,
            manifest: toCatalogManifest(skinId, manifestRaw, raw.patches !== undefined && raw.patches.trim().length > 0, hasHooks && hooksTrusted, hooksEntry),
            stylesheet: raw.stylesheet,
            patches: raw.patches,
            hooks: hasHooks && hooksTrusted ? adapted.hooks : undefined,
            hooksEntry: hasHooks && hooksTrusted ? hooksEntry : null,
            hooksTrusted,
            assets: adapted.assets,
            remoteAssets: raw.remoteAssets,
            market: raw.market === true,
            warnings: adapted.warnings,
        };
        units.push(unit);
        // 去双轨：渲染归引擎，pack 只留元数据（选择器卡片/三层绑定）。
        adapted.pack.baseCss = undefined;
        adapted.pack.bodyAttr = undefined;
        adapted.pack.hooksUrl = undefined;
        adapted.pack.assetBase = undefined;
        adapted.pack.external.engineManaged = true;
    }
    return units;
}
// ---------------------------------------------------------------------------
// 传输面：/ui-skins/external/v2/*
// ---------------------------------------------------------------------------
function sendText(res, type, text) {
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' });
    res.end(text);
}
function sendBytes(res, type, buf) {
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' });
    res.end(buf);
}
const ASSET_TYPES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.css': 'text/css; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
};
function assetType(rel) {
    const dot = rel.lastIndexOf('.');
    return dot >= 0 ? (ASSET_TYPES[rel.slice(dot).toLowerCase()] ?? 'application/octet-stream') : 'application/octet-stream';
}
/** 处理 /ui-skins/external/v2/*（path = 前缀之后的部分，以 / 开头）。 */
export async function handleExternalV2(path, req, res, units) {
    if (path === '/catalog') {
        const catalog = units.map((u) => ({
            origin: u.market ? 'builtin' : 'user',
            warnings: u.warnings,
            manifest: u.manifest,
        }));
        sendText(res, 'application/json', JSON.stringify(catalog));
        return true;
    }
    const m = path.match(/^\/skins\/([^/]+)(?:\/(.*))?$/);
    if (!m)
        return false;
    const unit = units.find((u) => u.skinId === decodeURIComponent(m[1]));
    if (!unit) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'skin-not-found' }));
        return true;
    }
    const sub = m[2] ?? '';
    if (sub === 'stylesheet' || sub === 'patches') {
        const isMain = sub === 'stylesheet';
        const text = isMain ? unit.stylesheet : unit.patches;
        if (text === undefined || !text.trim()) {
            res.writeHead(404, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: isMain ? 'stylesheet-not-found' : 'no-patches' }));
            return true;
        }
        try {
            // 主样式派生 token 兜底（官方同款：未重映射的官方 token 继承皮肤色调）；patches 不再派生。
            const { code, warnings } = transformSkinCss(text, {
                skinId: unit.skinId,
                filename: isMain ? 'skin.css' : 'patches.css',
                deriveFallbacks: isMain,
            });
            if (warnings.length > 0)
                console.warn(`[ui-skins] css-safety ${unit.skinId}/${sub}:`, warnings.join('; '));
            sendText(res, 'text/css; charset=utf-8', code);
        }
        catch (error) {
            const violations = error instanceof SkinCssSafetyError ? error.violations : [String(error)];
            console.warn(`[ui-skins] css-safety 拒绝 ${unit.skinId}/${sub}:`, violations.join('; '));
            res.writeHead(400, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'css-safety-rejected', violations }));
        }
        return true;
    }
    if (sub === 'hooks.mjs') {
        if (unit.hooks === undefined || unit.hooksEntry === null) {
            res.writeHead(404, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'hooks-not-served', trusted: unit.hooksTrusted }));
            return true;
        }
        sendText(res, 'text/javascript; charset=utf-8', unit.hooks);
        return true;
    }
    // 资产：本地白名单 > 市场远程代理
    const rel = sub;
    if (rel.includes('..') || rel.includes('\0')) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'bad-asset-path' }));
        return true;
    }
    const abs = unit.assets.get(rel);
    if (abs !== undefined) {
        // 白名单即约束：map 键在适配期以单元根递归登记，abs 只可能位于单元内。
        const resolved = resolve(abs);
        if (existsSync(resolved)) {
            sendBytes(res, assetType(rel), new Uint8Array(readFileSync(resolved)));
            return true;
        }
    }
    if (unit.market) {
        try {
            const remote = unit.remoteAssets.get(rel) ?? `${MARKET_ASSET_BASE}/${encodeURIComponent(unit.skinId)}/${rel}`;
            const upstream = await fetch(remote, { method: req.method === 'HEAD' ? 'HEAD' : 'GET' });
            if (!upstream.ok) {
                res.writeHead(502, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ error: 'market-asset-upstream', status: upstream.status }));
                return true;
            }
            const buf = new Uint8Array(await upstream.arrayBuffer());
            sendBytes(res, assetType(rel), buf);
        }
        catch (error) {
            res.writeHead(502, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'market-asset-fetch-failed', detail: String(error) }));
        }
        return true;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'asset-not-found' }));
    return true;
}
