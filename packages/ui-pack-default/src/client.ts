/**
 * dsh-ui-pack-default —— 浏览器半（组件面）：注册 pack 组件。
 * 组件即普通渲染函数（真实 Web Client 中就是 React 组件，可使用全部标准 slot hooks）。
 */
import { createElement as h } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { UiComponent } from 'dsh-ui-skins/client'

export const name = 'ui-pack-default/client'
export const inject = ['uiSkinsClient']

const BrandMark: UiComponent = function BrandMark() {
  return h('span', { 'data-ui-brand': 'default' }, '◆ dsh')
}

const WorkspaceHint: UiComponent = function WorkspaceHint() {
  return h('small', { 'data-ui-hint': '' }, 'default skin')
}

const components: Record<string, UiComponent> = {
  // 契约键 = 组件名（UiComponentRef.name 指向它）；同时保留 slot key 别名，两种写法均可解析。
  BrandMark,
  'conversation.hero.brand.mark': BrandMark,
  'sidebar.brand.mark': BrandMark,
  WorkspaceHint,
  'conversation.hero.workspace': WorkspaceHint,
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const registry = (ctx as unknown as {
      uiSkinsClient: { register(pack: { id: string; components: Record<string, UiComponent> }): () => void }
    }).uiSkinsClient
    return registry.register({ id: 'default', components })
  }, 'ui-pack-default: register components')
}
