/**
 * dsh-ui-skins 共享类型 —— Node 侧与浏览器侧共用。
 * 全部 JSON 可序列化，可安全跨越 HTTP/Remote 传输。
 */

/** 配置层级，从低到高：dsh → workspace → session。 */
export type Level = 'dsh' | 'workspace' | 'session'

/** 允许写入绑定的层级（dsh 层来自插件配置 / settings，不可经 API 写）。 */
export type BindingLevel = 'workspace' | 'session'

/**
 * 组件引用：指向某个 UI pack 在浏览器半注册的一个渲染单元。
 *
 * slot 形态字段（对齐 dsh-client-ui-slots 的 register options）：
 *   - single 型 slot：只用 priority（cell = slot 本身）；
 *   - keyed 型 slot：必填 key（同 key + 同 priority 会抛错）；
 *   - list 型 slot：必填 id，order 为显示顺序。
 *   priority 是遮蔽排名：升序、默认 0、最小者渲染；与占用者 priority 相同会抛错，
 *   所以覆盖内建 cell 时请用不同于 0 的 priority（默认取 -1）。
 */
export interface UiComponentRef {
  /** UI pack id（host 半与浏览器半用同一个 id）。 */
  pack: string
  /** pack 内的组件名。 */
  name: string
  /** keyed 型 slot 的派发键。 */
  key?: string
  /** list 型 slot 的 cell id。 */
  id?: string
  /** list 型显示顺序。 */
  order?: number
  /** cell 遮蔽排名（升序、最小渲染；默认 -1）。 */
  priority?: number
}

/**
 * 一层 UI 配置。三个层级同构，字段语义：
 *   - 键不存在 / undefined = 继承下层（“会话没配置用工作区，工作区没配置用 dsh”）；
 *   - 显式 null = 清除：阻断继承，回到 pack 默认（theme/layout）或空（pack/css/覆盖项）；
 *   - 具体值 = 覆盖。
 */
export interface UiLayerConfig {
  pack?: string | null
  theme?: string | null
  layout?: string | null
  /** CSS 自定义属性覆盖；值为 null = 删除该 token 覆盖（回落 pack/主题/布局打底值）。 */
  tokens?: Record<string, string | null>
  /** 附加 CSS；null = 清除已累积的“层级附加 CSS”（不影响 pack/主题/布局自带样式）。 */
  css?: string | null
  /** slotKey -> 组件覆盖；null = 清除覆盖（回到 dsh 原生 UI 或更低层的选择）。 */
  components?: Record<string, UiComponentRef | null>
}

/** 命名主题：一组 token 与附加样式。 */
export interface UiTheme {
  id: string
  title?: string
  dark?: boolean
  tokens?: Record<string, string>
  css?: string
}

/** 命名布局：结构级定制 = token 预设 + 布局样式 + 结构性组件覆盖。 */
export interface UiLayout {
  id: string
  title?: string
  tokens?: Record<string, string>
  css?: string
  components?: Record<string, UiComponentRef>
}

/**
 * UI pack（host 半，数据面）：由普通 dsh 插件通过 ctx.uiSkins.registerPack() 注册。
 * 浏览器半（渲染组件）由同一个包的 ./client 入口注册到 ctx.uiSkinsClient。
 */
/** 外部包配置项（适配器输入；JSON 可序列化）。 */
export interface ExternalPackEntry {
  /** 来源：包名（profile node_modules 解析）、目录路径、或 `market:<skinId>`（dsh-market.com 市场皮肤）。 */
  source: string
  /** 可选：覆盖生成的 pack id（默认 ext-<skin.id>）。 */
  id?: string
  /** 可选：默认 true。 */
  enabled?: boolean
  /** 可选：显式 CSS 资产（相对单元根）；缺省时自动发现/提取。 */
  cssFiles?: string[]
  /** 可选：卡片标题覆盖（市场皮肤无元数据端点时用）。 */
  title?: string
  /** 可选：卡片简介覆盖。 */
  description?: string
}

