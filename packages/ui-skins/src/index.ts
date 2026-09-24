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
import { installHttpRoutes } from './http-routes.ts'

export const name = 'ui-skins'

/** cordis 严格依赖声明：本插件直接触碰的服务必须在此声明（未声明访问会抛错）。 */
export const inject = ['storageDomain', 'webServer']

export type { UiSkinsConfig }
export { Config }

export function apply(ctx: Context, config: UiSkinsConfig): void {
  if (!config.enabled) return
  // 服务实例化即注册（Service 构造函数调用 ctx.reflect.provide），随本 fiber 卸载。
  const service = new UiSkins(ctx, config) // 提供 ctx.uiSkins
  installHttpRoutes(ctx, service) // /ui-skins/* 路由 + SSE

  // 可选能力：独立子插件 + 显式注入——对应服务缺席时保持 pending，不影响主链路。
  ctx.plugin({
    name: 'ui-skins-workspace',
    inject: ['workspaceRegistry'],
    apply(context: Context): void {
      service.attachWorkspaceLocator(
        (context as unknown as { workspaceRegistry: Parameters<UiSkins['attachWorkspaceLocator']>[0] }).workspaceRegistry,
      )
    },
  })
}

export * from './types.ts'
export { resolveUi, normalizeLayerConfig, mergeLayerConfigs, LEVELS_LOW_TO_HIGH } from './resolve.ts'
export { UI_SKINS_ROUTE_BASE } from './http-routes.ts'
