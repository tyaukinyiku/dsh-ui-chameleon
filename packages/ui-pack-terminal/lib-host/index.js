export const name = 'ui-pack-terminal';
export const inject = ['uiSkins'];
export const terminalPack = {
    id: 'terminal',
    title: 'Terminal（CRT 绿屏）',
    description: '纯黑 + 磷光绿 + 扫描线的复古终端。',
    version: '0.1.0',
    baseTokens: {
        '--ui-bg': '#000000',
        '--ui-surface': '#030803',
        '--ui-text': '#33ff66',
        '--ui-muted': '#1f9940',
        '--ui-accent': '#b6ff00',
        '--ui-radius': '0px',
        '--ui-gap': '8px',
        '--ui-font': '"Cascadia Code", "Courier New", ui-monospace, monospace',
        '--ui-sidebar-w': '200px',
    },
    baseCss: `/* terminal: CRT */
[data-ui-pack="terminal"] {
  background: var(--ui-bg);
  color: var(--ui-text);
  text-shadow: 0 0 6px rgba(51, 255, 102, 0.55);
}
[data-ui-pack="terminal"]::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0) 0 2px, rgba(0, 0, 0, 0.22) 2px 3px);
  z-index: 2147483646;
}
[data-ui-pack="terminal"] button {
  border: 1px solid #0f6b2f;
  border-radius: 0;
  background: #021006;
}
[data-ui-pack="terminal"] button:hover { border-color: var(--ui-accent); box-shadow: none; }
[data-ui-pack="terminal"] ::selection { background: rgba(51, 255, 102, 0.3); }
[data-ui-pack="terminal"] ::-webkit-scrollbar { width: 10px; }
[data-ui-pack="terminal"] ::-webkit-scrollbar-thumb { background: #0f6b2f; border-radius: 0; }
[data-ui-pack="terminal"] [class*="panel"], [data-ui-pack="terminal"] [class*="card"] {
  border: 1px solid #0f6b2f;
  border-radius: 0;
  box-shadow: none;
}
[data-ui-term-mark] {
  color: var(--ui-accent);
  text-shadow: 0 0 10px rgba(182, 255, 0, 0.6);
  font-weight: 700;
  letter-spacing: 0.05em;
}
[data-ui-term-corner] {
  padding: 0 8px;
  border: 1px solid var(--ui-accent);
  color: var(--ui-accent);
  font-size: 11px;
  text-transform: uppercase;
}
[data-ui-term-corner]::before { content: '[ '; }
[data-ui-term-corner]::after { content: ' ]'; }`,
    baseComponents: {
        'conversation.hero.brand.mark': { pack: 'terminal', name: 'TermMark' },
        'sidebar.brand.mark': { pack: 'terminal', name: 'TermMark' },
        'conversation.session.header.corner': { pack: 'terminal', name: 'TermCorner' },
    },
    themes: {
        'crt-green': {
            id: 'crt-green',
            title: 'P31 Green（磷光绿）',
            dark: true,
            tokens: { '--ui-text': '#33ff66', '--ui-accent': '#b6ff00', '--ui-bg': '#000000' },
        },
        'crt-amber': {
            id: 'crt-amber',
            title: 'P3 Amber（琥珀）',
            dark: true,
            tokens: { '--ui-text': '#ffb000', '--ui-accent': '#ffd34d', '--ui-bg': '#0a0500', '--ui-muted': '#a06a00' },
            css: `[data-ui-theme="crt-amber"] { text-shadow: 0 0 6px rgba(255, 176, 0, 0.55); }
[data-ui-theme="crt-amber"] button { border-color: #7a5200; background: #120a00; }`,
        },
    },
    layouts: {
        'term-compact': {
            id: 'term-compact',
            title: 'Compact（紧凑 80 列感）',
            tokens: { '--ui-sidebar-w': '180px', '--ui-gap': '6px' },
            css: '[data-ui-layout="term-compact"] { letter-spacing: 0.03em; }',
        },
    },
    defaultTheme: 'crt-green',
    defaultLayout: 'term-compact',
};
export function apply(ctx) {
    ctx.effect(() => {
        const uiSkins = ctx.uiSkins;
        return uiSkins.registerPack(terminalPack);
    }, 'ui-pack-terminal: register');
}
