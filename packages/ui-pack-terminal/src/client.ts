/**
 * dsh-ui-pack-terminal —— 浏览器半（组件面）：终端标记与角标。
 */
import { createElement as h } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { UiComponent } from 'dsh-ui-skins/client'

export const name = 'ui-pack-terminal/client'
export const inject = ['uiSkinsClient']

interface CornerProps {
  sessionId?: string
}

const TermMark: UiComponent = function TermMark() {
  return h('span', { 'data-ui-term-mark': '' }, '[>_ TERMINAL]')
}

const TermCorner: UiComponent = function TermCorner(props) {
  const { sessionId } = (props ?? {}) as CornerProps
  return h('span', { 'data-ui-term-corner': '', title: sessionId ? `session ${sessionId}` : 'terminal' }, 'tty0')
}

const components: Record<string, UiComponent> = {
  TermMark,
  TermCorner,
  'conversation.hero.brand.mark': TermMark,
  'sidebar.brand.mark': TermMark,
  'conversation.session.header.corner': TermCorner,
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const registry = (ctx as unknown as {
      uiSkinsClient: { register(pack: { id: string; components: Record<string, UiComponent> }): () => void }
    }).uiSkinsClient
    return registry.register({ id: 'terminal', components })
  }, 'ui-pack-terminal: register components')
}
