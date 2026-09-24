/**
 * dsh-ui-pack-manuscript —— 浏览器半（组件面）：书刊标记与角标。
 */
import { createElement as h } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { UiComponent } from 'dsh-ui-skins/client'

export const name = 'ui-pack-manuscript/client'
export const inject = ['uiSkinsClient']

interface CornerProps {
  sessionId?: string
}

const MsMark: UiComponent = function MsMark() {
  return h('span', { 'data-ui-ms-mark': '' }, 'MANUSCRIPT')
}

const MsCorner: UiComponent = function MsCorner(props) {
  const { sessionId } = (props ?? {}) as CornerProps
  return h('span', { 'data-ui-ms-corner': '', title: sessionId ? `session ${sessionId}` : 'manuscript' }, 'folio · manuscript')
}

const components: Record<string, UiComponent> = {
  MsMark,
  MsCorner,
  'conversation.hero.brand.mark': MsMark,
  'sidebar.brand.mark': MsMark,
  'conversation.session.header.corner': MsCorner,
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const registry = (ctx as unknown as {
      uiSkinsClient: { register(pack: { id: string; components: Record<string, UiComponent> }): () => void }
    }).uiSkinsClient
    return registry.register({ id: 'manuscript', components })
  }, 'ui-pack-manuscript: register components')
}
