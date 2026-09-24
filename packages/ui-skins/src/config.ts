/**
 * 插件配置（cordis.yml 中该行的 config）。
 * Schemastery schema：加载时校验并填充默认值（官方“插件配置”约定）。
 */
import Schema from '@deepseek-ai/schemastery'
import type { UiLayerConfig } from './types.ts'

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
}

export const Config: Schema<Config> = Schema.object({
  enabled: Schema.boolean().default(true),
  defaultPack: Schema.string().default('default'),
  defaultTheme: Schema.string().default(''),
  defaultLayout: Schema.string().default(''),
  defaultCss: Schema.string().default(''),
  defaultTokens: Schema.dict(Schema.string()).default({}),
  workspaceFileEnabled: Schema.boolean().default(true),
  workspaceFilePath: Schema.string().default('.dsh/ui.json'),
  workspaceFilePollMs: Schema.number().default(2000),
  observerSlot: Schema.string().default('conversation.session.header.utilities'),
  observerId: Schema.string().default('ui-skins-observer'),
  observerOrder: Schema.number().default(0),
})

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

/** 客户端运行时需要的配置面（经 Remote.describe() 下发）。 */
export function observerOf(config: Config): { slotKey: string; id: string; order: number } {
  return { slotKey: config.observerSlot, id: config.observerId, order: config.observerOrder }
}
