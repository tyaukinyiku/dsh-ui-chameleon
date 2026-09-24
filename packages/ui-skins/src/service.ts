/**
 * ctx.uiSkins —— UI/UX 装配框架的 host 服务：
 *   1. UI pack 注册表（UI 来源 = 后期可开发的 dsh 插件）；
 *   2. 三级解析（会话 > 工作区 > dsh）；
 *   3. 工作区/会话绑定的读写与变更通知。
 */
import { Service, type Context } from '@deepseek-ai/cordis'
import { z } from 'zod'
import type {
  BindingLevel,
  UiLayerConfig,
  UiPackDescriptor,
  UiSkinsDescribe,
  UiSpec,
  UiSpecEnvelope,
  UiTarget,
} from './types.ts'
import { mergeLayerConfigs, normalizeLayerConfig, resolveUi } from './resolve.ts'
import { BindingStore } from './store.ts'
import { configToLayer, observerOf, type Config } from './config.ts'

interface SettingsScopeLike {
  get(): unknown
  watch(callback: (next: unknown, prev: unknown) => void): () => void
}

interface SettingsLike {
  register(ns: string, schema: unknown, options?: { base?: unknown; applies?: string }): SettingsScopeLike
}

interface WorkspaceLike {
  id: string
  path: string
  sessionIds?: readonly string[]
}

interface WorkspaceRegistryLike {
  list(): WorkspaceLike[]
  get(id: string): WorkspaceLike | undefined
}

export class UiSkins extends Service {
  static inject = ['storageDomain']

  readonly store: BindingStore
  private readonly packs = new Map<string, UiPackDescriptor>()
  private readonly listeners = new Set<() => void>()
  private globalScope?: SettingsScopeLike
  revision = 0

  constructor(ctx: Context, private readonly config: Config) {
    super(ctx, 'uiSkins')
    this.store = new BindingStore(ctx, config)
    this.installSettingsLayer()
  }

  // ---------- UI pack 注册表（UI 的唯一来源：普通 dsh 插件） ----------

  /**
   * 注册一个 UI pack（数据面：主题/布局/默认组件声明）。
   * 组件工厂由同一个包的浏览器半注册到 ctx.uiSkinsClient。
   * 调用方用 ctx.effect(() => ctx.uiSkins.registerPack(...)) 包裹以绑定插件生命周期。
   */
  registerPack(pack: UiPackDescriptor): () => void {
    if (!pack?.id) throw new Error('registerPack: 缺少 pack.id')
    if (this.packs.has(pack.id)) throw new Error(`registerPack: pack id 重复: ${pack.id}`)
    this.packs.set(pack.id, pack)
    this.bump()
    return () => {
      if (this.packs.get(pack.id) === pack) {
        this.packs.delete(pack.id)
        this.bump()
      }
    }
  }

  listPacks(): UiPackDescriptor[] {
    return [...this.packs.values()]
  }

  // ---------- 三级解析 ----------

  /** 解析目标的最终 UI 规格：会话层 > 工作区层 > dsh 层。 */
  async resolve(target: UiTarget): Promise<UiSpecEnvelope> {
    await this.store.ready()
    const located = this.locate(target)
    const warnings: string[] = [...this.store.warnings]
    const workspace = this.store.workspaceLayer(located.workspaceId, located.workspacePath, warnings)
    const session = located.sessionId
      ? this.store.sessionLayer(located.sessionId, warnings)
      : undefined
    const layers: { dsh: UiLayerConfig; workspace?: UiLayerConfig; session?: UiLayerConfig } = {
      dsh: this.baseLayer(),
    }
    if (workspace) layers.workspace = workspace
    if (session) layers.session = session
    const spec = resolveUi({ layers, packs: this.packs.values() })
    spec.warnings.unshift(...warnings)
    return { spec, target: located, revision: this.revision }
  }

  /** 仅解析（同步、不读存储）——测试与派生场景用。 */
  resolveLayers(layers: { dsh: UiLayerConfig; workspace?: UiLayerConfig; session?: UiLayerConfig }): UiSpec {
    return resolveUi({ layers, packs: this.packs.values() })
  }

  // ---------- 绑定读写（写路径响亮失败） ----------

  async getLayer(level: BindingLevel, id: string): Promise<UiLayerConfig | null> {
    await this.store.ready()
    return this.store.getBinding(level, id)
  }

