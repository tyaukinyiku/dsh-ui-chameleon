/**
 * 主题应用：把 UiSpec 的 token/css 落到 DOM。
 * token 写入 <html> 的 CSS 自定义属性；样式文本写入单个 <style id>；
 * pack/theme/layout id 写入 data-* 属性，供布局 CSS 精确作用域（如 [data-ui-layout="focus"]）。
 */
import type { UiSpec } from '../types.ts'

const STYLE_ID = 'dsh-ui-skins-style'

let appliedKeys: string[] = []

export function applySpecToDom(doc: Document, spec: UiSpec): void {
  const root = doc.documentElement

  for (const key of appliedKeys) root.style.removeProperty(key)
  appliedKeys = []
  for (const [key, value] of Object.entries(spec.tokens)) {
    root.style.setProperty(key, value)
    appliedKeys.push(key)
  }

  setAttr(doc, 'data-ui-pack', spec.packId)
  // 外部皮肤：body 属性激活开关（body + html 双挂，兼容 body[data-*] 作用域）。
  const g = doc as unknown as { __uiSkinsBodyAttr?: string | null }
  const prevAttr = g.__uiSkinsBodyAttr ?? null
  const nextAttr = spec.bodyAttr ?? null
  if (prevAttr !== nextAttr) {
    if (prevAttr) {
      doc.documentElement.removeAttribute(prevAttr)
      doc.body?.removeAttribute(prevAttr)
    }
    if (nextAttr) {
      doc.documentElement.setAttribute(nextAttr, '')
      doc.body?.setAttribute(nextAttr, '')
    }
    g.__uiSkinsBodyAttr = nextAttr
  }
  setAttr(doc, 'data-ui-theme', spec.themeId)
  setAttr(doc, 'data-ui-layout', spec.layoutId)

  let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = doc.createElement('style')
    style.id = STYLE_ID
    doc.head.appendChild(style)
  }
  style.textContent = spec.css
}

function setAttr(doc: Document, name: string, value: string | null): void {
  if (value) doc.documentElement.setAttribute(name, value)
  else doc.documentElement.removeAttribute(name)
}
