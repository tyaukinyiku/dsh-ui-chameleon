/**
 * 目标观察器：一个注册进 session 作用域 slot 的小组件。
 * session 作用域的 slot 会把 sessionId 放进组件 props（官方“组件输入”表），
 * 观察器把它上报给 SkinRuntime；工作区 id 由 host 侧经 workspaceRegistry 推导。
 *
 * slot 注册参数（slotKey/id/order）可配置——不同 dsh 版本的 slot 树可能演进，
 * 届时改配置即可，无需改代码（无硬编码可调参数）。
 */
import { createElement as h, useEffect } from 'react'
import type { UiComponent } from './registry.ts'
import type { SkinRuntime } from './runtime.ts'

interface ObserverProps {
  sessionId?: string
}

export function makeObserver(runtime: SkinRuntime): UiComponent {
  return function UiSkinsObserver(props) {
    const { sessionId } = (props ?? {}) as ObserverProps
    useEffect(() => {
      runtime.setTarget({ sessionId })
      return () => {
        runtime.setTarget({ sessionId: undefined } as { sessionId: string | undefined })
      }
    }, [sessionId])
    return null
  }
}

/** 皮肤徽标：顺带演示组件级覆盖的最小形态（真实构建返回 React 元素）。 */
export function makeBadge(getLabel: () => string): UiComponent {
  return function UiSkinsBadge() {
    return h('span', { 'data-ui-skins-badge': '' }, getLabel())
  }
}
