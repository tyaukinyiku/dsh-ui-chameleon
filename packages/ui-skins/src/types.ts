/**
 * dsh-ui-skins 共享类型 —— Node 侧与浏览器侧共用。
 * 全部 JSON 可序列化，可安全跨越 Typert Remote 传输。
 */

/** 配置层级，从低到高：dsh → workspace → session。 */
export type Level = 'dsh' | 'workspace' | 'session'

/** 允许写入绑定的层级（dsh 层来自插件配置 / settings，不可经 Remote 写）。 */
export type BindingLevel = 'workspace' | 'session'

/** 组件引用：指向某个 UI pack 在浏览器半注册的一个渲染单元。 */
export interface UiComponentRef {
  /** UI pack id（host 半与浏览器半用同一个 id）。 */
  pack: string
  /** pack 内的组件名。 */
  name: string
  /** slot 注册 order；数值越小越先渲染/遮蔽（single 型 slot 的遮蔽优先级）。默认 -100。 */
  order?: number
  /** 目标 slot 为 keyed 型时的 entryKey。 */
  entryKey?: string
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
 * 浏览器半（React 组件）由同一个包的 ./client 入口注册到 ctx.uiSkinsClient。
 */
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

export type UiSkinsFollowFrame =
  | { kind: 'baseline'; revision: number; packs: UiPackDescriptor[] }
  | { kind: 'changed'; revision: number }

/**
 * host 面 Remote 方法（真实构建里由 Typert 从 UiSkinsController 生成；
 * 这里手写一份同形 face 供浏览器半编译）。
 */
export interface UiSkinsRemote {
  resolve(request: ResolveRequest): Promise<UiSpecEnvelope>
  describe(): Promise<UiSkinsDescribe>
  getLayer(level: BindingLevel, id: string): Promise<UiLayerConfig | null>
  setLayer(level: BindingLevel, id: string, config: UiLayerConfig | null): Promise<void>
  follow(signal: AbortSignal): AsyncIterable<UiSkinsFollowFrame>
}
