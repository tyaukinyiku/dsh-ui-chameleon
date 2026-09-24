/**
 * ctx.uiSkinsController —— 浏览器可调用的 Remote 面（生成 ctx.remote.uiSkins）。
 * 真实构建里方法描述符/编解码由 Typert 生成；此处按文档签名实现 host 半。
 */
import { Remote } from '@deepseek-ai/dsh-typert-protocol'
import type { Context } from '@deepseek-ai/cordis'
import type {
  BindingLevel,
  ResolveRequest,
  UiLayerConfig,
  UiSkinsDescribe,
  UiSkinsFollowFrame,
  UiSpecEnvelope,
} from './types.ts'
import type { UiSkins } from './service.ts'

export class UiSkinsController {
  static inject = ['uiSkins']

  private readonly service: UiSkins

  constructor(ctx: Context) {
    this.service = (ctx as unknown as { uiSkins: UiSkins }).uiSkins
  }

  /** 解析目标（session/workspace）的最终 UI 规格。 */
  @Remote('resolve')
  async resolve(request: ResolveRequest): Promise<UiSpecEnvelope> {
    return this.service.resolve(request ?? {})
  }

  /** 已注册 pack、dsh 层默认值与观察器注册参数。 */
  @Remote('describe')
  describe(): UiSkinsDescribe {
    return this.service.describe()
  }

  /** 读一条工作区/会话绑定（未设置返回 null）。 */
  @Remote('getLayer')
  async getLayer(level: BindingLevel, id: string): Promise<UiLayerConfig | null> {
    assertLevel(level)
    return this.service.getLayer(level, id)
  }

  /** 写/删除（config = null）一条绑定；配置无效时响亮拒绝。 */
  @Remote('setLayer')
  async setLayer(level: BindingLevel, id: string, config: UiLayerConfig | null): Promise<void> {
    assertLevel(level)
    if (typeof id !== 'string' || !id) throw new Error('setLayer: 缺少 id')
    await this.service.setLayer(level, id, config)
  }

  /**
   * 变更流：baseline（含当前 packs）+ changed 增量（拉取模型，客户端自行重新 resolve）。
   */
  @Remote({ mode: 'stream' })
  async *follow(signal: AbortSignal): AsyncIterable<UiSkinsFollowFrame> {
    yield { kind: 'baseline', revision: this.service.revision, packs: this.service.listPacks() }
    const queue: UiSkinsFollowFrame[] = []
    let wake: (() => void) | undefined
    const unsubscribe = this.service.onChange(() => {
      queue.push({ kind: 'changed', revision: this.service.revision })
      wake?.()
      wake = undefined
    })
    const onAbort = () => {
      wake?.()
      wake = undefined
    }
    signal.addEventListener('abort', onAbort, { once: true })
    try {
      while (!signal.aborted) {
        while (queue.length > 0) yield queue.shift() as UiSkinsFollowFrame
        await new Promise<void>((resolve) => {
          wake = resolve
        })
      }
    } finally {
      unsubscribe()
      signal.removeEventListener('abort', onAbort)
    }
  }
}

function assertLevel(level: BindingLevel): void {
  if (level !== 'workspace' && level !== 'session') {
    throw new Error(`setLayer/getLayer: level 期望 'workspace' | 'session'，得到 ${String(level)}`)
  }
}
