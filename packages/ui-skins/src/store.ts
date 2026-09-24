/**
 * 绑定存储：工作区层 = .dsh/ui.json 文件 < storage-domain 记录；会话层 = storage-domain 记录。
 * 文件来源是项目可入库、可评审的工作区默认；记录来源是用户/UI 的显式选择。
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { BindingLevel, UiLayerConfig } from './types.ts'
import { mergeLayerConfigs, normalizeLayerConfig } from './resolve.ts'
import { uiSkinsDomain } from './domain.ts'
import type { Config } from './config.ts'

interface TableLike {
  get(key: string): UiLayerConfig | undefined
  keys(): IterableIterator<string>
  put(key: string, value: UiLayerConfig): Promise<void>
  delete(key: string): Promise<boolean>
}

interface DomainLike {
  table(name: string): TableLike
}

interface FileEntry {
  mtimeMs: number
  config?: UiLayerConfig
  errors: string[]
}

export class BindingStore {
  private domain?: DomainLike
  private readonly fileCache = new Map<string, FileEntry>()
  readonly warnings: string[] = []
  private readyPromise: Promise<void>
  private readyResolve!: () => void

  constructor(
    private readonly ctx: Context,
    private readonly config: Config,
  ) {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve
    })
    void this.open()
    if (config.workspaceFileEnabled && config.workspaceFilePollMs > 0) {
      const timer = setInterval(() => this.fileCache.clear(), config.workspaceFilePollMs)
      this.ctx.effect(() => () => clearInterval(timer), 'ui-skins: workspace file cache poll')
    }
  }

  /** 等待存储就绪（storageDomain 缺失时立即兑现并记录 warning）。 */
  ready(): Promise<void> {
    return this.readyPromise
  }

  private async open(): Promise<void> {
    const facility = (this.ctx as { storageDomain?: { open?: (spec: unknown) => Promise<DomainLike> } })
      .storageDomain
    if (!facility?.open) {
      this.warnings.push('ctx.storageDomain 不可用：绑定仅保留内存态（工作区文件层仍可读）')
      this.readyResolve()
      return
    }
    try {
      this.domain = await facility.open(uiSkinsDomain)
    } catch (error) {
      this.warnings.push(`打开存储领域 ${uiSkinsDomain.name} 失败: ${String(error)}`)
    }
    this.readyResolve()
  }

  private table(level: BindingLevel): TableLike | undefined {
    return this.domain?.table(level === 'workspace' ? 'workspace_bindings' : 'session_bindings')
  }

  /** 读一条绑定记录（未设置返回 null）。 */
  getBinding(level: BindingLevel, id: string): UiLayerConfig | null {
    const record = this.table(level)?.get(id)
    return record ? { ...record } : null
  }

  /** 写（config = null 时删除）绑定记录。 */
  async setBinding(level: BindingLevel, id: string, config: UiLayerConfig | null): Promise<void> {
    const table = this.table(level)
    if (!table) throw new Error('绑定存储不可用（storageDomain 未就绪）')
    if (config === null) await table.delete(id)
    else await table.put(id, config)
  }

  /** 列出某层已绑定的 id（设置界面用）。 */
  listBindings(level: BindingLevel): string[] {
    return [...(this.table(level)?.keys() ?? [])]
  }

  /**
   * 工作区层合成：<workspace>/<workspaceFilePath> 文件层 < 存储记录层。
   * 文件读取带 mtime 缓存；解析失败进 warnings（读路径优雅降级）。
   */
  workspaceLayer(
    workspaceId: string | undefined,
    workspacePath: string | undefined,
    warnings: string[],
  ): UiLayerConfig | undefined {
    const fileLayer = workspacePath ? this.readFileLayer(workspacePath, warnings) : undefined
    const recordLayer = workspaceId ? this.getBinding('workspace', workspaceId) ?? undefined : undefined
    const merged = mergeLayerConfigs(fileLayer, recordLayer)
    return Object.keys(merged).length > 0 ? merged : undefined
  }

  /** 会话层：仅存储记录。 */
  sessionLayer(sessionId: string, warnings: string[]): UiLayerConfig | undefined {
    const record = this.getBinding('session', sessionId)
    if (!record) return undefined
    const { config, errors } = normalizeLayerConfig(record, `session:${sessionId}`)
    for (const error of errors) warnings.push(error)
    return config
  }

  private readFileLayer(workspacePath: string, warnings: string[]): UiLayerConfig | undefined {
    const file = join(workspacePath, this.config.workspaceFilePath)
    let mtimeMs = 0
    try {
      if (!existsSync(file)) {
        this.fileCache.delete(file)
        return undefined
      }
      mtimeMs = statSync(file).mtimeMs
    } catch {
      return undefined
    }
    const cached = this.fileCache.get(file)
    if (cached && cached.mtimeMs === mtimeMs) {
      for (const error of cached.errors) warnings.push(error)
      return cached.config
    }
    try {
      const raw: unknown = JSON.parse(readFileSync(file, 'utf8'))
      const { config, errors } = normalizeLayerConfig(raw, `${this.config.workspaceFilePath}`)
      for (const error of errors) warnings.push(`${file}: ${error}`)
      this.fileCache.set(file, { mtimeMs, config, errors })
      return config
    } catch (error) {
      const errors = [`${file}: 读取/解析失败: ${String(error)}`]
      for (const item of errors) warnings.push(item)
      this.fileCache.set(file, { mtimeMs, errors })
      return undefined
    }
  }
}
