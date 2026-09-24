# dsh-ui-skins —— dsh Web UI 装配框架

让 **每个工作区 / 每个会话使用各自独立的 UI/UX** 的机制/框架（不是一款固定界面）。

- **框架 + 可插拔定制**：主题（token/CSS）· 布局（结构级）· 组件（slot 级覆盖）三个粒度；
- **三级解析**：**会话 > 工作区 > dsh**（会话可覆盖；会话没配置用工作区，工作区没配置用 dsh）；
- **UI 的来源 = 后期可开发的 dsh 插件**：任何普通 dsh 插件都能注册一个 UI pack（主题/布局/组件）。

基于 DeepSeek Harness（dsh）的插件体系（Cordis）实现，全部走官方扩展点：
`ctx.uiSkins`（自建服务）· `ctx.slots`（Web Client Slots）· `ctx.storageDomain`（领域 KV 存储）·
`ctx.settings`（用户设置）· Typert Remote（`ctx.remote.uiSkins`）· `dsh.client`（浏览器半模块）。

---

## 1. 概念模型

| 概念 | 说明 |
| --- | --- |
| **UI pack** | 一款可插拔皮肤包：主题集合 + 布局集合 + 默认组件覆盖。由普通 dsh 插件交付（host 半注册数据，浏览器半注册组件）。 |
| **层（layer）** | 一份 `UiLayerConfig`：选用哪个 pack/theme/layout、token 覆盖、附加 CSS、组件覆盖。三个层级同构：`dsh` / `workspace` / `session`。 |
| **UiSpec** | 三级解析后的最终 UI 规格（token 表 + 样式 + 组件覆盖表 + 来源标注），浏览器侧照单装配。 |
| **绑定** | 工作区/会话 → 层配置 的持久映射。 |

### 层内字段语义（各字段一致）

| 写法 | 含义 |
| --- | --- |
| 键缺席 / `undefined` | **继承下层**（“会话没配置用工作区，工作区没配置用 dsh”） |
| 显式 `null` | **清除**：阻断继承，回到 pack 默认（theme/layout）或空（pack/css/覆盖项） |
| 具体值 | **覆盖** |

合并细节：

- `tokens`：pack 基础 → 主题 → 布局 打底，层覆盖按 dsh → workspace → session 依序叠加；`null` 删除该 token 的覆盖（回落打底值）。
- `css`：按 pack 基础 → 主题 → 布局 → 各层 `css` 依序拼接；某层 `css: null` 清空**层级部分**（不影响 pack 自带样式）。
- `components`：pack 默认 → 布局覆盖 打底，层覆盖依序叠加；`null` 清除该 slot 覆盖（连 pack 自带覆盖一起清，回到 dsh 原生 UI）。

解析结果带 `provenance`（每个字段来自哪一层）与 `warnings`（读路径优雅降级诊断）。

## 2. 架构

```
packages/
├── ui-skins/            框架本体
│   ├── src/                       Node 半（host）
│   │   ├── index.ts               插件入口（apply：装配服务 + 控制器）
│   │   ├── config.ts              插件配置（Schemastery schema）
│   │   ├── types.ts               共享类型（JSON 安全，跨 Remote）
│   │   ├── resolve.ts             ★ 三级解析纯函数（Node/浏览器共用，单测覆盖）
│   │   ├── domain.ts              存储领域 ui_skins（storage-domain seam）
│   │   ├── store.ts               绑定存储：<ws>/.dsh/ui.json + 领域记录
│   │   ├── service.ts             ctx.uiSkins：pack 注册表 + 解析 + 绑定读写
│   │   ├── controller.ts          ctx.uiSkinsController（@Remote → ctx.remote.uiSkins）
│   │   └── client/                浏览器半（dsh.client）
│   │       ├── index.ts           入口：注册表 + 运行时 + 目标观察器
│   │       ├── registry.ts        ctx.uiSkinsClient：pack 组件注册表
│   │       ├── theme.ts           主题应用（CSS 变量 / <style> / data-*）
│   │       ├── dispatcher.ts      组件级 slot 覆盖分发（ctx.slots.inject/register）
│   │       ├── runtime.ts         SkinRuntime：目标跟踪 → 解析 → 装配 → 跟随变更
│   │       └── observer.ts        目标观察器 + 皮肤徽标
│   └── tests/resolve.test.mjs     node --test 单测
├── ui-pack-default/     内置默认 pack（主题 paper/dusk + 布局 classic）
├── ui-pack-example/     第三方 pack 示例（主题 quartz-* + 布局 focus + 组件覆盖）
examples/
├── cordis.patch.yml               开发用：--patch 直接加载框架 + 两个 pack
├── workspaces/acme/.dsh/ui.json   工作区级配置示例（可入库）
└── workspaces/acme-session-override.json  会话级配置示例（经 Remote 写入）
```

