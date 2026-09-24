/**
 * 组件级分发：把 UiSpec.components 中的覆盖注册为对应 slot 的遮蔽 cell。
 *
 * 机制依据（官方 Slots 文档）：
 *   - “复用已有 cell 表示有意替换其展示”——single/keyed 型 slot 以更小 order 遮蔽原占用者；
 *   - “向其他包的 slot 贡献功能时使用 ctx.slots.inject(key, callback)”——owner 存续期内运行，
 *     owner 折叠时随 effect 移除。
 *
 * 关键性质：只有激活的皮肤对某个 slot 有覆盖时才注册 cell；
 * 没有覆盖就不占位，dsh 原生组件原样渲染（回退 = 不注册）。
 * 切换皮肤 = 释放旧注册 + 注册新注册，全部走 Cordis effect 生命周期。
 */
import type { Context } from '@deepseek-ai/cordis'
import type { UiComponentRef, UiSpec } from '../types.ts'
import type { UiComponent, UiSkinsClient } from './registry.ts'

const OVERRIDE_ID_PREFIX = 'ui-skins:'

interface SlotsLike {
  inject(slotKey: string, callback: () => () => void): () => void
  register(descriptor: SlotRegistration, component: UiComponent): () => void
}

interface SlotRegistration {
  name: string
  id: string
  order: number
  entryKey?: string
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
      const component = this.registry.resolve(ref)
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
    id: `${OVERRIDE_ID_PREFIX}${ref.pack}:${ref.name}`,
    order: ref.order ?? -100, // 数值越小越先渲染/遮蔽；默认压过常规贡献（示例常规贡献 order=100）
  }
  if (ref.entryKey !== undefined) registration.entryKey = ref.entryKey
  return registration
}

/** 分发器：把 slot 组装后的 props 原样转发给皮肤组件（皮肤组件可读到该 slot 的标准 hooks）。 */
function makeDispatcher(component: UiComponent): UiComponent {
  return function UiSkinSlot(props) {
    return component(props)
  }
}
