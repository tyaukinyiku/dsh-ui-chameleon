/**
 * 插件配置（cordis.yml / 组合包 patch 行内 config）。
 *
 * Config 导出为 **Standard Schema**（cordis 要求；不导出普通对象），
 * 手写实现以避免运行时依赖 schemastery —— 树外安装时解析不到 @deepseek-ai/*。
 */
import type { ExternalPackEntry, UiLayerConfig } from './types.ts'

export interface Config {
  enabled: boolean
  /** dsh 层：默认 UI pack（'' = 不使用 pack，可被上层覆盖）。 */
  defaultPack: string
  defaultTheme: string
  defaultLayout: string
  defaultCss: string
  defaultTokens: Record<string, string>
  /** 工作区层的文件来源：<workspace>/<workspaceFilePath>。 */
  workspaceFileEnabled: boolean
  workspaceFilePath: string
  /** 文件层的轮询刷新间隔（毫秒）。 */
  workspaceFilePollMs: number
  /** 目标观察器（把当前 session/workspace 喂给解析器）的 slot 注册参数。 */
  observerSlot: string
  observerId: string
  observerOrder: number
  /** 外部 web-ui 皮肤单元（包名或路径）；由适配器转为 pack 注册。 */
  externalPacks: ExternalPackEntry[]
}

const DEFAULTS: Config = {
  enabled: true,
  defaultPack: 'default',
  defaultTheme: '',
  defaultLayout: '',
  defaultCss: '',
  defaultTokens: {},
  workspaceFileEnabled: true,
  workspaceFilePath: '.dsh/ui.json',
  workspaceFilePollMs: 2000,
  observerSlot: 'conversation.session.header.utilities',
  observerId: 'ui-skins-observer',
  observerOrder: 0,
  externalPacks: [],
}

/** 填充默认值 + 字段校验；配置错误响亮抛出。 */
export function parseConfig(input: unknown): Config {
  const raw = (input ?? {}) as Record<string, unknown>
  const config: Config = { ...DEFAULTS, defaultTokens: {} }
  for (const key of Object.keys(raw)) {
    if (!(key in DEFAULTS)) throw new Error(`ui-skins 配置未知字段: ${key}`)
  }
  if (raw.externalPacks !== undefined) {
    if (!Array.isArray(raw.externalPacks)) throw new Error('ui-skins 配置 externalPacks 期望数组')
    config.externalPacks = raw.externalPacks.map((item, i) => {
      const o = item as Record<string, unknown>
      if (!o || typeof o !== 'object') throw new Error(`ui-skins 配置 externalPacks[${i}] 期望对象`)
      for (const k of Object.keys(o)) {
        if (!['source', 'id', 'enabled', 'cssFiles'].includes(k)) {
          throw new Error(`ui-skins 配置 externalPacks[${i}] 未知字段: ${k}`)
        }
      }
      if (typeof o.source !== 'string' || !o.source) {
        throw new Error(`ui-skins 配置 externalPacks[${i}].source 期望非空字符串`)
      }
      const entry: ExternalPackEntry = { source: o.source }
      if (o.id !== undefined) {
        if (typeof o.id !== 'string') throw new Error(`ui-skins 配置 externalPacks[${i}].id 期望 string`)
        entry.id = o.id
      }
      if (o.enabled !== undefined) {
        if (typeof o.enabled !== 'boolean') throw new Error(`ui-skins 配置 externalPacks[${i}].enabled 期望 boolean`)
        entry.enabled = o.enabled
      }
      if (o.cssFiles !== undefined) {
        if (!Array.isArray(o.cssFiles) || o.cssFiles.some((f) => typeof f !== 'string')) {
          throw new Error(`ui-skins 配置 externalPacks[${i}].cssFiles 期望 string[]`)
        }
        entry.cssFiles = o.cssFiles as string[]
      }
      return entry
    })
  }
  const str = (key: keyof Config): void => {
    const value = raw[key]
    if (value !== undefined && typeof value !== 'string') {
      throw new Error(`ui-skins 配置 ${key} 期望 string`)
    }
    if (typeof value === 'string') (config[key] as string) = value
  }
  str('defaultPack')
  str('defaultTheme')
  str('defaultLayout')
  str('defaultCss')
  str('workspaceFilePath')
  str('observerSlot')
  str('observerId')
  const num = (key: keyof Config): void => {
    const value = raw[key]
    if (value !== undefined && typeof value !== 'number') {
      throw new Error(`ui-skins 配置 ${key} 期望 number`)
    }
    if (typeof value === 'number') (config[key] as number) = value
  }
  num('workspaceFilePollMs')
  num('observerOrder')
  const bool = (key: keyof Config): void => {
    const value = raw[key]
    if (value !== undefined && typeof value !== 'boolean') {
      throw new Error(`ui-skins 配置 ${key} 期望 boolean`)
    }
    if (typeof value === 'boolean') (config[key] as boolean) = value
  }
  bool('enabled')
  bool('workspaceFileEnabled')
  if (raw.defaultTokens !== undefined) {
    const tokens = raw.defaultTokens
    if (typeof tokens !== 'object' || tokens === null || Array.isArray(tokens)) {
      throw new Error('ui-skins 配置 defaultTokens 期望对象')
    }
    for (const [key, value] of Object.entries(tokens)) {
      if (typeof value !== 'string') throw new Error(`ui-skins 配置 defaultTokens.${key} 期望 string`)
      config.defaultTokens[key] = value
    }
  }
  return config
}

/** Standard Schema（https://standardschema.dev）形态的配置校验器。 */
export const Config: {
  '~standard': {
    vendor: string
    version: 1
    validate(value: unknown): { value: Config } | { issues: Array<{ message: string }> }
  }
} = {
  '~standard': {
    vendor: 'dsh-ui-chameleon',
    version: 1,
    validate(value: unknown) {
      try {
        return { value: parseConfig(value) }
      } catch (error) {
        return { issues: [{ message: String(error) }] }
      }
    },
  },
}

/** dsh 层（组合层）的 UiLayerConfig 形态。 */
export function configToLayer(config: Config): UiLayerConfig {
  return {
    pack: config.defaultPack || null,
    theme: config.defaultTheme || null,
    layout: config.defaultLayout || null,
    css: config.defaultCss || null,
    tokens: { ...config.defaultTokens },
  }
}

/** 客户端运行时需要的配置面（经 /ui-skins/state 下发）。 */
export function observerOf(config: Config): { slotKey: string; id: string; order: number } {
  return { slotKey: config.observerSlot, id: config.observerId, order: config.observerOrder }
}
