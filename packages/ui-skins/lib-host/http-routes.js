import { handleExternalV2 } from './skin-engine/external-v2.js';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
export const UI_SKINS_ROUTE_BASE = '/ui-skins';
/** 由 index.apply 以显式 service 实例调用（避免未声明的 ctx 属性访问）。 */
export function installHttpRoutes(ctx, service, external = [], units = []) {
    const webServer = ctx.webServer;
    if (!webServer?.register)
        throw new Error('ui-skins: ctx.webServer 不可用');
    ctx.effect(() => webServer.register({
        kind: 'prefix',
        path: UI_SKINS_ROUTE_BASE,
        handler: (req, res) => {
            void handle(service, external, units, req, res).catch((error) => {
                sendJson(res, 500, { error: String(error) });
            });
        },
    }), 'ui-skins: http routes');
}
function sendFile(res, abs) {
    const types = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.css': 'text/css; charset=utf-8',
    };
    res.writeHead(200, { 'content-type': types[extname(abs).toLowerCase()] ?? 'application/octet-stream' });
    res.end(readFileSync(abs));
}
async function handle(service, external, units, req, res) {
    const url = new URL(req.url ?? '/', 'http://ui-skins.invalid');
    const path = url.pathname.slice(UI_SKINS_ROUTE_BASE.length);
    // 引擎 v2 传输面（catalog / stylesheet / patches / hooks / 资产）
    if (path === '/external/v2' || path.startsWith('/external/v2/')) {
        const sub = path.slice('/external/v2'.length) || '/';
        if (await handleExternalV2(sub, req, res, units))
            return;
    }
    const method = req.method ?? 'GET';
    if (method === 'GET' && path === '/state') {
        sendJson(res, 200, service.describe());
        return;
    }
    if (method === 'GET' && path === '/external') {
        sendJson(res, 200, {
            packs: external.map((e) => ({
                id: e.pack.id,
                title: e.pack.title,
                description: e.pack.description,
                bodyAttr: e.pack.bodyAttr ?? null,
                preview: e.pack.preview ?? null,
                external: e.pack.external ?? null,
                warnings: e.warnings,
            })),
        });
        return;
    }
    if (method === 'GET' && path.startsWith('/external/')) {
        const rest = path.slice('/external/'.length);
        const hookAt = rest.indexOf('/hooks');
        if (hookAt > 0) {
            const item = external.find((e) => e.pack.id === rest.slice(0, hookAt));
            if (item?.hooks) {
                res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
                res.end(item.hooks);
                return;
            }
            sendJson(res, 404, { error: 'hooks not found' });
            return;
        }
        const assetAt = rest.indexOf('/asset/');
        if (assetAt > 0) {
            const packId = rest.slice(0, assetAt);
            const rel = rest.slice(assetAt + '/asset/'.length);
            const item = external.find((e) => e.pack.id === packId);
            const abs = item?.assets.get(rel);
            if (abs) {
                sendFile(res, abs);
                return;
            }
        }
        sendJson(res, 404, { error: 'asset not found' });
        return;
    }
    if (method === 'GET' && path === '/resolve') {
        const target = {};
        const sessionId = url.searchParams.get('sessionId');
        const workspaceId = url.searchParams.get('workspaceId');
        const workspacePath = url.searchParams.get('workspacePath');
        if (sessionId)
            target.sessionId = sessionId;
        if (workspaceId)
            target.workspaceId = workspaceId;
        if (workspacePath)
            target.workspacePath = workspacePath;
        sendJson(res, 200, await service.resolve(target));
        return;
    }
    if (method === 'GET' && path === '/workspaces') {
        sendJson(res, 200, service.listWorkspaces());
        return;
    }
    if (method === 'GET' && path === '/binding') {
        const level = url.searchParams.get('level');
        const id = url.searchParams.get('id');
        if (!assertLevel(level) || !id) {
            sendJson(res, 400, { error: '期望 level=workspace|session 与 id' });
            return;
        }
        sendJson(res, 200, await service.getLayer(level, id));
        return;
    }
    if (method === 'POST' && path === '/binding') {
        let body;
        try {
            body = JSON.parse(await readBody(req));
        }
        catch (error) {
            sendJson(res, 400, { error: `请求体不是合法 JSON: ${String(error)}` });
            return;
        }
        const level = body.level;
        const id = body.id;
        if (!assertLevel(level) || typeof id !== 'string' || !id) {
            sendJson(res, 400, { error: '期望 { level: workspace|session, id: string, config: UiLayerConfig | null }' });
            return;
        }
        const config = body.config === null ? null : body.config;
        try {
            await service.setLayer(level, id, config);
        }
        catch (error) {
            sendJson(res, 400, { error: String(error) });
            return;
        }
        sendJson(res, 204, undefined);
        return;
    }
    if (method === 'GET' && path === '/events') {
        res.writeHead(200, {
            'content-type': 'text/event-stream',
            'cache-control': 'no-cache',
            connection: 'keep-alive',
        });
        const send = (revision) => {
            res.write(`data: ${JSON.stringify({ revision })}\n\n`);
        };
        send(service.revision);
        const unsubscribe = service.onChange(() => send(service.revision));
        req.on('close', () => unsubscribe());
        return;
    }
    sendJson(res, 404, { error: `未知路由 ${method} ${UI_SKINS_ROUTE_BASE}${path}` });
}
function assertLevel(level) {
    return level === 'workspace' || level === 'session';
}
function readBody(req) {
    return new Promise((resolve, reject) => {
        let text = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
            text += chunk;
        });
        req.on('end', () => resolve(text));
        req.on('error', reject);
    });
}
function sendJson(res, status, body) {
    if (body === undefined) {
        res.writeHead(status);
        res.end();
        return;
    }
    const text = JSON.stringify(body);
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(text);
}
