/**
 * host 面 API 的浏览器实现：/ui-skins/* fetch + SSE（实现 types.ts 的 UiSkinsRemote）。
 * 同源请求；POST 为 application/json（非简单请求，浏览器 CORS 预检默认被拒）。
 */
import type {
  BindingLevel,
  ResolveRequest,
  UiLayerConfig,
  UiSkinsDescribe,
  UiSkinsRemote,
  UiSpecEnvelope,
} from '../types.ts'

const BASE = '/ui-skins'

export class UiSkinsHttpApi implements UiSkinsRemote {
  async resolve(request: ResolveRequest): Promise<UiSpecEnvelope> {
    const query = new URLSearchParams()
    if (request.sessionId) query.set('sessionId', request.sessionId)
    if (request.workspaceId) query.set('workspaceId', request.workspaceId)
    if (request.workspacePath) query.set('workspacePath', request.workspacePath)
    return this.json('GET', `/resolve?${query.toString()}`)
  }

  async describe(): Promise<UiSkinsDescribe> {
    return this.json('GET', '/state')
  }

  async getLayer(level: BindingLevel, id: string): Promise<UiLayerConfig | null> {
    const query = new URLSearchParams({ level, id })
    return this.json('GET', `/binding?${query.toString()}`)
  }

  async setLayer(level: BindingLevel, id: string, config: UiLayerConfig | null): Promise<void> {
    const response = await fetch(`${BASE}/binding`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ level, id, config }),
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(`ui-skins.setLayer 失败(${response.status}): ${body.error ?? response.statusText}`)
    }
  }

  changes(onChange: (revision: number) => void): () => void {
    const source = new EventSource(`${BASE}/events`)
    source.onmessage = (event: MessageEvent<string>) => {
      try {
        const frame = JSON.parse(event.data) as { revision?: number }
        if (typeof frame.revision === 'number') onChange(frame.revision)
      } catch {
        // 忽略畸形帧
      }
    }
    return () => source.close()
  }

  private async json<T>(method: 'GET' | 'POST', path: string): Promise<T> {
    const response = await fetch(`${BASE}${path}`, { method })
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(`ui-skins${path} 失败(${response.status}): ${body.error ?? response.statusText}`)
    }
    return (await response.json()) as T
  }
}
