/**
 * dsh-ui-skins 浏览器半入口（package.json 的 dsh.client + exports["./client"]）。
 *
 * 职责：
 *   1. 提供 ctx.uiSkinsClient —— UI pack 的组件注册表；
 *   2. 启动 SkinRuntime —— 目标跟踪 + host 解析 + 主题/布局/组件装配；
 *   3. 注册目标观察器（把当前 session 喂给运行时）与皮肤徽标。
 *
 * slot 形态（对齐 dsh-client-ui-slots 声明）：
 *   conversation.session.header.utilities —— list 型（id/order）
 *   conversation.session.header.actions  —— list 型（id/order）
 */
import type { Context } from '@deepseek-ai/cordis'
import { UiSkinsClient, type UiComponent } from './registry.ts'
import { SkinRuntime } from './runtime.ts'
import { UiSkinsHttpApi } from './api.ts'
import { makeBadge, makeObserver } from './observer.ts'

export type { UiClientPack, UiComponent, UiRenderable } from './registry.ts'
export { UiSkinsClient } from './registry.ts'
export { SkinRuntime } from './runtime.ts'
export { UiSkinsHttpApi } from './api.ts'

export const name = 'ui-skins/client'

/** slots: 组件布置与观察器/徽标注册。传输面走 /ui-skins/*（无需 remote）。 */
export const inject = ['slots']

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

interface SlotsLike {
  inject(slotKey: string, callback: () => () => void): () => void
  register(
    descriptor: { name: string; id: string; order?: number; priority?: number },
    component: UiComponent,
  ): () => void
}

export function apply(ctx: Context, config?: Partial<ClientConfig>): void {
  const options: ClientConfig = { ...DEFAULTS, ...config }
  // 服务实例化即注册；直接持有实例，避免未声明的 ctx 属性访问（cordis 严格依赖声明）。
  const registry = new UiSkinsClient(ctx) // 提供 ctx.uiSkinsClient
  const api = new UiSkinsHttpApi()
  const runtime = new SkinRuntime(document, ctx, api, registry)
  const slots = (ctx as unknown as { slots: SlotsLike }).slots

  // 观察器（list 型 cell）：session 作用域 slot → sessionId 上报。
  const observer = makeObserver(runtime)
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

  // 徽标（list 型 cell）：让当前皮肤可见（也是组件通路的自检）。
  const badge = makeBadge(() => {
    const applied = runtime.current()
    return applied ? `${applied.spec.packId ?? 'stock'}/${applied.spec.themeId ?? '-'}` : 'ui-skins'
  })
  ctx.effect(
    () =>
      slots.inject('conversation.session.header.actions', () =>
        slots.register({ name: 'conversation.session.header.actions', id: 'ui-skins-badge', order: 0 }, badge),
      ),
    'ui-skins: skin badge',
  )

  ctx.effect(() => {
    runtime.start()
    return () => runtime.dispose()
  }, 'ui-skins: runtime')
}
