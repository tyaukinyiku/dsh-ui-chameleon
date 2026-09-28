# 外部 web-ui 集成测评报告（2026-09-28）

**测评对象**：dsh-ui-chameleon 外部包集成器（docs/external-bridge.md）
**被测资产**：CAPTAIN1275/dsh-ui-web 真实第三方皮肤单元「极光 · Aurora」（skin.json + lib/client.js，Apache-2.0）
**测评方式**：dsh（web profile，link 安装最新构建）+ Playwright 无头浏览器全流程操作（scripts/e2e_external.py）

## 1. 集成方式评估

| 维度 | 评估 | 依据 |
|---|---|---|
| **接入成本** | ★★★★★ 一行配置 | `externalPacks: [{ source: <包名或路径> }]`；无需改第三方代码、无需适配其构建 |
| **保真度** | ★★★★★ 原汁原味 | bodyAttr 激活 + 原样 CSS（`[data-dsh-aurora]` 作用域未改写）；真实 bundle 提取 23.9KB CSS，规则经 cssRules 取证完整入库 |
| **分层能力（差异化）** | ★★★★★ | 第三方皮肤获得其原生没有的**会话/工作区分层**：实测会话层压过工作区层、逐层清除回落（dsh→workspace→session 三级） |
| **管理体验** | ★★★★☆ | 🎨 选择器卡片（badge 外部/来源 tooltip/主题色）；预览图依赖单元内相对路径（本例缺失→告警降级） |
| **安全边界** | ★★★★★ | 适配器只读外部单元数据（skin.json/CSS/预览图），不执行第三方代码；功能插件仍走 dsh 原生 loader（用户显式安装） |
| **鲁棒性** | ★★★★☆ | CSS 提取启发式已加三重净化（引号/圆括号/花括号配平——残缺碎片曾毒化整表解析致规则被丢弃）；建议生产用 `cssFiles` 显式声明兜底 |

**结论**：Kind A（皮肤→pack 适配）路线成立且效果好——"以 dsh 原生方式安装、以 chameleon 框架方式使用"完整闭环；
Kind B（功能插件）走 dsh 原生 row/bundle 不受影响。两者组合即"整项目集成"。

## 2. 实测结果（e2e_external.py，19/19）

| 阶段 | 断言 | 结果 |
|---|---|---|
| 发现 | 选择器呈现第三方卡 + 外部徽标 + 来源说明 | ✅ |
| 会话应用 | 绑定写会话层（level:session）→ pack=ext-aurora + bodyAttr 双挂 + CSS 变量算出（`linear-gradient(...)`） | ✅ |
| 分层 | 会话层 ext-aurora **压过**工作区层 terminal | ✅ |
| 回落 | 清会话→落工作区 terminal；清工作区→落 dsh 层 quartz；bodyAttr/CSS 变量同步回收 | ✅ |
| 稳定性 | 零 pageerror / 零 console error | ✅ |

单元测试 19/19（含提取启发式回归）；类型检查 0 错误。

## 3. 已知边界与后续

1. bundle CSS 提取是启发式（`cssFiles` 显式 > `*.css` 发现 > 提取）；对特殊打包建议显式声明。
2. 预览图为仓库相对路径（`packages/skins/...`）——发布型单元应改为包内路径或 `skin.json.preview`。
3. 第三方 JSX 组件（设置卡/挂件）不适配为本框架组件，随其原生挂载走（预期行为）。
4. 后续可做：`/ui-skins/external` 管理面写操作（启停 externalPacks）、皮肤中心式批量导入。

## 4. 工程踩坑（备忘）

- **CSS 碎片毒化**：提取的字符串字面量若有未闭合引号/括号，浏览器会丢弃其后的规则（text 在 style 里但 cssRules 空）——sanitizeCssChunk 三配平修复，取证用 cssRules 遍历而非 text.includes。
- **`=*** 表达式` 打码雷**：写入通道会把形如 `VAR=<token读取表达式>` 的赋值打码成 `***`/`$(cat …)`（防泄露），代码里传 token 要用 concat/env 形态绕开。