数据通路（对照 Web Client 架构文档的分层）：

```
UI pack 插件（host 半）── registerPack ──▶ ctx.uiSkins（注册表 + 三级解析 + 绑定存储）
UI pack 插件（浏览器半）─ register ──────▶ ctx.uiSkinsClient（组件注册表）
浏览器 SkinRuntime ── ctx.remote.uiSkins.resolve(target) ──▶ UiSpec
    ├─ theme.ts：token/CSS → DOM
    └─ dispatcher.ts：UiSpec.components → ctx.slots 遮蔽 cell（缺席 = 原生 UI）
```

## 3. 三级配置的来源

| 层 | 来源 | 写入方式 |
| --- | --- | --- |
| **dsh** | 插件配置（cordis.yml / profile patch 的行内 config） | cordis.yml / profile patch；设置页会自动把 Config schema 投影成表单（`SettingsForms`，按 entry id），改完即热替换重载 |
| **workspace** | `<workspace>/.dsh/ui.json`（文件层，可入库、可评审） < storage-domain `workspace_bindings`（记录层） | 直接编辑文件 / `POST /ui-skins/binding` |
| **session** | storage-domain `session_bindings` | `POST /ui-skins/binding` |

写路径**响亮失败**（配置错误在写入处拒绝：结构校验 + pack/theme/layout 引用校验）；
读路径优雅降级（未注册的 pack/主题进 `spec.warnings` 并回退）。

## 4. host 面 API（浏览器可用，/ui-skins/*）

```ts
const api = new UiSkinsHttpApi()   // packages/ui-skins/src/client/api.ts
await api.resolve({ sessionId?, workspaceId?, workspacePath? }) // GET  /ui-skins/resolve
await api.describe()               // GET  /ui-skins/state
await api.getLayer(level, id)      // GET  /ui-skins/binding
await api.setLayer(level, id, cfg | null) // POST /ui-skins/binding（null = 删除）
api.changes((revision) => { … })   // GET  /ui-skins/events（SSE，拉取模型：收到通知后自行 resolve）
```

## 5. UI pack 开发（后期扩展点）

一个 UI pack = 一个普通 dsh 插件包，两个入口：

```ts
// host 半（数据面）：注册主题/布局
export const name = 'my-pack'
export const inject = ['uiSkins']
export function apply(ctx) {
  ctx.effect(() => ctx.uiSkins.registerPack({
    id: 'my-pack',
    themes: { night: { id: 'night', tokens: { '--ui-bg': '#000' }, css: '…' } },
    layouts: { focus: { id: 'focus', components: { 'main.shell': { pack: 'my-pack', name: 'FocusShell' } } } },
    defaultTheme: 'night',
    defaultLayout: 'focus',
  }))
}
```

