import { Config } from './config.js';
import { UiSkins } from './service.js';
import { installHttpRoutes } from './http-routes.js';
import { adaptExternalPack, resolveExternalRoot } from './external.js';
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
    // 外部 web-ui 皮肤单元（外部包集成器）：适配为 pack，与内置 pack 同面注册。
    // 适配器只读外部单元的数据（skin.json/CSS/预览图），不执行外部代码。
    const external = [];
    for (const entry of config.externalPacks) {
        if (entry.enabled === false)
            continue;
        const root = resolveExternalRoot(entry.source, [new URL('.', import.meta.url).pathname, process.cwd()]);
        if (!root) {
            external.push({
                pack: {
                    id: `ext-missing-${external.length + 1}`,
                    title: entry.source,
                    external: { kind: 'external-skin', source: entry.source, originalId: '', cssOrigin: 'none' },
                },
                root: '',
                assets: new Map(),
                warnings: [`无法解析外部单元: ${entry.source}（包名需已安装在 profile node_modules，或用目录路径）`],
            });
            continue;
        }
        const adapted = adaptExternalPack(root, entry);
        external.push(adapted);
        ctx.effect(() => ctx.uiSkins.registerPack(adapted.pack), `ui-skins: external pack ${adapted.pack.id}`);
    }
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
