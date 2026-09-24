/**
 * dsh-ui-skins 浏览器半入口（package.json 的 dsh.client + exports["./client"]）。
 *
 * 职责：
 *   1. 提供 ctx.uiSkinsClient —— UI pack 的组件注册表；
 *   2. 启动 SkinRuntime —— 目标跟踪 + Remote 解析 + 主题/布局/组件装配；
 *   3. 注册目标观察器（把当前 session 喂给运行时）。
 */
import type { Context } from '@deepseek-ai/cordis'
import type { UiSkinsRemote } from '../types.ts'
import { UiSkinsClient, type UiComponent } from './registry.ts'
import { SkinRuntime } from './runtime.ts'
import { makeBadge, makeObserver } from './observer.ts'

export type { UiClientPack, UiComponent, UiRenderable } from './registry.ts'
export { UiSkinsClient } from './registry.ts'
export { SkinRuntime } from './runtime.ts'

export const name = 'ui-skins/client'

/** slots: 组件布置；remote: 与 host 的 uiSkins 控制器通信。 */
export const inject = ['slots', 'remote']

export interface ClientConfig {
  observerSlot: string
  observerId: string
  observerOrder: number
}

const DEFAULTS: ClientConfig = {
  observerSlot: 'conversation.session.header.utilities',
  observerId: 'ui-skins-observer',
  observerOrder: 0,
}

export function apply(ctx: Context, config?: Partial<ClientConfig>): void {
  const options: ClientConfig = { ...DEFAULTS, ...config }
  ctx.plugin(UiSkinsClient) // 提供 ctx.uiSkinsClient

  const registry = (ctx as unknown as { uiSkinsClient: UiSkinsClient }).uiSkinsClient
  // 真实构建里 ctx.remote.uiSkins 由 Typert 生成；此处按手写同形 face 取用。
  const remote = (ctx as unknown as { remote: { uiSkins: UiSkinsRemote } }).remote.uiSkins
  const runtime = new SkinRuntime(document, remote, registry)

  // 观察器：session 作用域 slot → sessionId 上报。
  const observer = makeObserver(runtime)
  const slots = (ctx as unknown as { slots: SlotsLike }).slots
  ctx.effect(
    () =>
      slots.inject(options.observerSlot, () =>
        slots.register(
          { name: options.observerSlot, id: options.observerId, order: options.observerOrder },
          observer,
        ),
      ),
    'ui-skins: target observer',
  )

  // 徽标：让当前皮肤可见（也是组件覆盖通路的自检）。
  const badge = makeBadge(() => {
    const applied = runtime.current()
    return applied ? `${applied.spec.packId ?? 'stock'}/${applied.spec.themeId ?? '-'}` : 'ui-skins'
  })
  ctx.effect(
    () =>
      slots.inject('conversation.session.header.actions', () =>
        slots.register(
          { name: 'conversation.session.header.actions', id: 'ui-skins-badge', order: 0 },
          badge,
        ),
      ),
    'ui-skins: skin badge',
  )

  ctx.effect(() => {
    void runtime.refresh()
    const stop = runtime.follow()
    return () => {
      stop()
      runtime.dispose()
    }
  }, 'ui-skins: runtime')
}

interface SlotsLike {
  inject(slotKey: string, callback: () => () => void): () => void
  register(
    descriptor: { name: string; id: string; order: number; entryKey?: string },
    component: UiComponent,
  ): () => void
}
