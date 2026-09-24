/**
 * dsh-ui-pack-aurora —— 深空暗黑 + 极光渐变霓虹风。
 * 风格宣言：圆角玻璃拟态面板、极光渐变背景、霓虹光晕、宽侧栏。
 */
import type { Context } from '@deepseek-ai/cordis'
import type { UiPackDescriptor } from 'dsh-ui-skins'

export const name = 'ui-pack-aurora'
export const inject = ['uiSkins']

export const auroraPack: UiPackDescriptor = {
  id: 'aurora',
  title: 'Aurora（极光）',
  description: '深空暗黑 + 极光渐变霓虹。',
  version: '0.1.0',
  baseTokens: {
    '--ui-bg': '#05060f',
    '--ui-surface': '#0d1022',
    '--ui-text': '#e9ecff',
    '--ui-muted': '#8a91b4',
    '--ui-accent': '#8b7cff',
    '--ui-radius': '14px',
    '--ui-gap': '14px',
    '--ui-font': '"Segoe UI", "PingFang SC", system-ui, sans-serif',
    '--ui-sidebar-w': '300px',
  },
  baseCss: `/* aurora: 深空极光 */
[data-ui-pack="aurora"] {
  background:
    radial-gradient(1200px 600px at 85% -10%, rgba(124, 92, 255, 0.28), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(0, 229, 192, 0.20), transparent 55%),
    var(--ui-bg);
  color: var(--ui-text);
}
[data-ui-pack="aurora"] button { border-radius: var(--ui-radius); }
[data-ui-pack="aurora"] button:hover { box-shadow: 0 0 18px rgba(139, 124, 255, 0.55); }
[data-ui-pack="aurora"] ::selection { background: rgba(139, 124, 255, 0.45); }
[data-ui-pack="aurora"] ::-webkit-scrollbar { width: 10px; }
[data-ui-pack="aurora"] ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #7c5cff, #00e5c0);
  border-radius: 6px;
}
[data-ui-pack="aurora"] [class*="panel"], [data-ui-pack="aurora"] [class*="card"] {
  border-radius: var(--ui-radius);
  box-shadow: 0 8px 32px rgba(2, 4, 18, 0.6), inset 0 0 0 1px rgba(139, 124, 255, 0.18);
}
[data-ui-aurora-mark] {
  background: linear-gradient(92deg, #7c5cff, #00e5c0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-shadow: 0 0 22px rgba(124, 92, 255, 0.35);
}
[data-ui-aurora-corner] {
  padding: 2px 10px;
  border: 1px solid rgba(0, 229, 192, 0.5);
  border-radius: 999px;
  color: #00e5c0;
  font-size: 11px;
  letter-spacing: 0.12em;
  box-shadow: 0 0 14px rgba(0, 229, 192, 0.35);
}`,
  baseComponents: {
    'conversation.hero.brand.mark': { pack: 'aurora', name: 'AuroraMark' },
    'sidebar.brand.mark': { pack: 'aurora', name: 'AuroraMark' },
    'conversation.session.header.corner': { pack: 'aurora', name: 'AuroraCorner' },
  },
  themes: {
    'aurora-night': {
      id: 'aurora-night',
      title: 'Aurora Night（极光夜）',
      dark: true,
      tokens: { '--ui-accent': '#8b7cff', '--ui-bg': '#05060f' },
    },
    'aurora-dawn': {
      id: 'aurora-dawn',
      title: 'Aurora Dawn（极光晨）',
      dark: true,
      tokens: { '--ui-accent': '#ff7ab6', '--ui-bg': '#120714' },
      css: `[data-ui-theme="aurora-dawn"] {
  background:
    radial-gradient(1000px 520px at 80% -10%, rgba(255, 122, 182, 0.30), transparent 60%),
    radial-gradient(800px 460px at 0% 110%, rgba(255, 176, 92, 0.22), transparent 55%),
    var(--ui-bg) !important;
}`,
    },
  },
  layouts: {
    'aurora-wide': {
      id: 'aurora-wide',
      title: 'Wide（宽侧栏）',
      tokens: { '--ui-sidebar-w': '340px', '--ui-gap': '16px' },
      css: '[data-ui-layout="aurora-wide"] { letter-spacing: 0.02em; }',
    },
  },
  defaultTheme: 'aurora-night',
  defaultLayout: 'aurora-wide',
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const uiSkins = (ctx as unknown as { uiSkins: { registerPack(pack: UiPackDescriptor): () => void } }).uiSkins
    return uiSkins.registerPack(auroraPack)
  }, 'ui-pack-aurora: register')
}
