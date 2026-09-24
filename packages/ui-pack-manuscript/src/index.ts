/**
 * dsh-ui-pack-manuscript —— 纸墨书刊风。
 * 风格宣言：暖纸色、衬线排版、墨线分隔、窄栏正文、素雅无光晕。
 */
import type { Context } from '@deepseek-ai/cordis'
import type { UiPackDescriptor } from 'dsh-ui-skins'

export const name = 'ui-pack-manuscript'
export const inject = ['uiSkins']

export const manuscriptPack: UiPackDescriptor = {
  id: 'manuscript',
  title: 'Manuscript（纸墨）',
  description: '暖纸色 + 衬线书刊排版。',
  version: '0.1.0',
  baseTokens: {
    '--ui-bg': '#f4ecd8',
    '--ui-surface': '#fbf5e6',
    '--ui-text': '#2f2718',
    '--ui-muted': '#7c6a4d',
    '--ui-accent': '#a03c2f',
    '--ui-radius': '2px',
    '--ui-gap': '10px',
    '--ui-font': 'Georgia, "Songti SC", "Noto Serif SC", serif',
    '--ui-sidebar-w': '220px',
  },
  baseCss: `/* manuscript: 纸墨 */
[data-ui-pack="manuscript"] {
  background: repeating-linear-gradient(0deg, transparent 0 27px, rgba(120, 96, 58, 0.05) 27px 28px), var(--ui-bg);
  color: var(--ui-text);
  line-height: 1.7;
}
[data-ui-pack="manuscript"] button {
  border-radius: 1px;
  border: 1px solid #c9b98d;
  background: var(--ui-surface);
}
[data-ui-pack="manuscript"] button:hover { background: #f1e6c8; box-shadow: none; }
[data-ui-pack="manuscript"] ::selection { background: rgba(160, 60, 47, 0.25); }
[data-ui-pack="manuscript"] [class*="panel"], [data-ui-pack="manuscript"] [class*="card"] {
  border: 1px solid #d8c9a3;
  border-radius: 1px;
  box-shadow: 2px 2px 0 rgba(112, 88, 44, 0.18);
}
[data-ui-ms-mark] {
  color: var(--ui-accent);
  font-style: italic;
  font-weight: 600;
  letter-spacing: 0.08em;
}
[data-ui-ms-mark]::after { content: ' ❦'; color: var(--ui-muted); }
[data-ui-ms-corner] {
  padding: 1px 9px;
  border-bottom: 2px double var(--ui-accent);
  color: var(--ui-accent);
  font-style: italic;
  font-size: 12px;
}`,
  baseComponents: {
    'conversation.hero.brand.mark': { pack: 'manuscript', name: 'MsMark' },
    'sidebar.brand.mark': { pack: 'manuscript', name: 'MsMark' },
    'conversation.session.header.corner': { pack: 'manuscript', name: 'MsCorner' },
  },
  themes: {
    'ms-classic': {
      id: 'ms-classic',
      title: 'Classic（米纸）',
      tokens: { '--ui-bg': '#f4ecd8', '--ui-accent': '#a03c2f' },
    },
    'ms-dusk': {
      id: 'ms-dusk',
      title: 'Dusk（夜读）',
      dark: true,
      tokens: { '--ui-bg': '#201c14', '--ui-surface': '#2a251b', '--ui-text': '#e8ddc3', '--ui-muted': '#a3916b', '--ui-accent': '#d8836b' },
      css: '[data-ui-theme="ms-dusk"] { color-scheme: dark; }',
    },
  },
  layouts: {
    'ms-column': {
      id: 'ms-column',
      title: 'Column（窄栏）',
      tokens: { '--ui-sidebar-w': '200px', '--ui-gap': '12px' },
      css: '[data-ui-layout="ms-column"] { line-height: 1.85; }',
    },
  },
  defaultTheme: 'ms-classic',
  defaultLayout: 'ms-column',
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const uiSkins = (ctx as unknown as { uiSkins: { registerPack(pack: UiPackDescriptor): () => void } }).uiSkins
    return uiSkins.registerPack(manuscriptPack)
  }, 'ui-pack-manuscript: register')
}
