/**
 * host 面传输：/ui-skins/* HTTP 路由（host-webserver 的 route 注册 seam）。
 *
 * 为什么不是 Typert Remote：Typert 的 strict descriptor 需要构建期生成 + api-remotes
 * 显式收录（见 docs/api-gateway.md），树外插件无法在运行时挂载；API Gateway 文档为
 * 这种情况留了 “Feature-owned exact Fetch routes” 通路，host-webserver 提供
 * `register({ kind, path, handler })` 的 node:http 路由注册。
 *
 * 路由表：
 *   GET  /ui-skins/state              → UiSkinsDescribe
 *   GET  /ui-skins/workspaces         → 工作区列表 [{id, path}]（选择器的目标下拉）
 *   GET  /ui-skins/resolve?…          → UiSpecEnvelope（sessionId/workspaceId/workspacePath）
 *   GET  /ui-skins/binding?level=&id= → UiLayerConfig | null
 *   POST /ui-skins/binding            → body { level, id, config | null } → 204（400 携带错误）
 *   GET  /ui-skins/events             → SSE：revision 变更通知（拉取模型，客户端自行 resolve）
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type { BindingLevel, UiLayerConfig, UiTarget } from './types.ts'
import type { UiSkins } from './service.ts'
import type { ExternalPackAdapted } from './external.ts'
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'

export const UI_SKINS_ROUTE_BASE = '/ui-skins'

interface WebServerLike {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

/** 由 index.apply 以显式 service 实例调用（避免未声明的 ctx 属性访问）。 */
export function installHttpRoutes(ctx: Context, service: UiSkins, external: ExternalPackAdapted[] = []): void {
  const webServer = (ctx as unknown as { webServer?: WebServerLike }).webServer
  if (!webServer?.register) throw new Error('ui-skins: ctx.webServer 不可用')
  ctx.effect(
    () =>
      webServer.register({
        kind: 'prefix',
        path: UI_SKINS_ROUTE_BASE,
        handler: (req, res) => {
          void handle(service, external, req, res).catch((error: unknown) => {
            sendJson(res, 500, { error: String(error) })
          })
        },
      }),
    'ui-skins: http routes',
  )
}

function sendFile(res: ServerResponse, abs: string): void {
  const types: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.css': 'text/css; charset=utf-8',
  }
  res.writeHead(200, { 'content-type': types[extname(abs).toLowerCase()] ?? 'application/octet-stream' })
  res.end(readFileSync(abs))
}

async function handle(service: UiSkins, external: ExternalPackAdapted[], req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://ui-skins.invalid')
  const path = url.pathname.slice(UI_SKINS_ROUTE_BASE.length)
  const method = req.method ?? 'GET'

  if (method === 'GET' && path === '/state') {
    sendJson(res, 200, service.describe())
    return
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
    })
    return
  }
  if (method === 'GET' && path.startsWith('/external/')) {
    const rest = path.slice('/external/'.length)
    const hookAt = rest.indexOf('/hooks')
    if (hookAt > 0) {
      const item = external.find((e) => e.pack.id === rest.slice(0, hookAt))
      if (item?.hooks) {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
        res.end(item.hooks)
        return
      }
      sendJson(res, 404, { error: 'hooks not found' })
      return
    }
    const assetAt = rest.indexOf('/asset/')
    if (assetAt > 0) {
      const packId = rest.slice(0, assetAt)
      const rel = rest.slice(assetAt + '/asset/'.length)
      const item = external.find((e) => e.pack.id === packId)
      const abs = item?.assets.get(rel)
      if (abs) {
        sendFile(res, abs)
        return
      }
    }
    sendJson(res, 404, { error: 'asset not found' })
    return
  }
  if (method === 'GET' && path === '/resolve') {
    const target: UiTarget = {}
    const sessionId = url.searchParams.get('sessionId')
    const workspaceId = url.searchParams.get('workspaceId')
    const workspacePath = url.searchParams.get('workspacePath')
    if (sessionId) target.sessionId = sessionId
    if (workspaceId) target.workspaceId = workspaceId
    if (workspacePath) target.workspacePath = workspacePath
    sendJson(res, 200, await service.resolve(target))
    return
  }
  if (method === 'GET' && path === '/workspaces') {
    sendJson(res, 200, service.listWorkspaces())
    return
  }
  if (method === 'GET' && path === '/binding') {
    const level = url.searchParams.get('level')
    const id = url.searchParams.get('id')
    if (!assertLevel(level) || !id) {
      sendJson(res, 400, { error: '期望 level=workspace|session 与 id' })
      return
    }
    sendJson(res, 200, await service.getLayer(level, id))
    return
  }
  if (method === 'POST' && path === '/binding') {
    let body: { level?: unknown; id?: unknown; config?: unknown }
    try {
      body = JSON.parse(await readBody(req)) as typeof body
    } catch (error) {
      sendJson(res, 400, { error: `请求体不是合法 JSON: ${String(error)}` })
      return
    }
    const level = body.level
    const id = body.id
    if (!assertLevel(level) || typeof id !== 'string' || !id) {
      sendJson(res, 400, { error: '期望 { level: workspace|session, id: string, config: UiLayerConfig | null }' })
      return
    }
    const config = body.config === null ? null : (body.config as UiLayerConfig)
    try {
      await service.setLayer(level, id, config)
    } catch (error) {
      sendJson(res, 400, { error: String(error) })
      return
    }
    sendJson(res, 204, undefined)
    return
  }
  if (method === 'GET' && path === '/events') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    })
    const send = (revision: number): void => {
      res.write(`data: ${JSON.stringify({ revision })}\n\n`)
    }
    send(service.revision)
    const unsubscribe = service.onChange(() => send(service.revision))
    req.on('close', () => unsubscribe())
    return
  }
  sendJson(res, 404, { error: `未知路由 ${method} ${UI_SKINS_ROUTE_BASE}${path}` })
}

function assertLevel(level: unknown): level is BindingLevel {
  return level === 'workspace' || level === 'session'
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let text = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => {
      text += chunk
    })
    req.on('end', () => resolve(text))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  if (body === undefined) {
    res.writeHead(status)
    res.end()
    return
  }
  const text = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(text)
}
