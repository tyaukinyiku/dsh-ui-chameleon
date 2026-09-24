# dsh-ui-chameleon 集成指南（含测试体系）

面向要把 chameleon 集成进自己 dsh 部署的开发者：装载方式、运行时依赖、传输面、
构建工具链与**测试体系（开发说明中的"测"）**。

---

## 1. 集成装载

**开发装载**（checkout 直用）：patch 行指向包源码绝对路径：

```yaml
# examples/cordis.patch.local.yml
- insert:
  - id: ui-skins
    name: '/abs/path/dsh-ui-chameleon/packages/ui-skins/src/index.ts'
    config: { enabled: true, defaultPack: default, … }
  - id: ui-pack-default
    name: '/abs/path/dsh-ui-chameleon/packages/ui-pack-default/src/index.ts'
  # …其他 UI pack
```

```sh
cd dsh && pnpm dsh web --patch /abs/path/dsh-ui-chameleon/examples/cordis.patch.local.yml
```

**安装装载**（正式分发）：`dsh plugin --profile <p> add <pkg-dir>` 走组合包机制；
分发前为各包补 `prepare` 脚本（tsdown 转译，参考 publish 文档），或 `pnpm pack` 发 tarball。

**部署验证**：
```sh
dsh --profile <p> --dump-config     # 确认 ui-skins + 各 pack 行在层里
curl -s localhost:3080/ui-skins/state   # pack 注册表 + dsh 层默认
```

## 2. 运行时依赖与构建

| 工具 | 用途 |
| --- | --- |
| `scripts/link-dsh-deps.mjs` | 把 dsh 工作区包（cordis/schemastery/storage-domain/zod）软链进本仓库 `node_modules` 解析运行时依赖 |
| `scripts/build-client.mjs` | 各包浏览器半 → `lib/client.js`（`window.__ModuleLoader__.load({id, factory})` 格式，平台模块经 `require()`） |
| `scripts/build-dsh-lowmem.mjs` | ≤4GiB 环境构建 dsh 产物（逐项目独立进程 tsc，聚合步可跳过） |
| `scripts/host-proxy.mjs` | 固定 Host/Origin/Referer 的桥接代理（公网/直连暴露用；`/go` 免凭证入口） |
| `scripts/tunnel-loop.sh` | localhost.run 隧道守护（断线自动重连，URL 落 `tunnel-url.txt`） |

一次性准备：
```sh
npm install                       # typescript（离线类型检查/打包器用）
node scripts/link-dsh-deps.mjs ../dsh
npm run build:client
```

## 3. 传输面：/ui-skins/*

树外插件挂不上 Typert Remote（strict descriptor 需构建期生成 + api-remotes 收录），
按 API Gateway 文档的 "Feature-owned exact Fetch routes" 自带传输：

| 路由 | 说明 |
| --- | --- |
| `GET /ui-skins/state` | pack 注册表 + dsh 层默认 + 观察器参数 |
| `GET /ui-skins/resolve?sessionId=&workspaceId=&workspacePath=` | 三级解析结果（host 回填目标推导） |
| `GET /ui-skins/binding?level=&id=` | 读工作区/会话绑定 |
| `POST /ui-skins/binding` | 写/删绑定（`config:null` 删除；无效配置 400 响亮拒绝） |
| `GET /ui-skins/events` | SSE 变更流（revision 通知，客户端自行 resolve） |

持久化：storage-domain 领域 `ui_skins`（`workspace_bindings`/`session_bindings` 表）。
工作区另有文件层 `<workspace>/.dsh/ui.json`（可入库、可评审），优先级低于存储记录层。

## 4. 测试体系（"测"）

| 层 | 命令 | 覆盖 |
| --- | --- | --- |
| **类型检查** | `npm run check` | 6 包 tsc（离线 shim 对照真实签名） |
| **单元测试** | `npm test` | `resolve.ts` 三级解析纯函数（node --test，14 项）：优先级/null 清除/tokens/css/components 合并/漂移继承/校验 |
| **HTTP 冒烟** | `node scripts/smoke-http.mjs [base]` | /ui-skins/* 面 16 项：pack 注册、工作区文件层、会话层覆盖、null 清除、provenance、写路径拒绝、SSE |
| **无头验收** | `python3 scripts/e2e_headless.py [base]` | 真实 Chromium 完整用户流 25 项：加载/三级继承 DOM 落地/组件渲染/零报错 + 四层截图 |
| **千面演示** | `python3 scripts/demo_workspaces.py [base]` | 3 工作区 × 5 断言 + 零报错 = 16 项：pack/theme/字体/品牌组件/角标归属 + 整页截图 |

无头系列依赖 playwright + Chromium（`CHROME` 常量指向本机二进制）。

### 最新结果快照（2026-09-24，dsh 本地检出实测）

```
npm run check                 6/6 包通过
npm test                      14/14
smoke-http.mjs                16/16
e2e_headless.py               25/25（零 pageerror、零我方 console 输出）
demo_workspaces.py            16/16（aurora / manuscript / terminal 三套 UI 各自命中）
```

## 5. 集成坑位备忘（血泪清单）

1. **cordis 严格依赖声明**：`ctx.<service>` 不在 `inject` 声明就访问 → `cannot get property … without inject`；可选能力拆子插件显式注入。
2. **host 侧改动要重启 dsh**：`resolve.ts` 等 host 代码是进程生命周期缓存，改完必须重启。
3. **反代暴露要改写 Host/Origin/Referer** 为 canonical authority，否则 `/api` 信任围栏 403 → remote.mux WS 断 → 整个 UI 瘫；WS 升级必须保留 `Connection/Upgrade` 头。
4. **single 型注册别带 `id`**、list 必带、keyed 必带 `key`（见 extension-guide §4）。
5. **组件注册键**：引用方 `name` 必须能在 pack 组件表解析（组件名键或 slot key 别名）。
6. **无头 UI 自动化**：工作区选择器是 `role=menu`（用 `menuitem` 点，点文本 span 会假成功）；
   "Choose workspace" 只在首屏/新会话态；发消息无 API key 会报 `This turn failed`（不影响 UI 断言）。
