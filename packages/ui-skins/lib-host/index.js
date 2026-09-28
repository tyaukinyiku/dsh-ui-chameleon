import { Config } from './config.js';
import { UiSkins } from './service.js';
import { installHttpRoutes } from './http-routes.js';
import { adaptExternalSource } from './external.js';
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
    // 外部 web-ui 皮肤单元（外部包集成器）：市场源 / 本地单元统一适配为 pack。
    // 适配器只读外部单元的数据（skin.json/CSS/预览图），不执行外部代码；市场拉取为异步。
    const external = [];
    void (async () => {
        for (const entry of config.externalPacks) {
            if (entry.enabled === false)
                continue;
            const adapted = await adaptExternalSource(entry, [new URL('.', import.meta.url).pathname, process.cwd()]);
            external.push(adapted);
            if (adapted.ok) {
                ctx.effect(() => ctx.uiSkins.registerPack(adapted.pack), `ui-skins: external pack ${adapted.pack.id}`);
            }
        }
    })();
    installHttpRoutes(ctx, service, external); // /ui-skins/* 路由 + SSE + 外部单元
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
