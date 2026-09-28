# 外部 web-ui 项目集成器（External Bridge）—— 可行性与设计

> 目标：以 **dsh 原生集成插件的方式**（bundle / cordis.patch 行），把现有第三方 dsh web-ui
> 项目接进 chameleon，并让它们**以本框架的方式**被使用（pack 化、工作区/会话分层、🎨 选择器）。

## 1. 生态调研（GitHub 源码，2026-09）

| 项目 | 形态 | 集成机制 |
|---|---|---|
| `zhu1090093659/dsh-web-ui`（生态上游） | 每个 web-ui 单元 = 一个 npm 包 | `cordis.patch.yml` insert 行（裸包名）+ profile `dsh.profile.bundles` |
| `CAPTAIN1275/dsh-ui-web`（派生全家桶，22 包 `@captain1275/*`） | 皮肤 + 功能插件（task-board / ssh / git-graph / usage…） | 同上 + 聚合包 `dsh-web-ui-all`（`aggregate.yml` 汇总 patchFrom 的行） |
| `lyh9712/dsh-web-ui-`、`yuchen1017918/dsh-plugins` 等 | 聚合生态 / 插件集 | 同一契约 |

**事实标准"皮肤单元"布局**（上游 `dsh-skins/skins/<id>`）：

```
skin.json            # 清单：id/name/author/tagline/tags/accent/bodyAttr/package/wiring/order/preview
package.json         # npm 布局
cordis.patch.yml     # loader 行（裸包名）
lib/index.js         # 宿主半（可选：/api/<skin>/* 配置路由）
lib/client.js        # 浏览器半 bundle（CSS-modules 自动注入）
```

**皮肤客户端契约**：`apply(ctx)` 只写可回收内容（`ctx.effect` disposer 还原）；
CSS 作用域 `body[data-dsh-<id>]`（`bodyAttr` 即激活开关）；inject `connection/sessions/theme`。

## 2. 可行性分析（适配边界）

| 维度 | 结论 | 说明 |
|---|---|---|
| **样式层**（CSS + accent + bodyAttr + 预览图） | ✅ 可适配为 `UiPackDescriptor` | 关键技巧：**bodyAttr 激活 + 原样 CSS** = 原生视觉保真，无需改写 CSS 作用域；由此获得对方没有的**工作区/会话分层 + 选择器**（本框架差异化价值） |
| **整项目 / 功能插件**（task-board、ssh、git-graph…） | ✅ 走 dsh 原生 row/bundle | 本桥只做发现/编排/管理卡；执行交给 dsh 自己的 loader（= "类似 dsh 原生集成插件的方式"） |
| **CSS 资产获取** | ⚠️ 需提取器 | 资产化皮肤 CSS 编进 `lib/client.js`（css-modules 注入）。优先级：配置 `cssFiles` 显式 > 单元内 `*.css` 发现 > `lib/client.js` 字符串字面量启发式提取 |
| **JSX 组件**（AuroraCard / EffortPanel 等） | ❌ 不适配为本框架组件 | React 运行时与服务依赖都是对方的；功能组件随原生挂载走 |
| **信任边界** | ✅ 安全 | 适配器只把外部单元当**数据**读（skin.json / CSS / 预览图），**不执行**其代码；需要执行的部分由 dsh loader 按用户显式安装加载——与 dsh 原生插件同信任边界 |

## 3. 设计

### 3.1 配置（Config 新增）

```yaml
externalPacks:              # 外部皮肤单元清单
  - source: 'market:cafe-roastery'  # dsh-market.com 市场皮肤（市场源）
    title: 咖啡工坊          # 可选：卡片标题覆盖（市场无元数据端点）
  - source: '@captain1275/dsh-client-ui-skin-aurora'  # 包名（profile node_modules）或目录路径
    id: ''                  # 可选：覆盖生成的 pack id（默认 ext-<skin.id>）
    enabled: true           # 可选：默认 true
    cssFiles: []            # 可选：显式 CSS 资产（相对单元根）
```

#### dsh-market.com 市场源（v2 资产契约 `x-org.linxin666.skin-center/v1alpha1`）

- 来源写法：`market:<skinId>` 或市场 URL（`/skins/<id>`、`?skin=<id>`）
- 资产拉取：`GET /api/skin-center/v2/skins/{id}/stylesheet|patches` → CSS 文本（url() 重写为绝对资产地址）
- 作用域：`html[data-dsh-skin="<id>"]`（经 bodyAttr=`attr=value` 激活机制设置）
- **特异度锚**：市场皮肤常以 `:root`(0,1,0) 定义 token，会被 dsh 官方同名 token 的后注入定义压过 →
  适配器将 `:root` 重写为 `html[data-ui-pack="<id>"]`(0,1,1) 赢下层叠
- **市场皮肤惯例（重要）**：`html` 层把官方别名复位为 `initial`（推断 dsh :root 继承），
  真实值定义在 `body` 层——诊断/探针**必须读 body 而非 html**
- 安全边界：`hooks.mjs`（动态装饰 JS）**不执行**；assets/* 运行时联网加载；纯 CSS 皮肤（如 cafe-roastery）保真完整

### 3.2 数据流

```
config.externalPacks ──► host external.ts 适配器
        │   解析 skin.json → UiPackDescriptor（bodyAttr/accent/preview/external 标注）
        │   CSS：cssFiles > *.css 发现 > lib/client.js 提取
        ▼
ctx.uiSkins.registerPack(pack)   ← 与内置 pack 同一注册面（分层/解析/选择器一视同仁）
        ▼
浏览器 runtime：激活 pack 时设置 bodyAttr（body + html），切走回收
        ▼
🎨 选择器：外部卡片（badge「外部」+ 来源 + 预览图 + accent 色板）
```

### 3.3 传输面（/ui-skins/* 新增）

- `GET /ui-skins/external` —— 发现清单：适配结果、CSS 来源（files/discover/extract/none）、warnings
- `GET /ui-skins/external/<packId>/asset/<rel>` —— 预览图 / CSS 静态服务（路径越界防护）

### 3.4 整项目挂载（Kind B，"类似 dsh 原生集成插件的方式"）

```sh
dsh plugin --profile web add @captain1275/dsh-web-ui-all   # 或单个包
# 该聚合包自带 dsh.bundle + cordis.patch 行，dsh 原生收录 loader 行
```
若单元只发了裸包：把其 `cordis.patch.yml` 的 insert 行并入 profile 补丁或以组合包引之。
挂载后其**皮肤**再按 3.1-3.3 接入本框架（皮肤获得分层能力，功能保持原生）。

## 4. 测试计划

- 单测：skin.json 解析映射、bodyAttr 传递、CSS 发现优先级、bundle 提取启发式（真实 aurora bundle 样本）、路径越界防护
- e2e：外部 pack 出现在 🎨 选择器、应用后 bodyAttr 生效、工作区/会话分层可用、清除回落