/** 外部来源标注（适配器生成；调试/设置界面用）。 */
export interface UiExternalSource {
  kind: 'external-skin'
  source: string
  originalId: string
  package?: string
  cssOrigin?: 'files' | 'discover' | 'extract' | 'market' | 'none'
}

export interface UiPackDescriptor {
  id: string
  title?: string
  description?: string
  version?: string
  /** pack 的基础 token，位于主题/布局之下。 */
  baseTokens?: Record<string, string>
  baseCss?: string
  /** pack 自带的默认组件覆盖（位于布局覆盖之下）。 */
  baseComponents?: Record<string, UiComponentRef>
  themes?: Record<string, UiTheme>
  layouts?: Record<string, UiLayout>
  defaultTheme?: string
  defaultLayout?: string
  /** 外部皮肤：激活标记 `attr` 或 `attr=value`（如 data-dsh-skin=verdandi）；激活 pack 时由 runtime 设置。 */
  bodyAttr?: string
  /** 预览图 URL（外部皮肤卡用；light/dark）。 */
  preview?: { light?: string; dark?: string }
  /** 外部来源标注（适配器生成）。 */
  external?: UiExternalSource
}

/** 解析结果的来源标注（调试/设置界面用）。 */
export interface UiProvenance {
  pack: Level | 'none'
  theme: Level | 'pack-default' | 'none'
  layout: Level | 'pack-default' | 'none'
  tokens: Record<string, Level | 'pack'>
  components: Record<string, Level | 'pack'>
  css: Array<Level | 'pack-base' | 'theme' | 'layout'>
}

/** 三级解析后的最终 UI 规格。 */
export interface UiSpec {
  packId: string | null
  /** 生效 pack 的 body 属性激活标记（外部皮肤作用域开关）。 */
  bodyAttr?: string | null
  themeId: string | null
  layoutId: string | null
  /** 最终生效的 CSS 自定义属性表（打底 + 覆盖合并后）。 */
  tokens: Record<string, string>
  /** 有序拼接的样式文本（pack 基础 → 主题 → 布局 → 各层附加 css）。 */
  css: string
  /** slotKey -> 生效的组件覆盖；缺席的 key 渲染 dsh 原生组件。 */
  components: Record<string, UiComponentRef>
  provenance: UiProvenance
  /** 读路径的降级诊断（未注册的 pack/主题等）；写路径会直接拒绝这类配置。 */
  warnings: string[]
}

/** 解析目标：会话 + 其工作区。workspaceId/workspacePath 缺省时由 host 侧推导。 */
export interface UiTarget {
  sessionId?: string
  workspaceId?: string
  workspacePath?: string
}

export interface ResolveRequest extends UiTarget {}

export interface UiSpecEnvelope {
  spec: UiSpec
  /** 推导后的完整目标（host 回填 workspaceId / workspacePath）。 */
  target: UiTarget
  revision: number
}

export interface UiSkinsDescribe {
  revision: number
  packs: UiPackDescriptor[]
  defaults: UiLayerConfig
  observer: { slotKey: string; id: string; order: number }
}

/**
 * host 面 API（浏览器经 /ui-skins/* HTTP 路由调用，client/api.ts 提供实现）。
 *
 * 说明：dsh 的 Typert Remote 面向仓库内构建的业务包（生成的 Client 产物 + api-remotes
 * 显式收录），树外插件无法在运行时挂载 strict descriptor；按 API Gateway 文档
 * “Feature-owned exact Fetch routes” 与 host-webserver 的 route 注册 seam 自带传输。
 */
export interface UiSkinsRemote {
  resolve(request: ResolveRequest): Promise<UiSpecEnvelope>
  describe(): Promise<UiSkinsDescribe>
  listWorkspaces(): Promise<Array<{ id: string; path: string }>>
  getLayer(level: BindingLevel, id: string): Promise<UiLayerConfig | null>
  setLayer(level: BindingLevel, id: string, config: UiLayerConfig | null): Promise<void>
  /** 订阅变更（每次 pack 增删 / 绑定写入 / global 层变化触发一次）。返回退订函数。 */
  changes(onChange: (revision: number) => void): () => void
}
