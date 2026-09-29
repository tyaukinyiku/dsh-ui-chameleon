import { Config } from './config.js';
import { UiSkins } from './service.js';
import { installHttpRoutes } from './http-routes.js';
import { adaptExternalPack, adaptExternalSource, findNodeModules, scanNodeModulesSkins, scanSkinUnits, } from './external.js';
import { installEngineAdaptation } from './skin-engine/external-v2.js';
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
    const units = [];
    const seenRoots = new Set();
    const seenIds = new Set();
    const baseDirs = [new URL('.', import.meta.url).pathname, process.cwd()];
    const register = (adapted) => {
        if (!adapted.ok || seenIds.has(adapted.pack.id))
            return;
        // 引擎收编（A 路线）：安全管线通过者交给官方 skin-controller 渲染；
        // 被拒者保留旧适配路径（pack 自带 CSS/bodyAttr/hooks）。
        for (const unit of installEngineAdaptation([adapted]))
            units.push(unit);
        seenIds.add(adapted.pack.id);
        seenRoots.add(adapted.root);
        external.push(adapted);
        ctx.effect(() => ctx.uiSkins.registerPack(adapted.pack), `ui-skins: external pack ${adapted.pack.id}`);
    };
    void (async () => {
        for (const entry of config.externalPacks) {
            if (entry.enabled === false)
                continue;
            const adapted = await adaptExternalSource(entry, baseDirs);
            seenRoots.add(adapted.root);
            register(adapted);
        }
        // 无感发现：市场下载目录（$DSH_HOME/skins/<id>/）+ node_modules 皮肤包，零配置收录。
        const runDiscover = () => {
            if (!config.externalAutoDiscover)
                return;
            const roots = new Set();
            for (const dir of config.externalScanDirs)
                for (const root of scanSkinUnits(dir))
                    roots.add(root);
            for (const base of baseDirs) {
                const nm = findNodeModules(base);
                if (nm)
                    for (const root of scanNodeModulesSkins(nm))
                        roots.add(root);
            }
            for (const root of roots) {
                if (seenRoots.has(root))
                    continue;
                seenRoots.add(root);
                register({ ...adaptExternalPack(root, { source: root }), ok: true });
            }
        };
        runDiscover();
        if (config.externalRescanMs > 0) {
            const timer = setInterval(runDiscover, config.externalRescanMs);
            ctx.effect(() => () => clearInterval(timer), 'ui-skins: external rescan');
        }
    })();
    installHttpRoutes(ctx, service, external, units); // /ui-skins/* 路由 + SSE + 外部单元 + 引擎 v2 面
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
