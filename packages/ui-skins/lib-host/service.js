import { normalizeLayerConfig, resolveUi } from './resolve.js';
import { BindingStore } from './store.js';
import { configToLayer, observerOf } from './config.js';
export class UiSkins {
    ctx;
    config;
    store;
    packs = new Map();
    listeners = new Set();
    workspaceRegistry;
    revision = 0;
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.store = new BindingStore(ctx, config);
    }
    /** 可选能力挂载：会话→工作区推导。需子插件显式 inject 后调用。 */
    attachWorkspaceLocator(registry) {
        this.workspaceRegistry = registry;
        this.bump();
    }
    // ---------- UI pack 注册表（UI 的唯一来源：普通 dsh 插件） ----------
    /**
     * 注册一个 UI pack（数据面：主题/布局/默认组件声明）。
     * 组件工厂由同一个包的浏览器半注册到 ctx.uiSkinsClient。
     * 调用方用 ctx.effect(() => ctx.uiSkins.registerPack(...)) 包裹以绑定插件生命周期。
     */
    registerPack(pack) {
        if (!pack?.id)
            throw new Error('registerPack: 缺少 pack.id');
        if (this.packs.has(pack.id))
            throw new Error(`registerPack: pack id 重复: ${pack.id}`);
        this.packs.set(pack.id, pack);
        this.bump();
        return () => {
            if (this.packs.get(pack.id) === pack) {
                this.packs.delete(pack.id);
                this.bump();
            }
        };
    }
    listPacks() {
        return [...this.packs.values()];
    }
    // ---------- 三级解析 ----------
    /** 解析目标的最终 UI 规格：会话层 > 工作区层 > dsh 层。 */
    async resolve(target) {
        await this.store.ready();
        const located = this.locate(target);
        const warnings = [...this.store.warnings];
        const workspace = this.store.workspaceLayer(located.workspaceId, located.workspacePath, warnings);
        const session = located.sessionId
            ? this.store.sessionLayer(located.sessionId, warnings)
            : undefined;
        const layers = {
            dsh: this.baseLayer(),
        };
        if (workspace)
            layers.workspace = workspace;
        if (session)
            layers.session = session;
        const spec = resolveUi({ layers, packs: this.packs.values() });
        spec.warnings.unshift(...warnings);
        return { spec, target: located, revision: this.revision };
    }
    /** 仅解析（同步、不读存储）——测试与派生场景用。 */
    resolveLayers(layers) {
        return resolveUi({ layers, packs: this.packs.values() });
    }
    // ---------- 绑定读写（写路径响亮失败） ----------
    async getLayer(level, id) {
        await this.store.ready();
        return this.store.getBinding(level, id);
    }
    async setLayer(level, id, config) {
        await this.store.ready();
        if (config !== null)
            this.assertUsable(config, `${level}:${id}`);
        await this.store.setBinding(level, id, config);
        this.bump();
    }
    describe() {
        return {
            revision: this.revision,
            packs: this.listPacks(),
            defaults: this.baseLayer(),
            observer: observerOf(this.config),
        };
    }
    /** 变更通知（pack 增删、绑定写入、global 层变化）；拉取模型，监听方自行重新 resolve。 */
    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    // ---------- 内部 ----------
    /** dsh 层 = 插件配置（同一份配置由设置页的 Config 表单编辑，无需自建命名空间）。 */
    baseLayer() {
        return configToLayer(this.config);
    }
    /** 写路径校验：结构 + 引用（pack/theme/layout 必须已注册）。 */
    assertUsable(config, where) {
        const { errors } = normalizeLayerConfig(config, where);
        const problems = [...errors];
        if (typeof config.pack === 'string') {
            const pack = this.packs.get(config.pack);
            if (!pack)
                problems.push(`${where}.pack: 未注册的 UI pack: ${config.pack}`);
            else {
                if (typeof config.theme === 'string' && !pack.themes?.[config.theme]) {
                    problems.push(`${where}.theme: pack ${pack.id} 未提供主题: ${config.theme}`);
                }
                if (typeof config.layout === 'string' && !pack.layouts?.[config.layout]) {
                    problems.push(`${where}.layout: pack ${pack.id} 未提供布局: ${config.layout}`);
                }
            }
        }
        else if (typeof config.theme === 'string' || typeof config.layout === 'string') {
            problems.push(`${where}: 设置 theme/layout 需要同时指定 pack`);
        }
        for (const [key, ref] of Object.entries(config.components ?? {})) {
            if (ref && !this.packs.has(ref.pack)) {
                problems.push(`${where}.components.${key}: 未注册的 UI pack: ${ref.pack}`);
            }
        }
        if (problems.length > 0)
            throw new Error(`UI 配置无效:\n- ${problems.join('\n- ')}`);
    }
    /** 目标推导：补全 workspaceId / workspacePath（经 workspaceRegistry，未挂载则保持原样）。 */
    locate(target) {
        const registry = this.workspaceRegistry;
        let workspaceId = target.workspaceId;
        let workspacePath = target.workspacePath;
        if (!workspaceId && target.sessionId && registry?.list) {
            for (const workspace of registry.list()) {
                if (workspace.sessionIds?.includes(target.sessionId)) {
                    workspaceId = workspace.id;
                    break;
                }
            }
        }
        if (!workspacePath && workspaceId && registry?.get) {
            workspacePath = registry.get(workspaceId)?.path;
        }
        return {
            sessionId: target.sessionId,
            workspaceId,
            workspacePath,
        };
    }
    bump() {
        this.revision += 1;
        for (const listener of this.listeners) {
            try {
                listener();
            }
            catch (error) {
                this.store.warnings.push(`uiSkins 变更监听器异常: ${String(error)}`);
            }
        }
    }
}
