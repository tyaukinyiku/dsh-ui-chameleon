/**
 * dsh-ui-chameleon 框架 host 入口 —— 工作区/会话级 UI/UX 装配框架。
 *
 * 它是机制/框架而非固定界面：
 *   - UI 来源 = 后期可开发的 dsh 插件（通过 ctx.uiSkins.registerPack 注册主题/布局，
 *     通过同一个包的 ./client 入口注册组件）；
 *   - 每个工作区/会话可绑定不同的 UI/UX：解析顺序 会话 > 工作区 > dsh；
 *   - 定制粒度：主题（token/CSS）· 布局（结构级）· 组件（slot 级覆盖）。
 *
 * 运行时零 @deepseek-ai/* 依赖（仅 import type，转译即擦除）——树外 git 安装可直接解析。
 */
import type { Context } from '@deepseek-ai/cordis'
import { Config, type Config as UiSkinsConfig } from './config.ts'
import { UiSkins } from './service.ts'
import { installHttpRoutes } from './http-routes.ts'
import { adaptExternalSource, type ExternalPackAdapted } from './external.ts'

export const name = 'ui-skins'

/** cordis 严格依赖声明：本插件直接触碰的服务必须在此声明（未声明访问会抛错）。 */
export const inject = ['storageDomain', 'webServer']

export type { UiSkinsConfig }
export { Config }

export function apply(ctx: Context, config: UiSkinsConfig): void {
  if (!config.enabled) return
  const service = new UiSkins(ctx, config)
  // 服务注册：ctx.provide 由当前 fiber 托管，卸载自动清理（免 Service 基类依赖）。
  ctx.provide('uiSkins', service)

  // 外部 web-ui 皮肤单元（外部包集成器）：市场源 / 本地单元统一适配为 pack。
  // 适配器只读外部单元的数据（skin.json/CSS/预览图），不执行外部代码；市场拉取为异步。
  const external: ExternalPackAdapted[] = []
  void (async () => {
    for (const entry of config.externalPacks) {
      if (entry.enabled === false) continue
      const adapted = await adaptExternalSource(entry, [new URL('.', import.meta.url).pathname, process.cwd()])
      external.push(adapted)
      if (adapted.ok) {
        ctx.effect(() => ctx.uiSkins.registerPack(adapted.pack), `ui-skins: external pack ${adapted.pack.id}`)
      }
    }
  })()

  installHttpRoutes(ctx, service, external) // /ui-skins/* 路由 + SSE + 外部单元

  // 可选能力：独立子插件 + 显式注入——workspaceRegistry 缺席时保持 pending，不影响主链路。
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
