/**
 * SkinRuntime —— 浏览器侧装配运行时：
 *   跟踪目标（session/workspace） → Remote 解析 → 应用主题 + 布置组件覆盖 → 跟随变更流刷新。
 *
 * 目标来源是可插拔 seam：
 *   - 内置观察器（observer.ts）在 session 作用域 slot 中上报 props.sessionId；
 *   - 任何插件/组件也可调用 setTarget() 直接喂给运行时（例如工作区选择界面）。
 */
import type { UiSkinsRemote, UiSpecEnvelope, UiTarget } from '../types.ts'
import type { UiSkinsClient } from './registry.ts'
import { applySpecToDom } from './theme.ts'
import { SlotOverrideManager } from './dispatcher.ts'

export class SkinRuntime {
  private target: UiTarget = {}
  private applied?: UiSpecEnvelope
  private seq = 0
  private readonly overrides: SlotOverrideManager
  private readonly listeners = new Set<(envelope: UiSpecEnvelope) => void>()

  constructor(
    private readonly doc: Document,
    private readonly remote: UiSkinsRemote,
    registry: UiSkinsClient,
  ) {
    this.overrides = new SlotOverrideManager(registry.ctx as never, registry)
  }

  /** 喂入目标（浅合并）；变化时重新解析并应用。undefined 值清除该字段。 */
  setTarget(patch: UiTarget): void {
    let changed = false
    for (const key of ['sessionId', 'workspaceId', 'workspacePath'] as const) {
      if (patch[key] !== undefined && patch[key] !== this.target[key]) {
        this.target[key] = patch[key]
        changed = true
      } else if (patch[key] === undefined && this.target[key] !== undefined && key in patch) {
        delete this.target[key]
        changed = true
      }
    }
    if (changed) void this.refresh()
  }

  current(): UiSpecEnvelope | undefined {
    return this.applied
  }

  onChange(callback: (envelope: UiSpecEnvelope) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /** 重新解析并应用（后到者胜：并发调用按完成顺序应用，用 seq 防乱序）。 */
  async refresh(): Promise<void> {
    const seq = ++this.seq
    try {
      const envelope = await this.remote.resolve({ ...this.target })
      if (seq !== this.seq) return
      this.applied = envelope
      applySpecToDom(this.doc, envelope.spec)
      this.overrides.apply(envelope.spec)
      for (const warning of envelope.spec.warnings) console.warn(`[ui-skins] ${warning}`)
      for (const listener of this.listeners) listener(envelope)
    } catch (error) {
      console.warn('[ui-skins] 解析失败:', error)
    }
  }

  /** 跟随 host 变更流：pack 增删 / 绑定写入 / global 层变化 → 重新解析。返回停止函数。 */
  follow(): () => void {
    const controller = new AbortController()
    void (async () => {
      while (!controller.signal.aborted) {
        try {
          for await (const frame of this.remote.follow(controller.signal)) {
            if (controller.signal.aborted) return
            if (frame.kind === 'changed') void this.refresh()
          }
        } catch (error) {
          if (controller.signal.aborted) return
          console.warn('[ui-skins] 变更流中断，稍后重试:', error)
          await new Promise((resolve) => setTimeout(resolve, 3000))
          continue
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    })()
    return () => controller.abort()
  }

  dispose(): void {
    this.overrides.clear()
  }
}