  async setLayer(level: BindingLevel, id: string, config: UiLayerConfig | null): Promise<void> {
    await this.store.ready()
    if (config !== null) this.assertUsable(config, `${level}:${id}`)
    await this.store.setBinding(level, id, config)
    this.bump()
  }

  describe(): UiSkinsDescribe {
    return {
      revision: this.revision,
      packs: this.listPacks(),
      defaults: this.baseLayer(),
      observer: observerOf(this.config),
    }
  }

  /** 变更通知（pack 增删、绑定写入、global 层变化）；拉取模型，监听方自行重新 resolve。 */
  onChange(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // ---------- 内部 ----------

  /** dsh 层 = 组合配置 < settings namespace `ui-skins` 用户层。 */
  private baseLayer(): UiLayerConfig {
    const composed = configToLayer(this.config)
    const userRaw = this.globalScope?.get()
    if (!userRaw) return composed
    const { config: user, errors } = normalizeLayerConfig(userRaw, 'settings:ui-skins')
    void errors // settings 的 schema 已在写路径校验；此处兜底忽略
    return mergeLayerConfigs(composed, user)
  }

  private installSettingsLayer(): void {
    const settings = (this.ctx as { settings?: SettingsLike }).settings
    if (!settings?.register) return
    try {
      this.globalScope = settings.register('ui-skins', globalLayerSchema, {
        base: configToLayer(this.config),
        applies: 'live',
      })
      this.globalScope.watch(() => this.bump())
    } catch (error) {
      this.store.warnings.push(`注册 settings 命名空间 ui-skins 失败: ${String(error)}`)
    }
  }

  /** 写路径校验：结构 + 引用（pack/theme/layout 必须已注册）。 */
  private assertUsable(config: UiLayerConfig, where: string): void {
    const { errors } = normalizeLayerConfig(config, where)
    const problems = [...errors]
    if (typeof config.pack === 'string') {
      const pack = this.packs.get(config.pack)
      if (!pack) problems.push(`${where}.pack: 未注册的 UI pack: ${config.pack}`)
      else {
        if (typeof config.theme === 'string' && !pack.themes?.[config.theme]) {
          problems.push(`${where}.theme: pack ${pack.id} 未提供主题: ${config.theme}`)
        }
        if (typeof config.layout === 'string' && !pack.layouts?.[config.layout]) {
          problems.push(`${where}.layout: pack ${pack.id} 未提供布局: ${config.layout}`)
        }
      }
    } else if (typeof config.theme === 'string' || typeof config.layout === 'string') {
      problems.push(`${where}: 设置 theme/layout 需要同时指定 pack`)
    }
    for (const [key, ref] of Object.entries(config.components ?? {})) {
      if (ref && !this.packs.has(ref.pack)) {
        problems.push(`${where}.components.${key}: 未注册的 UI pack: ${ref.pack}`)
      }
    }
    if (problems.length > 0) throw new Error(`UI 配置无效:\n- ${problems.join('\n- ')}`)
  }

  /** 目标推导：补全 workspaceId / workspacePath（经 ctx.workspaceRegistry，缺席则保持原样）。 */
  private locate(target: UiTarget): Required<UiTarget> & { sessionId?: string } {
    const registry = (this.ctx as { workspaceRegistry?: WorkspaceRegistryLike }).workspaceRegistry
    let workspaceId = target.workspaceId
    let workspacePath = target.workspacePath
    if (!workspaceId && target.sessionId && registry?.list) {
      for (const workspace of registry.list()) {
        if (workspace.sessionIds?.includes(target.sessionId)) {
          workspaceId = workspace.id
          break
        }
      }
    }
    if (!workspacePath && workspaceId && registry?.get) {
      workspacePath = registry.get(workspaceId)?.path
    }
    return {
      sessionId: target.sessionId,
      workspaceId,
      workspacePath,
    } as Required<UiTarget> & { sessionId?: string }
  }

  private bump(): void {
    this.revision += 1
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (error) {
        this.store.warnings.push(`uiSkins 变更监听器异常: ${String(error)}`)
      }
    }
  }
}

/** settings namespace `ui-skins` 的 zod schema（用户可编辑的 dsh 层）。 */
const globalLayerSchema = z.object({
  pack: z.nullable(z.string()).optional(),
  theme: z.nullable(z.string()).optional(),
  layout: z.nullable(z.string()).optional(),
  tokens: z.record(z.nullable(z.string())).optional(),
  css: z.nullable(z.string()).optional(),
  components: z.record(z.unknown()).optional(),
})
