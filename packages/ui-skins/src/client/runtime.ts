/**
 * SkinRuntime —— 浏览器侧装配运行时：
 *   跟踪目标（session/workspace） → host 解析 → 应用主题 + 布置组件覆盖 → 跟随变更流刷新。
 *
 * 目标来源是可插拔 seam：
 *   - 内置观察器（observer.ts）在 session 作用域 slot 中上报 props.sessionId；
 *   - 任何插件/组件也可调用 setTarget() 直接喂给运行时（例如工作区选择界面）。
 */
import type { Context } from '@deepseek-ai/cordis'
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
  private stopChanges?: () => void

  constructor(
    private readonly doc: Document,
    private readonly ctx: Context,
    private readonly remote: UiSkinsRemote,
    registry: UiSkinsClient,
  ) {
    this.overrides = new SlotOverrideManager(ctx, registry)
  }

  /** 喂入目标（浅合并）；变化时重新解析并应用。 */
  setTarget(patch: UiTarget): void {
    let changed = false
    for (const key of ['sessionId', 'workspaceId', 'workspacePath'] as const) {
      if (patch[key] !== undefined && patch[key] !== this.target[key]) {
        this.target[key] = patch[key]
        changed = true
      } else if (patch[key] === undefined && key in patch && this.target[key] !== undefined) {
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

  /** 重新解析并应用（后到者胜：seq 防乱序）。 */
  async refresh(): Promise<void> {
    const seq = ++this.seq
    try {
      const envelope = await this.remote.resolve({ ...this.target })
      if (seq !== this.seq) return
      if (!envelope?.spec) {
        console.warn('[ui-skins] 解析结果缺 spec：', envelope)
        return
      }
      this.applied = envelope
      applySpecToDom(this.doc, envelope.spec)
      void syncHooks(this.doc, envelope.spec)
      this.overrides.apply(envelope.spec)
      for (const warning of envelope.spec.warnings) console.warn(`[ui-skins] ${warning}`)
      for (const listener of this.listeners) listener(envelope)
    } catch (error) {
      console.warn('[ui-skins] 解析失败:', error)
    }
  }

  /** 跟随 host 变更流（SSE）：pack 增删 / 绑定写入 / global 层变化 → 重新解析。 */
  start(): void {
    this.stopChanges?.()
    this.stopChanges = this.remote.changes(() => {
      void this.refresh()
    })
    void this.refresh()
  }

  dispose(): void {
    this.stopChanges?.()
    this.stopChanges = undefined
    this.overrides.clear()
  }
}

// ---------------------------------------------------------------------------
// 官方 hooks 契约挂载（x-org.linxin666.skin-center/v1alpha1）：
// 模块加载不执行任何东西；apply(ctx) 拥有全部 DOM 写入并通过 ctx.onCleanup 登记回收。
// 激活 pack 时挂载、切走时回收——美术/装饰层与原生渲染一致，且保留会话/工作区分层。
// ---------------------------------------------------------------------------
let hooksCleanups: Array<() => void> = []
let hooksPackId: string | null = null

async function syncHooks(
  doc: Document,
  spec: { packId: string | null; hooks?: { url: string; assetBase: string } | null },
): Promise<void> {
  const nextId = spec.hooks ? spec.packId : null
  if (nextId === hooksPackId) return
  for (const fn of hooksCleanups.splice(0)) {
    try {
      fn()
    } catch {
      /* 回收容错 */
    }
  }
  doc.documentElement.removeAttribute('data-ui-hooks')
  hooksPackId = nextId
  if (!spec.hooks) return
  try {
    // 经 <script type="module"> + blob URL 原生执行（TS 会把 import() 转成 require(url) 而失效）
    const res = await fetch(spec.hooks.url)
    if (!res.ok) return
    const text = await res.text()
    const blobUrl = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }))
    const done = new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 8000)
      const onDone = (): void => {
        clearTimeout(timer)
        resolve()
      }
      window.addEventListener('uiskins-hooks-done', onDone, { once: true })
    })
    ;(window as unknown as { __uiSkinsHooksPending?: unknown }).__uiSkinsHooksPending = {
      assetBase: spec.hooks.assetBase,
      cleanups: hooksCleanups,
    }
    const el = doc.createElement('script')
    el.type = 'module'
    el.textContent =
      `import * as m from ${JSON.stringify(blobUrl)};` +
      `const s = window.__uiSkinsHooksPending;` +
      `if (typeof m.apply === 'function') m.apply({ assetBase: s.assetBase, onCleanup: (fn) => s.cleanups.push(fn) });` +
      `window.dispatchEvent(new Event('uiskins-hooks-done'));`
    doc.head.appendChild(el)
    await done
    URL.revokeObjectURL(blobUrl)
    doc.documentElement.setAttribute('data-ui-hooks', spec.packId ?? '')
  } catch {
    /* hooks 失败不拖垮皮肤基础层 */
  }
}
