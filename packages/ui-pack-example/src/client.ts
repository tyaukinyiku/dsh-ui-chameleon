/**
 * dsh-ui-pack-example —— 浏览器半（组件面）。
 * 演示组件级覆盖：QuartzCorner 替换 conversation.session.header.corner 的展示。
 * 组件照常收到该 slot 的组装 props（owner props + 标准 hooks + inject face），可直接使用。
 */
import { createElement as h } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { UiComponent } from 'dsh-ui-skins/client'

export const name = 'ui-pack-example/client'
export const inject = ['uiSkinsClient']

interface CornerProps {
  sessionId?: string
}

const QuartzCorner: UiComponent = function QuartzCorner(props) {
  const { sessionId } = (props ?? {}) as CornerProps
  return h(
    'span',
    { 'data-quartz-corner': '', title: sessionId ? `session ${sessionId}` : 'quartz' },
    '◇ quartz',
  )
}

const components: Record<string, UiComponent> = {
  // 契约键 = 组件名（UiComponentRef.name 指向它）；同时保留 slot key 别名。
  QuartzCorner,
  'conversation.session.header.corner': QuartzCorner,
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const registry = (ctx as unknown as {
      uiSkinsClient: { register(pack: { id: string; components: Record<string, UiComponent> }): () => void }
    }).uiSkinsClient
    return registry.register({ id: 'quartz', components })
  }, 'ui-pack-example: register components')
}
