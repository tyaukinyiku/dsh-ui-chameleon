import { Config } from './config.js';
import { UiSkins } from './service.js';
import { installHttpRoutes } from './http-routes.js';
export const name = 'ui-skins';
/** cordis 严格依赖声明：本插件直接触碰的服务必须在此声明（未声明访问会抛错）。 */
export const inject = ['storageDomain', 'webServer'];
export { Config };
export function apply(ctx, config) {
    if (!config.enabled)
        return;
    const service = new UiSkins(ctx, config);
    // 服务注册：ctx.provide 由当前 fiber 托管，卸载自动清理（免 Service 基类依赖）。
    ctx.provide('uiSkins', service);
    installHttpRoutes(ctx, service); // /ui-skins/* 路由 + SSE
    // 可选能力：独立子插件 + 显式注入——workspaceRegistry 缺席时保持 pending，不影响主链路。
    ctx.plugin({
        name: 'ui-skins-workspace',
        inject: ['workspaceRegistry'],
        apply(context) {
            service.attachWorkspaceLocator(context.workspaceRegistry);
        },
    });
}
export * from './types.js';
export { resolveUi, normalizeLayerConfig, mergeLayerConfigs, LEVELS_LOW_TO_HIGH } from './resolve.js';
export { UI_SKINS_ROUTE_BASE } from './http-routes.js';
