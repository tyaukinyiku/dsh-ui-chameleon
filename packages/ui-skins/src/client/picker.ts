/**
 * picker.ts —— UI/UX 皮肤选择器（配置界面）。
 *
 * 入口：会话头部的皮肤按钮 / 侧栏脚部调色板按钮 → openPicker()。
 * 能力：列出插件已集成的全部 UI pack（色板预览）→ 选主题/布局 →
 * 应用到【当前会话】或【指定工作区】；支持清除本层覆盖（回落下层继承）。
 *
 * 纯 DOM 实现（不依赖 React/皮肤 tokens，任何皮肤下都可读可点）。
 */
import type { UiPackDescriptor, UiSkinsRemote, UiSpecEnvelope } from '../types.ts'
import { createElement as h } from 'react'

export interface PickerOptions {
  api: UiSkinsRemote
  sessionId?: string
  workspaceId?: string
}

type Target = { kind: 'session'; id: string } | { kind: 'workspace'; id: string }

const STYLE_ID = 'dsh-ui-skins-picker-style'

const STYLE = `
.ui-skins-overlay { position: fixed; inset: 0; z-index: 2147483000; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif; }
.ui-skins-panel { width: min(680px, 92vw); max-height: 86vh; overflow: auto; border-radius: 12px;
  background: #14161c; color: #e8eaf0; padding: 20px 22px; box-shadow: 0 18px 60px rgba(0,0,0,.55);
  border: 1px solid #2a2e38; }
.ui-skins-panel h3 { margin: 0 0 4px; font-size: 16px; }
.ui-skins-panel .sub { color: #98a0b0; font-size: 12px; margin-bottom: 14px; }
.ui-skins-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 10px 0; }
.ui-skins-row .lbl { font-size: 12px; color: #98a0b0; min-width: 56px; }
.ui-skins-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; margin: 8px 0 4px; }
.ui-skins-card { border: 1px solid #2a2e38; border-radius: 10px; padding: 10px; cursor: pointer; background: #1a1d25; }
.ui-skins-card:hover { border-color: #4a5060; }
.ui-skins-card.sel { border-color: #7c9cff; box-shadow: 0 0 0 1px #7c9cff inset; }
.ui-skins-card .ttl { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.ui-skins-card .desc { font-size: 11px; color: #98a0b0; margin-top: 4px; min-height: 26px; }
.ui-skins-swatch { display: inline-flex; border-radius: 4px; overflow: hidden; border: 1px solid #2a2e38; }
.ui-skins-swatch i { width: 12px; height: 12px; display: inline-block; }
.ui-skins-chip { border: 1px solid #2a2e38; background: #1a1d25; color: #e8eaf0; border-radius: 999px;
  padding: 4px 12px; font-size: 12px; cursor: pointer; }
.ui-skins-chip:hover { border-color: #4a5060; }
.ui-skins-chip.sel { border-color: #7c9cff; background: #232a3d; }
.ui-skins-radio { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; }
.ui-skins-select { background: #1a1d25; color: #e8eaf0; border: 1px solid #2a2e38; border-radius: 6px;
  padding: 4px 8px; font-size: 12px; max-width: 320px; }
.ui-skins-foot { display: flex; gap: 10px; align-items: center; margin-top: 16px; }
.ui-skins-btn { border: 1px solid #2a2e38; background: #1a1d25; color: #e8eaf0; border-radius: 8px;
  padding: 7px 16px; font-size: 13px; cursor: pointer; }
.ui-skins-btn.primary { background: #3355dd; border-color: #3355dd; color: #fff; }
.ui-skins-btn.danger { color: #ff8f8f; }
.ui-skins-btn:hover { filter: brightness(1.15); }
.ui-skins-status { font-size: 12px; color: #8fd48f; margin-left: auto; }
@media (prefers-color-scheme: light) {
  .ui-skins-panel { background: #f7f8fa; color: #1c1f26; border-color: #d8dce4; }
  .ui-skins-card, .ui-skins-chip, .ui-skins-btn, .ui-skins-select { background: #fff; color: #1c1f26; border-color: #d8dce4; }
  .ui-skins-card.sel, .ui-skins-chip.sel { border-color: #3355dd; box-shadow: 0 0 0 1px #3355dd inset; }
  .ui-skins-btn.primary { background: #3355dd; color: #fff; }
}
`

function ensureStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = STYLE
  doc.head.appendChild(style)
}

function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value
    else node.setAttribute(key, value)
  }
  for (const child of children) node.append(child)
  return node
}