```tsx
// 浏览器半（组件面，exports["./client"] + dsh.client 声明）：注册组件
export const name = 'my-pack/client'
export const inject = ['uiSkinsClient']
export function apply(ctx) {
  ctx.effect(() => ctx.uiSkinsClient.register({
    id: 'my-pack',
    components: {
      'conversation.session.header.corner': (props) => <span>my corner</span>,
      'main.shell': (props) => <MyShell {...props} />,
    },
  }))
}
```

组件收到的 props = 该 slot 的组装输入（owner props + 标准 hooks `useSession/useWorkspaces/useResource…` + inject face），
完整规则见官方 [Web Client Slots](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/slots)。
详见 [`docs/extension-guide.md`](docs/extension-guide.md)。

## 6. 运行与安装

开发（仓库 checkout，参照《第一个插件》的本地插件流程）：

```sh
# 把 examples/cordis.patch.yml 里的绝对路径换成你的仓库路径
pnpm dsh web --patch ./examples/cordis.patch.yml
```

正式安装（参照《打包与安装插件》的组合包机制）：

```sh
dsh plugin --profile demo add ./packages/ui-skins        # 框架
dsh plugin --profile demo add ./packages/ui-pack-default # 默认皮肤
dsh plugin --profile demo add ./packages/ui-pack-example # 示例皮肤（可选）
dsh --profile demo --dump-config                          # 校验层
dsh --profile demo
```

打包分发前需为各包补 `prepare` 脚本（tsdown 转译 `src/`，见 publish 文档“构建脚本这道坎”），或直接 `pnpm pack` 发 tarball。

本地校验（不需要 dsh 环境）：

```sh
npm install        # 装 typescript
npm run verify     # 类型检查（三包）+ 解析器单测
```

## 7. 配置参考（cordis.yml 行内 config）

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 关闭后插件不注册任何服务 |
| `defaultPack` | `'default'` | dsh 层默认 pack（`''` = 不使用 pack） |
| `defaultTheme` / `defaultLayout` / `defaultCss` | `''` | dsh 层默认值（`''` 表示不覆盖，即 pack 默认） |
| `defaultTokens` | `{}` | dsh 层 token 覆盖 |
| `workspaceFileEnabled` | `true` | 启用工作区文件层 |
| `workspaceFilePath` | `'.dsh/ui.json'` | 文件层相对路径 |
| `workspaceFilePollMs` | `2000` | 文件层 mtime 轮询间隔 |
| `observerSlot` / `observerId` / `observerOrder` | `conversation.session.header.utilities` / `ui-skins-observer` / `0` | 目标观察器的 slot 注册参数（slot 树演进时改配置即可） |

## 8. 设计取舍与已知假设（联调后更新）

已对照 deepseek-harness 源码逐条校正（`dsh/` 本地检出），以下为当前实现的事实与剩余假设：

1. **slot 遮蔽语义已按真实实现对齐**（`packages/client/ui-slots` 的 `SlotCore.register`）：
   `priority` 是 cell 遮蔽排名（升序、默认 0、最小者渲染；single = slot 本身、keyed = 同 key、list = 同 id 为一个 cell），
   **同 cell 同 priority 会抛错**。覆盖默认取 `priority: -1`，可在 `UiComponentRef.priority` 逐项调整；
   `UiComponentRef` 的 kind 形状字段：keyed 用 `key`、list 用 `id`/`order`。
2. **传输面不用 Typert Remote**：strict descriptor 需要构建期生成（`dsh-typert-generator`）+
   `api-remotes` 显式收录，树外插件无法在运行时挂载（API Gateway 文档：Client “拒绝挂载缺 strict codec 的
   SRC descriptor”）。改用文档为功能预留的 **Feature-owned exact Fetch routes** + `host-webserver` 的
   `register({ kind, path, handler })` seam：`/ui-skins/{state,resolve,binding,events}`（events 为 SSE）。
