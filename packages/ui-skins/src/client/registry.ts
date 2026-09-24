/**
 * ctx.uiSkinsClient —— 浏览器半的组件注册表。
 * UI pack 的 ./client 入口在这里按 (packId, name) 注册渲染组件；
 * 三级解析产出的 UiComponentRef 在运行时解析到具体组件。
 *
 * 注意：slot 注册表本身不依赖 React（dsh-client-ui-slots 是类型代数 + 注册表），
 * 因此这里用中性的 UiComponent 形态；真实 Web Client 中组件即 React 组件。
 */
import { Service, type Context } from '@deepseek-ai/cordis'
import type { UiComponentRef } from '../types.ts'

export type UiRenderable = unknown
export type UiComponent<P = Record<string, unknown>> = (props: P) => UiRenderable

export interface UiClientPack {
  /** 与 host 半 UiPackDescriptor.id 一致。 */
  id: string
  /** 组件名 -> 渲染组件。 */
  components: Record<string, UiComponent>
}

export class UiSkinsClient extends Service {
  static inject = []

  private readonly packs = new Map<string, Map<string, UiComponent>>()
  private readonly missing = new Set<string>()

  constructor(ctx: Context) {
    super(ctx, 'uiSkinsClient')
  }

  /**
   * 注册一个 UI pack 的组件面。
   * 调用方用 ctx.effect(() => ctx.uiSkinsClient.register(...)) 包裹以绑定插件生命周期。
   */
  register(pack: UiClientPack): () => void {
    if (!pack?.id) throw new Error('uiSkinsClient.register: 缺少 pack.id')
    const table = new Map(Object.entries(pack.components))
    this.packs.set(pack.id, table)
    this.missing.clear()
    return () => {
      if (this.packs.get(pack.id) === table) this.packs.delete(pack.id)
    }
  }

  /** 按引用解析组件；未注册时返回 undefined 并去重告警一次。 */
  resolve(ref: UiComponentRef): UiComponent | undefined {
    const component = this.packs.get(ref.pack)?.get(ref.name)
    if (!component) {
      const key = `${ref.pack}/${ref.name}`
      if (!this.missing.has(key)) {
        this.missing.add(key)
        console.warn(`[ui-skins] 组件未注册: ${key}（对应 pack 的 ./client 入口是否加载？）`)
      }
    }
    return component
  }
}