function swatchOf(pack: UiPackDescriptor): HTMLElement {
  const tokens = pack.baseTokens ?? {}
  const wrap = el(document, 'span', { class: 'ui-skins-swatch' })
  wrap.append(el(document, 'i', { style: `background:${tokens['--ui-bg'] ?? '#000'}` }))
  wrap.append(el(document, 'i', { style: `background:${tokens['--ui-accent'] ?? '#888'}` }))
  return wrap
}

/** 皮肤按钮（list 型 cell）：点击打开选择器；label 可自定义。 */
export function makePickerButton(
  options: PickerOptions | ((props: Record<string, unknown>) => PickerOptions),
  label = '🎨 皮肤',
  title = '配置 UI/UX（工作区 / 会话）',
): (props: Record<string, unknown>) => unknown {
  return function UiSkinsPickerButton(props) {
    const resolved = typeof options === 'function' ? options(props ?? {}) : options
    return h(
      'button',
      {
        type: 'button',
        'data-ui-skins-picker': '',
        title,
        onClick: () => {
          void openPicker(resolved).catch((error: unknown) => console.warn('[ui-skins] 皮肤选择器打开失败:', error))
        },
      },
      label,
    )
  }
}

/** 打开皮肤选择器（幂等：同一时刻仅一个实例）。 */
export async function openPicker(options: PickerOptions): Promise<void> {
  const doc = document
  if (doc.querySelector('.ui-skins-overlay')) return
  ensureStyle(doc)

  const { api } = options
  const [state, workspaces, current] = await Promise.all([
    api.describe(),
    api.listWorkspaces().catch(() => []),
    api.resolve({ sessionId: options.sessionId, workspaceId: options.workspaceId }),
  ])
  const spec = current.spec

  // ---- 目标：会话 / 工作区 ----
  let target: Target = options.sessionId
    ? { kind: 'session', id: options.sessionId }
    : { kind: 'workspace', id: options.workspaceId ?? workspaces[0]?.id ?? '' }

  // ---- 选择状态（默认 = 当前生效值回落 pack 默认） ----
  let packId = spec.packId ?? state.packs[0]?.id ?? ''
  const pickPack = (): UiPackDescriptor | undefined => state.packs.find((p) => p.id === packId)
  let themeSel: string | null = spec.themeId ?? null // null = pack 默认
  let layoutSel: string | null = spec.layoutId ?? null

  const overlay = el(doc, 'div', { class: 'ui-skins-overlay' })
  const panel = el(doc, 'div', { class: 'ui-skins-panel', role: 'dialog', 'aria-label': 'UI/UX 皮肤选择器' })
  overlay.append(panel)
  const close = (): void => overlay.remove()
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close()
  })

  const status = el(doc, 'span', { class: 'ui-skins-status' })
  const setStatus = (text: string): void => {
    status.textContent = text
  }

  // 目标区
  const targetRow = el(doc, 'div', { class: 'ui-skins-row' })
  const wsSelect = el(doc, 'select', { class: 'ui-skins-select' })
  for (const ws of workspaces) {
    wsSelect.append(el(doc, 'option', { value: ws.id }, [ws.path.split('/').pop() ?? ws.id, ` — ${ws.path}`]))
  }
  if (options.workspaceId) wsSelect.value = options.workspaceId
  const sessionRadio = el(doc, 'label', { class: 'ui-skins-radio' }, [
    el(doc, 'input', { type: 'radio', name: 'ui-skins-target', value: 'session' }),
    options.sessionId ? `当前会话` : '当前会话（不可用）',
  ]) as HTMLLabelElement
  const wsRadio = el(doc, 'label', { class: 'ui-skins-radio' }, [
    el(doc, 'input', { type: 'radio', name: 'ui-skins-target', value: 'workspace' }),
    '工作区',
  ]) as HTMLLabelElement
  const sessionInput = sessionRadio.querySelector('input') as HTMLInputElement
  const wsInput = wsRadio.querySelector('input') as HTMLInputElement
  sessionInput.disabled = !options.sessionId
  sessionInput.checked = target.kind === 'session'
  wsInput.checked = target.kind === 'workspace'
  sessionInput.addEventListener('change', () => {
    if (sessionInput.checked && options.sessionId) target = { kind: 'session', id: options.sessionId }
  })
  wsInput.addEventListener('change', () => {
    if (wsInput.checked) target = { kind: 'workspace', id: wsSelect.value }
  })
  wsSelect.addEventListener('change', () => {
    target = { kind: 'workspace', id: wsSelect.value }
    wsInput.checked = true
    sessionInput.checked = false
  })
  targetRow.append(el(doc, 'span', { class: 'lbl' }, ['应用到']), sessionRadio, wsRadio, wsSelect)

  // pack 网格
  const grid = el(doc, 'div', { class: 'ui-skins-grid' })
  // 主题/布局 chips
  const themeRow = el(doc, 'div', { class: 'ui-skins-row' })
  const layoutRow = el(doc, 'div', { class: 'ui-skins-row' })

  const rerenderChips = (): void => {
    const pack = pickPack()
    themeRow.replaceChildren(el(doc, 'span', { class: 'lbl' }, ['主题']))
    layoutRow.replaceChildren(el(doc, 'span', { class: 'lbl' }, ['布局']))
    const themeDefault = el(doc, 'button', { class: `ui-skins-chip${themeSel === null ? ' sel' : ''}` }, ['(pack 默认)'])
    themeDefault.addEventListener('click', () => {
      themeSel = null
      rerenderChips()
    })
    themeRow.append(themeDefault)
    for (const theme of Object.values(pack?.themes ?? {})) {
      const chip = el(doc, 'button', { class: `ui-skins-chip${themeSel === theme.id ? ' sel' : ''}` }, [theme.title ?? theme.id])
      chip.addEventListener('click', () => {
        themeSel = theme.id
        rerenderChips()
      })
      themeRow.append(chip)
    }
    const layoutDefault = el(doc, 'button', { class: `ui-skins-chip${layoutSel === null ? ' sel' : ''}` }, ['(pack 默认)'])
    layoutDefault.addEventListener('click', () => {
      layoutSel = null
      rerenderChips()
    })
    layoutRow.append(layoutDefault)
    for (const layout of Object.values(pack?.layouts ?? {})) {
      const chip = el(doc, 'button', { class: `ui-skins-chip${layoutSel === layout.id ? ' sel' : ''}` }, [layout.title ?? layout.id])
      chip.addEventListener('click', () => {
        layoutSel = layout.id
        rerenderChips()
      })
      layoutRow.append(chip)
    }
  }

  const rerenderGrid = (): void => {
    grid.replaceChildren()
    for (const pack of state.packs) {
      const card = el(doc, 'div', { class: `ui-skins-card${pack.id === packId ? ' sel' : ''}`, 'data-pack': pack.id })
      const ttl = el(doc, 'div', { class: 'ttl' }, [swatchOf(pack), pack.title ?? pack.id])
      const desc = el(doc, 'div', { class: 'desc' }, [pack.description ?? ''])
      card.append(ttl, desc)
      card.addEventListener('click', () => {
        packId = pack.id
        themeSel = null
        layoutSel = null
        rerenderGrid()
        rerenderChips()
      })
      grid.append(card)
    }
  }

  // 底部操作
  const applyBtn = el(doc, 'button', { class: 'ui-skins-btn primary' }, ['应用'])
  const clearBtn = el(doc, 'button', { class: 'ui-skins-btn danger' }, ['清除本层覆盖'])
  const closeBtn = el(doc, 'button', { class: 'ui-skins-btn' }, ['关闭'])
  applyBtn.addEventListener('click', async () => {
    const level = target.kind === 'session' ? 'session' : 'workspace'
    try {
      await api.setLayer(level, target.id, {
        pack: packId,
        theme: themeSel,
        layout: layoutSel,
      })
      setStatus(`已应用到${level === 'session' ? '会话' : '工作区'} ✓ 皮肤即时生效`)
    } catch (error) {
      setStatus(`应用失败：${String(error).slice(0, 120)}`)
    }
  })
  clearBtn.addEventListener('click', async () => {
    const level = target.kind === 'session' ? 'session' : 'workspace'
    try {
      await api.setLayer(level, target.id, null)
      setStatus('已清除本层覆盖 ✓ 回落下层继承')
    } catch (error) {
      setStatus(`清除失败：${String(error).slice(0, 120)}`)
    }
  })
  closeBtn.addEventListener('click', close)

  panel.append(
    el(doc, 'h3', {}, ['🎨 UI/UX 皮肤选择器']),
    el(doc, 'div', { class: 'sub' }, [
      `当前生效：${spec.packId ?? 'dsh 原生'} / ${spec.themeId ?? '-'} / ${spec.layoutId ?? '-'}　·　UI 来自已安装的 ${state.packs.length} 个皮肤包`,
    ]),
    targetRow,
    grid,
    themeRow,
    layoutRow,
    el(doc, 'div', { class: 'ui-skins-foot' }, [applyBtn, clearBtn, closeBtn, status]),
  )
  rerenderGrid()
  rerenderChips()
  doc.body.append(overlay)
}
