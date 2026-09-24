/**
 * dsh-ui-pack-default —— host 半（数据面）：注册基础主题与布局。
 * 组件面见 ./client.ts（同一个包的浏览器半，dsh.client 声明）。
 */
import type { Context } from '@deepseek-ai/cordis'
import type { UiPackDescriptor } from 'dsh-ui-skins'

export const name = 'ui-pack-default'
export const inject = ['uiSkins']

export const defaultPack: UiPackDescriptor = {
  id: 'default',
  title: 'Default',
  description: '内置默认皮肤：可读的中性主题 + 经典布局。',
  version: '0.1.0',
  baseTokens: {
    '--ui-bg': '#ffffff',
    '--ui-surface': '#f6f7f9',
    '--ui-text': '#1c1f24',
    '--ui-muted': '#6b7280',
    '--ui-accent': '#3563e9',
    '--ui-radius': '8px',
    '--ui-gap': '12px',
    '--ui-font': 'system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  baseCss: `/* ui-pack-default: base */
html { font-family: var(--ui-font); }
[data-ui-pack="default"] { color: var(--ui-text); background: var(--ui-bg); }`,
  themes: {
    paper: {
      id: 'paper',
      title: 'Paper（浅色）',
      dark: false,
      tokens: { '--ui-bg': '#ffffff', '--ui-accent': '#3563e9' },
    },
    dusk: {
      id: 'dusk',
      title: 'Dusk（深色）',
      dark: true,
      tokens: { '--ui-bg': '#101318', '--ui-surface': '#171b22', '--ui-text': '#e5e8ee', '--ui-accent': '#7aa2ff' },
      css: '/* ui-pack-default: dusk */\n[data-ui-theme="dusk"] { color-scheme: dark; }',
    },
  },
  layouts: {
    classic: {
      id: 'classic',
      title: 'Classic',
      tokens: { '--ui-gap': '12px' },
      css: '/* ui-pack-default: classic */\n[data-ui-layout="classic"] { --ui-sidebar-w: 260px; }',
    },
  },
  defaultTheme: 'paper',
  defaultLayout: 'classic',
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const uiSkins = (ctx as unknown as { uiSkins: { registerPack(pack: UiPackDescriptor): () => void } }).uiSkins
    return uiSkins.registerPack(defaultPack)
  }, 'ui-pack-default: register')
}
