/**
 * dsh-ui-skins —— 工作区/会话级 UI/UX 装配框架（host 入口）。
 *
 * 它是机制/框架而非固定界面：
 *   - UI 来源 = 后期可开发的 dsh 插件（通过 ctx.uiSkins.registerPack 注册主题/布局，
 *     通过同一个包的 ./client 入口注册组件）；
 *   - 每个工作区/会话可绑定不同的 UI/UX：解析顺序 会话 > 工作区 > dsh；
 *   - 定制粒度：主题（token/CSS）· 布局（结构级）· 组件（slot 级覆盖）。
 */
import type { Context } from '@deepseek-ai/cordis'
import { Config, type Config as UiSkinsConfig } from './config.ts'
import { UiSkins } from './service.ts'
import { UiSkinsController } from './controller.ts'

export const name = 'ui-skins'

/** storageDomain 是持久化绑定的必需依赖；settings / workspaceRegistry 为可选增强。 */
export const inject = ['storageDomain']

export type { UiSkinsConfig }
export { Config }

export function apply(ctx: Context, config: UiSkinsConfig): void {
  if (!config.enabled) return
  ctx.plugin(UiSkins, config) // 提供 ctx.uiSkins
  ctx.plugin(UiSkinsController) // 提供 ctx.uiSkinsController（生成 ctx.remote.uiSkins）
}

export * from './types.ts'
export { resolveUi, normalizeLayerConfig, mergeLayerConfigs, LEVELS_LOW_TO_HIGH } from './resolve.ts'
