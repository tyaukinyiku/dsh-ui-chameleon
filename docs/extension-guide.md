# UI Pack 开发指南（dsh-ui-chameleon 扩展面）

UI pack 是 chameleon 框架下 **UI/UX 的交付单元**——就是一个普通 dsh 插件包，
按需提供三个定制粒度：**主题**（token/CSS）· **布局**（结构级）· **组件**（slot 级覆盖）。
框架负责按 `会话 > 工作区 > dsh` 三级解析出最终规格并在浏览器装配。

> 起步模板：`packages/ui-pack-aurora`（视觉系主题）、`packages/ui-pack-manuscript`（排版系）、
> `packages/ui-pack-terminal`（单色系 + 特效 CSS）—— 三者覆盖了 pack 开发的全部写法。

---

## 1. 包结构（两个入口 = host 半 + 浏览器半）

```
my-pack/
├── package.json        # dsh.bundle.patch + dsh.client + exports["./client"]
├── cordis.patch.yml    # 组合包层：插入你的插件行
└── src/
    ├── index.ts        # host 半：registerPack（主题/布局/默认组件声明，纯数据）
    └── client.ts       # 浏览器半：uiSkinsClient.register（渲染组件）
```

`package.json` 关键声明：

```json
{
  "name": "dsh-ui-pack-quartz",
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./client": { "types": "./src/client.ts", "default": "./lib/client.js" }
  },
  "scripts": { "build:client": "node ../../scripts/build-client.mjs ." },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "platform": "web" }
  }
}
```

`./client` 的 `default` 指向**构建产物**（`scripts/build-client.mjs` 生成的
`__ModuleLoader__.load({ id, factory })` 格式 bundle）；`types` 指向源码供类型检查。

## 2. host 半：注册主题 / 布局（数据面）

```ts
import type { Context } from '@deepseek-ai/cordis'
import type { UiPackDescriptor } from 'dsh-ui-skins'

export const name = 'ui-pack-quartz'
export const inject = ['uiSkins']          // cordis 严格依赖声明，缺了直接抛错

const quartzPack: UiPackDescriptor = {
  id: 'quartz',                            // host/浏览器两半必须同 id
  baseTokens: { '--ui-bg': '#0b0b12', '--ui-accent': '#7c5cff' },
  baseCss: '[data-ui-pack="quartz"] { … }',
  baseComponents: {                        // pack 自带的组件覆盖（可被上层覆盖/清除）
    'conversation.session.header.corner': { pack: 'quartz', name: 'QuartzCorner' },
  },
  themes: {
    'quartz-night': { id: 'quartz-night', dark: true, tokens: {…}, css: '…' },
  },
  layouts: {
    focus: { id: 'focus', tokens: {…}, css: '[data-ui-layout="focus"] { … }', components: {…} },
  },
  defaultTheme: 'quartz-night',
  defaultLayout: 'focus',
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const uiSkins = (ctx as unknown as { uiSkins: { registerPack(p: UiPackDescriptor): () => void } }).uiSkins
    return uiSkins.registerPack(quartzPack)   // 返回值即 disposer，随 fiber 卸载
  }, 'ui-pack-quartz: register')
}
```

要点：
- **token 名必须带 `--` 前缀**（写入 `<html>` 的 CSS 自定义属性）；
  约定可用 token：`--ui-bg --ui-surface --ui-text --ui-muted --ui-accent --ui-radius --ui-gap --ui-font --ui-sidebar-w`
- **CSS 作用域**：`[data-ui-pack="…"] [data-ui-theme="…"] [data-ui-layout="…"]` 始终挂在 `<html>` 上；
  全局性样式（滚动条、选区、扫描线覆盖层）也可直接写
- **布局 = 结构级定制**：token 预设 + 布局 CSS + 结构性组件覆盖，三者都可被三级配置继续覆盖

## 3. 浏览器半：注册组件（渲染面）

