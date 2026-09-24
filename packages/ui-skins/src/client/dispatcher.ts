/**
 * 组件级分发：把 UiSpec.components 中的覆盖注册为对应 slot 的遮蔽 cell。
 *
 * 机制依据（dsh-client-ui-slots 的 SlotCore.register 语义）：
 *   - single 型：cell = slot 本身；keyed 型：同 key 为一个 cell；list 型：同 id 为一个 cell；
 *   - priority 是遮蔽排名：升序、默认 0、最小者渲染；占用中的 cell 以相同 priority 再注册会抛错，
 *     所以覆盖默认取 priority = -1（压过默认 0 的内建占用者）；
 *   - keyed 缺 key / list 缺 id 会抛错，故注册项按引用携带的 kind 形状字段原样传递。
 *
 * 关键性质：只有激活的皮肤对某个 slot 有覆盖时才注册 cell；
 * 没有覆盖就不占位，dsh 原生组件原样渲染（回退 = 不注册）。
 * 切换皮肤 = 释放旧注册 + 注册新注册，全部走 Cordis effect 生命周期
 * （ctx.slots.inject(key, cb) 把注册绑定到目标 slot 的声明生命周期）。
 */
import type { Context } from '@deepseek-ai/cordis'
import type { UiComponentRef, UiSpec } from '../types.ts'
import type { UiComponent, UiSkinsClient } from './registry.ts'

const OVERRIDE_ID_PREFIX = 'ui-skins:'
const DEFAULT_PRIORITY = -1

interface SlotRegistration {
  name: string
  key?: string
  id?: string
  order?: number
  priority?: number
}

interface SlotsLike {
  inject(slotKey: string, callback: () => () => void): () => void
  register(descriptor: SlotRegistration, component: UiComponent): () => void
}

export class SlotOverrideManager {
  private disposers: Array<() => void> = []

  constructor(
    private readonly ctx: Context,
    private readonly registry: UiSkinsClient,
  ) {}

  /** 按解析结果布置组件覆盖（先清空旧布置）。 */
  apply(spec: UiSpec): void {
    this.clear()
    const slots = (this.ctx as unknown as { slots: SlotsLike }).slots
    for (const [slotKey, ref] of Object.entries(spec.components)) {
      const component = this.registry.resolve(ref, slotKey)
      if (!component) continue
      const dispose = slots.inject(slotKey, () =>
        slots.register(makeRegistration(slotKey, ref), makeDispatcher(component)),
      )
      this.disposers.push(dispose)
    }
  }

  clear(): void {
    for (const dispose of this.disposers.splice(0)) {
      try {
        dispose()
      } catch {
        // 释放失败不阻塞重新布置
      }
    }
  }
}

function makeRegistration(slotKey: string, ref: UiComponentRef): SlotRegistration {
  const registration: SlotRegistration = {
    name: slotKey,
    priority: ref.priority ?? DEFAULT_PRIORITY,
  }
  // kind 形状字段只按需携带：keyed 用 key，list 用 id/order；
  // single 是 cell=slot 本身，多带 id 会被当成 list 形状导致不渲染。
  if (ref.key !== undefined) registration.key = ref.key
  if (ref.id !== undefined) registration.id = ref.id
  if (ref.order !== undefined) registration.order = ref.order
  return registration
}

/** 分发器：把 slot 组装后的 props 原样转发给皮肤组件（皮肤组件可读到该 slot 的标准 hooks）。 */
function makeDispatcher(component: UiComponent): UiComponent {
  return function UiSkinSlot(props) {
    return component(props)
  }
}
