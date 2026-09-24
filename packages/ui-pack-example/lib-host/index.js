export const name = 'ui-pack-example';
export const inject = ['uiSkins'];
export const quartzPack = {
    id: 'quartz',
    title: 'Quartz',
    description: '示例皮肤：石英质感主题 + 专注布局 + 组件级覆盖。',
    version: '0.1.0',
    baseTokens: {
        '--ui-bg': '#f4f2ef',
        '--ui-surface': '#ffffff',
        '--ui-text': '#20242b',
        '--ui-accent': '#0f766e',
        '--ui-radius': '2px',
        '--ui-font': '"IBM Plex Sans", system-ui, sans-serif',
    },
    baseCss: `/* quartz: base */
[data-ui-pack="quartz"] { letter-spacing: 0.01em; }`,
    baseComponents: {
        // pack 自带的默认组件覆盖（可在工作区/会话层被覆盖或用 null 清除）
        'conversation.session.header.corner': { pack: 'quartz', name: 'QuartzCorner' },
    },
    themes: {
        'quartz-night': {
            id: 'quartz-night',
            title: 'Quartz Night',
            dark: true,
            tokens: { '--ui-bg': '#161a20', '--ui-surface': '#1e242c', '--ui-text': '#e8eaed', '--ui-accent': '#2dd4bf' },
            css: '/* quartz: night */\n[data-ui-theme="quartz-night"] { color-scheme: dark; }',
        },
        'quartz-day': {
            id: 'quartz-day',
            title: 'Quartz Day',
            tokens: { '--ui-accent': '#0d9488' },
        },
    },
    layouts: {
        focus: {
            id: 'focus',
            title: 'Focus（窄侧栏 + 大行距）',
            tokens: { '--ui-gap': '6px' },
            css: `/* quartz: focus */
[data-ui-layout="focus"] { --ui-sidebar-w: 200px; }
[data-ui-layout="focus"] [data-ui-brand] { font-weight: 600; }`,
        },
    },
    defaultTheme: 'quartz-night',
    defaultLayout: 'focus',
};
export function apply(ctx) {
    ctx.effect(() => {
        const uiSkins = ctx.uiSkins;
        return uiSkins.registerPack(quartzPack);
    }, 'ui-pack-example: register');
}