```tsx
import { createElement as h } from 'react'
import type { UiComponent } from 'dsh-ui-skins/client'

const QuartzCorner: UiComponent = function QuartzCorner(props) {
  // props = 该 slot 的组装输入：owner props + 标准 hooks（useSession/useWorkspaces…）
  const { sessionId } = (props ?? {}) as { sessionId?: string }
  return h('span', { 'data-quartz-corner': '' }, '◇ quartz')
}

const components: Record<string, UiComponent> = {
  QuartzCorner,                                       // 契约键：组件名（引用方 name 指向它）
  'conversation.session.header.corner': QuartzCorner, // 别名：slot key（作者习惯写法）
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const registry = (ctx as unknown as {
      uiSkinsClient: { register(p: { id: string; components: Record<string, UiComponent> }): () => void }
    }).uiSkinsClient
    return registry.register({ id: 'quartz', components })   // id 与 host 半一致
  }, 'ui-pack-quartz: register components')
}
```

**注册键约定**：组件名（`UiComponentRef.name` 指向它）为主，slot key 为别名——
解析器两级兜底，两种写法都能命中（但引用方写什么 `name` 就要有什么键）。

## 4. 组件覆盖引用（UiComponentRef）与 slot kind 规则

三级配置里这样引用组件：

```json
"components": {
  "conversation.session.header.corner": { "pack": "quartz", "name": "QuartzCorner", "priority": -1 },
  "conversation.session.header.actions": { "pack": "quartz", "name": "QuartzAction", "id": "quartz-action", "order": 10 }
}
```

| 字段 | 用于 | 说明 |
| --- | --- | --- |
| `pack` / `name` | 全部 | 指向哪个 pack 的哪个组件 |
| `priority` | 全部 | cell 遮蔽排名：升序、默认 0、**最小者渲染**；同 cell 同 priority 注册会抛错 → 覆盖内建用 `-1` |
| `key` | **keyed 型** slot | 派发键，缺了注册即抛错 |
| `id` / `order` | **list 型** slot | cell id（必填）与显示顺序 |
| （无形状字段） | **single 型** slot | cell = slot 本身；**不要多带 `id`**（会被当成 list 形状） |

> 查 kind：dsh 源码 `packages/client/*/src/client/contract/slots.ts`；
> 常用：`conversation.session.header.corner` = single；`…header.actions`/`…utilities` = list；
> `conversation.hero.brand.mark`/`sidebar.brand.mark` = single。

**回退即不注册**：三级配置里缺席/被 `null` 清除的 slot，框架不占位，dsh 原生组件原样渲染。

## 5. 三级配置的合并语义（写引用方配置时必读）

`<workspace>/.dsh/ui.json`（工作区层）、API 写入的会话层、插件配置（dsh 层）同构：

| 写法 | 含义 |
| --- | --- |
| 键缺席 | **继承下层**（会话没配置用工作区，工作区没配置用 dsh） |
| 显式 `null` | **清除**：阻断继承，回到 pack 默认（theme/layout）或空（pack/css/覆盖项） |
| 具体值 | **覆盖** |

- `tokens`：低→高覆盖，`null` 删除该 token 覆盖（回落 pack/主题/布局打底值）
- `css`：pack→主题→布局→各层依序拼接；某层 `css: null` 只清层级部分
- `components`：逐 slot 覆盖，`null` 清除（连 pack 自带覆盖一起清，回到原生 UI）
- **跨 pack 漂移继承**：高层切了 pack，低层残留的 theme/layout 名先尝试在新 pack 同名解析，
  失败则静默回落新 pack 默认（同层显式配错才告警）

## 6. 自检清单

- [ ] host 半与浏览器半 `register*` 的 **pack id 一致**
- [ ] `baseComponents`/布局引用的每个 `{pack,name}` 都能在浏览器半解析（两级键至少占一）
- [ ] token 带 `--` 前缀；CSS 用 `[data-ui-*]` 限定作用域（或确认就是想要全局效果）
- [ ] single 型引用不带 `id`；list 型带 `id`；keyed 型带 `key`；遮蔽用非 0 `priority`
- [ ] `npm run check && npm test` 过；`npm run build:client` 出 `lib/client.js`
- [ ] 重启 dsh（host 侧解析器改动必须重启才生效！）后 `python3 scripts/e2e_headless.py` 全绿
