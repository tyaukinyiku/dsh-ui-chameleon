# 开发一个 UI pack

UI pack 是 dsh-ui-skins 框架下 **UI/UX 的交付单元**——就是普通 dsh 插件，
按需提供三个定制粒度：**主题**（token/CSS）· **布局**（结构级）· **组件**（slot 级覆盖）。

## 0. 最小骨架

一个 pack = 一个 npm 包 + 两个入口（host 半 + 浏览器半，同一包的 `.` 与 `./client`）：

```
my-pack/
├── package.json        # dsh.bundle.patch + dsh.client + exports
├── cordis.patch.yml    # 组合包层：插入你的插件行
└── src/
    ├── index.ts        # host 半：registerPack（主题/布局/默认组件声明）
    └── client.tsx      # 浏览器半：uiSkinsClient.register（组件）
```

`package.json` 关键声明：

```json
{
  "name": "dsh-ui-pack-quartz",
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts", "./client": "./src/client.tsx" },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "platform": "web" }
  }
}
```

## 1. 主题（token / CSS）

主题 = 一组 CSS 自定义属性 + 可选样式文本。框架把它写到 `<html>` 上：

```ts
themes: {
  'quartz-night': {
    id: 'quartz-night',
    title: 'Quartz Night',
    dark: true,
    tokens: { '--ui-bg': '#161a20', '--ui-accent': '#2dd4bf' },
    css: '[data-ui-theme="quartz-night"] { color-scheme: dark; }',
  },
}
```

- `tokens` 的 key 必须是完整 CSS 自定义属性名（`--` 前缀）；约定可用 token：
  `--ui-bg` `--ui-surface` `--ui-text` `--ui-muted` `--ui-accent` `--ui-radius` `--ui-gap` `--ui-font` `--ui-sidebar-w`。
- CSS 作用域提示：`[data-ui-pack="…"]` `[data-ui-theme="…"]` `[data-ui-layout="…"]` 三个属性始终挂在 `<html>` 上。
- token/CSS 都能被三层配置继续覆盖（见 README 的合并语义）。

## 2. 布局（结构级）

布局 = token 预设 + 布局样式 + **结构性组件覆盖**。布局声明的组件覆盖属于打底层，
仍可被工作区/会话层覆盖或用 `null` 清除：

```ts
layouts: {
  focus: {
    id: 'focus',
    title: 'Focus（窄侧栏）',
    tokens: { '--ui-gap': '6px' },
    css: '[data-ui-layout="focus"] { --ui-sidebar-w: 200px; }',
    components: { 'main.shell': { pack: 'quartz', name: 'FocusShell' } },
  },
}
```

## 3. 组件（slot 级覆盖）

组件按 **slot key** 覆盖 dsh Web Client 的渲染位置。slot 树见官方
[Web Client Slots](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/slots)（“当前层级”一节）。

```tsx
import { createElement as h } from 'react'

// 组件收到该 slot 的组装 props：owner props + 标准 hooks + inject face
const QuartzCorner = (props) => h('span', { 'data-quartz-corner': '' }, '◇ quartz')

export const name = 'quartz/client'
export const inject = ['uiSkinsClient']
export function apply(ctx) {
  ctx.effect(() => ctx.uiSkinsClient.register({
    id: 'quartz',
    components: { 'conversation.session.header.corner': QuartzCorner },
  }))
}
```

规则与建议：

- **回退即不注册**：某层配置没有覆盖该 slot 时，框架不占位，dsh 原生组件原样渲染。
- **遮蔽顺序**：覆盖以 `order`（默认 `-100`，数值越小越先渲染/遮蔽）注册；若目标 slot 的
  原占用者 order 更小，在组件引用上写 `order` 更小的值：
  `"components": { "x.y": { "pack": "quartz", "name": "Q", "order": -1000 } }`。
- **keyed 型 slot**：在引用上补 `entryKey`。
- **不要跨包导入运行时组件**（Slots 扩展规则）：组件间组合只经 slot；数据/callback 经 inject face。
- 组件只在渲染位置消费 props 中的 hooks（`useSession`、`useWorkspaces`、`useResource`…），
  不要自己 `useSyncExternalStore`，不要接收 `ctx`。

## 4. 在三层里选用你的 pack

```jsonc
// <workspace>/.dsh/ui.json —— 工作区层
{ "pack": "quartz", "theme": "quartz-night", "layout": "focus" }
```

```ts
// 会话层（Remote 写入；null = 清除字段，键缺席 = 继承工作区层）
await ctx.remote.uiSkins.setLayer('session', sessionId, {
  pack: 'quartz',
  theme: null,                                    // 回到 pack 默认主题
  tokens: { '--ui-gap': '4px' },                  // 覆盖 token
  components: { 'conversation.session.header.corner': null }, // 清除覆盖 → 原生 UI
})
```

## 5. 自检清单

- [ ] `registerPack` 的 id 与浏览器半 `register` 的 id 一致
- [ ] 每个 `components` 引用的 `pack/name` 都在浏览器半注册（框架会去重告警缺失项）
- [ ] token 名带 `--` 前缀；CSS 用 `[data-ui-*]` 限定作用域
- [ ] 覆盖内建 slot 时确认 `order` 能遮蔽原占用者
- [ ] `pnpm dsh web --patch …` 启动后：`dsh --profile … --dump-config` 确认层生效，
      浏览器 `<html>` 上能看到 `data-ui-pack/theme/layout`
