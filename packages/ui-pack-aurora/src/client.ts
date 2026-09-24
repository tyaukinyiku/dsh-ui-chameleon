/**
 * dsh-ui-pack-aurora —— 浏览器半（组件面）：极光标记与角标。
 */
import { createElement as h } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { UiComponent } from 'dsh-ui-skins/client'

export const name = 'ui-pack-aurora/client'
export const inject = ['uiSkinsClient']

interface CornerProps {
  sessionId?: string
}

const AuroraMark: UiComponent = function AuroraMark() {
  return h('span', { 'data-ui-aurora-mark': '' }, '✦ AURORA')
}

const AuroraCorner: UiComponent = function AuroraCorner(props) {
  const { sessionId } = (props ?? {}) as CornerProps
  return h('span', { 'data-ui-aurora-corner': '', title: sessionId ? `session ${sessionId}` : 'aurora' }, 'AURORA ✦')
}

const components: Record<string, UiComponent> = {
  AuroraMark,
  AuroraCorner,
  'conversation.hero.brand.mark': AuroraMark,
  'sidebar.brand.mark': AuroraMark,
  'conversation.session.header.corner': AuroraCorner,
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const registry = (ctx as unknown as {
      uiSkinsClient: { register(pack: { id: string; components: Record<string, UiComponent> }): () => void }
    }).uiSkinsClient
    return registry.register({ id: 'aurora', components })
  }, 'ui-pack-aurora: register components')
}