3. **客户端 bundle 格式对齐 `clientConfig` 输出契约**：
   `window.__ModuleLoader__.load({ id, factory: (require) => { …CJS… return module.exports; } })`，
   平台模块（react 等 PLATFORM_MODULES）经 `require()` 取用。本仓库自带迷你打包器
   `scripts/build-client.mjs`（typescript 转译 + 手写 CJS 装配）；正式发布可换用 dsh 的
   `clientBundle()`（tsdown）以获得 sourcemap/CSS 管线。
4. **目标来源**是可插拔 seam：内置观察器（list 型 cell，`conversation.session.header.utilities`）从
   session 作用域 slot 的 `props.sessionId` 取会话；工作区由 host 经 `ctx.workspaceRegistry` 推导。
   无会话场景可由任意插件调用 `SkinRuntime.setTarget()` 直接喂。
5. **cordis 严格依赖声明**：`ctx.<service>` 未在 `inject` 声明就访问会直接抛
   `cannot get property "…" without inject`（联调时踩过）；可选能力（workspaceRegistry 推导）
   拆成独立子插件 + 显式注入，服务缺席时保持 pending 不影响主链路。
6. **设置集成零代码**：`ctx.settings` 实为 `SettingsForms`（把各插件 Config schema 投影为设置表单，
   按 profile entry id）；本插件的 `default*` 配置天然可在设置页编辑，未自建设置命名空间
   （文档描述的 `SettingsProvider.register(ns, …)` 面在本版本源码中不存在，以源码为准）。
7. **会话级绑定**存 storage-domain（UI 偏好不属于会话事件日志），不写 SessionEvent —— 对模型不可见。
8. 离线类型检查仍走 `types/shims.d.ts`（真实包签名已逐条比对）；构建/运行时链接到 dsh 检出的真实包
   （`scripts/link-dsh-deps.mjs`）。

## 9. 联调结果（2026-09-24，dsh 本地检出实测）

- **宿主加载**：`pnpm dsh web --patch examples/cordis.patch.local.yml` 干净启动，零 pending/失败；
  pack 注册表实测为 `[default, quartz]`。
- **HTTP 面**：`scripts/smoke-http.mjs` **16/16 通过**——pack 注册、工作区文件层（`.dsh/ui.json`）、
  会话层覆盖、null 清除、provenance、写路径响亮失败、SSE 变更流。
- **持久化**：storage-domain（json 后端）落盘 `~/.dsh/storages/ui_skins.json`。
- **Web Client 组合**：页面 `__DSH_BOOT__` 含三个包的 entry；客户端 bundle 经官方 combo 路由
  `/plugins/??<pkg>/client.js&rev=…` 伺服，内容为标准 `__ModuleLoader__.load({ id, factory })` 格式。
- **离线单测**：13/13（三级解析纯函数）；三包 tsc 类型检查通过。
- **边界**：容器内无浏览器，DOM 级（主题变量落地/组件遮蔽渲染）留待有浏览器的环境验收
  （机制已用 Node 假 ctx 冒烟：观察器/徽标按 list cell 正确注册）。

## 需求 ↔ 实现对照

| 需求 | 实现 |
| --- | --- |
| dsh 的 web-ui 插件，机制/框架 | `packages/ui-skins`（组合包 + `dsh.client` 双半），走插件/服务/slot/Remote 官方扩展点 |
| 每个工作区/会话单独 UI/UX | 三级绑定（workspace/session）+ 解析器 + 浏览器装配运行时 |
| 框架 + 可插拔主题/布局/组件 | `UiPackDescriptor`（themes/layouts/baseComponents）+ `UiSkinsClient`（组件）+ slot 覆盖分发 |
| 会话可覆盖；会话没配置用工作区；工作区没配置用 dsh | `resolveUi` 三级合并（键缺席 = 继承；显式 null = 清除），单测覆盖 |
| UI 来源为后期可开发的 dsh 插件 | `ctx.uiSkins.registerPack()` / `ctx.uiSkinsClient.register()`，`ui-pack-example` 即第三方插件模板 |
