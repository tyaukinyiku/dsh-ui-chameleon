window.__ModuleLoader__.load({ id: "dsh-ui-skins", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var __modules = {
  "src/client/index.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = exports.name = exports.UiSkinsHttpApi = exports.SkinRuntime = exports.UiSkinsClient = void 0;
exports.apply = apply;
const registry_ts_1 = require("./registry.ts");
const runtime_ts_1 = require("./runtime.ts");
const api_ts_1 = require("./api.ts");
const observer_ts_1 = require("./observer.ts");
const picker_ts_1 = require("./picker.ts");
var registry_ts_2 = require("./registry.ts");
Object.defineProperty(exports, "UiSkinsClient", { enumerable: true, get: function () { return registry_ts_2.UiSkinsClient; } });
var runtime_ts_2 = require("./runtime.ts");
Object.defineProperty(exports, "SkinRuntime", { enumerable: true, get: function () { return runtime_ts_2.SkinRuntime; } });
var api_ts_2 = require("./api.ts");
Object.defineProperty(exports, "UiSkinsHttpApi", { enumerable: true, get: function () { return api_ts_2.UiSkinsHttpApi; } });
exports.name = 'ui-skins/client';
/** slots: 组件布置与观察器/徽标注册。传输面走 /ui-skins/*（无需 remote）。 */
exports.inject = ['slots'];
const DEFAULTS = {
    observerSlot: 'conversation.session.header.utilities',
    observerId: 'ui-skins-observer',
    observerOrder: 0,
};
function apply(ctx, config) {
    const options = { ...DEFAULTS, ...config };
    // 服务实例化即注册；直接持有实例，避免未声明的 ctx 属性访问（cordis 严格依赖声明）。
    const registry = new registry_ts_1.UiSkinsClient(ctx); // 提供 ctx.uiSkinsClient
    const api = new api_ts_1.UiSkinsHttpApi();
    const runtime = new runtime_ts_1.SkinRuntime(document, ctx, api, registry);
    const slots = ctx.slots;
    // 观察器（list 型 cell）：session 作用域 slot → sessionId 上报。
    const observer = (0, observer_ts_1.makeObserver)(runtime);
    ctx.effect(() => slots.inject(options.observerSlot, () => slots.register({ name: options.observerSlot, id: options.observerId, order: options.observerOrder }, observer)), 'ui-skins: target observer');
    // 徽标（list 型 cell）：让当前皮肤可见（也是组件通路的自检）。
    const badge = (0, observer_ts_1.makeBadge)(() => {
        const applied = runtime.current();
        return applied ? `${applied.spec.packId ?? 'stock'}/${applied.spec.themeId ?? '-'}` : 'ui-skins';
    });
    ctx.effect(() => slots.inject('conversation.session.header.actions', () => slots.register({ name: 'conversation.session.header.actions', id: 'ui-skins-badge', order: 0 }, badge)), 'ui-skins: skin badge');
    // 🎨 皮肤按钮（会话头部）：点击 → 皮肤选择器（可配到当前会话/工作区）。
    const pickerBtn = (0, picker_ts_1.makePickerButton)((props) => ({ api, sessionId: props.sessionId }));
    ctx.effect(() => slots.inject('conversation.session.header.actions', () => slots.register({ name: 'conversation.session.header.actions', id: 'ui-skins-picker', order: 1 }, pickerBtn)), 'ui-skins: picker button');
    // 🎨 侧栏脚部调色板按钮（root 级）：无会话时也能配置工作区皮肤。
    const pickerBtnGlobal = (0, picker_ts_1.makePickerButton)({ api }, '🎨', '配置 UI/UX（工作区）');
    ctx.effect(() => slots.inject('sidebar.footer.action', () => slots.register({ name: 'sidebar.footer.action', id: 'ui-skins-picker-global', order: 0 }, pickerBtnGlobal)), 'ui-skins: picker button (global)');
    ctx.effect(() => {
        runtime.start();
        return () => runtime.dispose();
    }, 'ui-skins: runtime');
}

  },
  "src/client/api.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiSkinsHttpApi = void 0;
const BASE = '/ui-skins';
class UiSkinsHttpApi {
    async resolve(request) {
        const query = new URLSearchParams();
        if (request.sessionId)
            query.set('sessionId', request.sessionId);
        if (request.workspaceId)
            query.set('workspaceId', request.workspaceId);
        if (request.workspacePath)
            query.set('workspacePath', request.workspacePath);
        return this.json('GET', `/resolve?${query.toString()}`);
    }
    async describe() {
        return this.json('GET', '/state');
    }
    async listWorkspaces() {
        return this.json('GET', '/workspaces');
    }
    async getLayer(level, id) {
        const query = new URLSearchParams({ level, id });
        return this.json('GET', `/binding?${query.toString()}`);
    }
    async setLayer(level, id, config) {
        const response = await fetch(`${BASE}/binding`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ level, id, config }),
        });
        if (!response.ok) {
            const body = (await response.json().catch(() => ({})));
            throw new Error(`ui-skins.setLayer 失败(${response.status}): ${body.error ?? response.statusText}`);
        }
    }
    changes(onChange) {
        const source = new EventSource(`${BASE}/events`);
        source.onmessage = (event) => {
            try {
                const frame = JSON.parse(event.data);
                if (typeof frame.revision === 'number')
                    onChange(frame.revision);
            }
            catch {
                // 忽略畸形帧
            }
        };
        return () => source.close();
    }
    async json(method, path) {
        const response = await fetch(`${BASE}${path}`, { method });
        if (!response.ok) {
            const body = (await response.json().catch(() => ({})));
            throw new Error(`ui-skins${path} 失败(${response.status}): ${body.error ?? response.statusText}`);
        }
        return (await response.json());
    }
}
exports.UiSkinsHttpApi = UiSkinsHttpApi;

  },
  "src/client/runtime.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkinRuntime = void 0;
const theme_ts_1 = require("./theme.ts");
const dispatcher_ts_1 = require("./dispatcher.ts");
class SkinRuntime {
    doc;
    ctx;
    remote;
    target = {};
    applied;
    seq = 0;
    overrides;
    listeners = new Set();
    stopChanges;
    constructor(doc, ctx, remote, registry) {
        this.doc = doc;
        this.ctx = ctx;
        this.remote = remote;
        this.overrides = new dispatcher_ts_1.SlotOverrideManager(ctx, registry);
    }
    /** 喂入目标（浅合并）；变化时重新解析并应用。 */
    setTarget(patch) {
        let changed = false;
        for (const key of ['sessionId', 'workspaceId', 'workspacePath']) {
            if (patch[key] !== undefined && patch[key] !== this.target[key]) {
                this.target[key] = patch[key];
                changed = true;
            }
            else if (patch[key] === undefined && key in patch && this.target[key] !== undefined) {
                delete this.target[key];
                changed = true;
            }
        }
        if (changed)
            void this.refresh();
    }
    current() {
        return this.applied;
    }
    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    /** 重新解析并应用（后到者胜：seq 防乱序）。 */
    async refresh() {
        const seq = ++this.seq;
        try {
            const envelope = await this.remote.resolve({ ...this.target });
            if (seq !== this.seq)
                return;
            if (!envelope?.spec) {
                console.warn('[ui-skins] 解析结果缺 spec：', envelope);
                return;
            }
            this.applied = envelope;
            (0, theme_ts_1.applySpecToDom)(this.doc, envelope.spec);
            this.overrides.apply(envelope.spec);
            for (const warning of envelope.spec.warnings)
                console.warn(`[ui-skins] ${warning}`);
            for (const listener of this.listeners)
                listener(envelope);
        }
        catch (error) {
            console.warn('[ui-skins] 解析失败:', error);
        }
    }
    /** 跟随 host 变更流（SSE）：pack 增删 / 绑定写入 / global 层变化 → 重新解析。 */
    start() {
        this.stopChanges?.();
        this.stopChanges = this.remote.changes(() => {
            void this.refresh();
        });
        void this.refresh();
    }
    dispose() {
        this.stopChanges?.();
        this.stopChanges = undefined;
        this.overrides.clear();
    }
}
exports.SkinRuntime = SkinRuntime;

  },
  "src/client/dispatcher.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotOverrideManager = void 0;
const OVERRIDE_ID_PREFIX = 'ui-skins:';
const DEFAULT_PRIORITY = -1;
class SlotOverrideManager {
    ctx;
    registry;
    disposers = [];
    constructor(ctx, registry) {
        this.ctx = ctx;
        this.registry = registry;
    }
    /** 按解析结果布置组件覆盖（先清空旧布置）。 */
    apply(spec) {
        this.clear();
        const slots = this.ctx.slots;
        for (const [slotKey, ref] of Object.entries(spec.components)) {
            const component = this.registry.resolve(ref, slotKey);
            if (!component)
                continue;
            const dispose = slots.inject(slotKey, () => slots.register(makeRegistration(slotKey, ref), makeDispatcher(component)));
            this.disposers.push(dispose);
        }
    }
    clear() {
        for (const dispose of this.disposers.splice(0)) {
            try {
                dispose();
            }
            catch {
                // 释放失败不阻塞重新布置
            }
        }
    }
}
exports.SlotOverrideManager = SlotOverrideManager;
function makeRegistration(slotKey, ref) {
    const registration = {
        name: slotKey,
        priority: ref.priority ?? DEFAULT_PRIORITY,
    };
    // kind 形状字段只按需携带：keyed 用 key，list 用 id/order；
    // single 是 cell=slot 本身，多带 id 会被当成 list 形状导致不渲染。
    if (ref.key !== undefined)
        registration.key = ref.key;
    if (ref.id !== undefined)
        registration.id = ref.id;
    if (ref.order !== undefined)
        registration.order = ref.order;
    return registration;
}
/** 分发器：把 slot 组装后的 props 原样转发给皮肤组件（皮肤组件可读到该 slot 的标准 hooks）。 */
function makeDispatcher(component) {
    return function UiSkinSlot(props) {
        return component(props);
    };
}

  },
  "src/client/theme.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySpecToDom = applySpecToDom;
const STYLE_ID = 'dsh-ui-skins-style';
let appliedKeys = [];
function applySpecToDom(doc, spec) {
    const root = doc.documentElement;
    for (const key of appliedKeys)
        root.style.removeProperty(key);
    appliedKeys = [];
    for (const [key, value] of Object.entries(spec.tokens)) {
        root.style.setProperty(key, value);
        appliedKeys.push(key);
    }
    setAttr(doc, 'data-ui-pack', spec.packId);
    // 外部皮肤：body 属性激活开关（body + html 双挂，兼容 body[data-*] 作用域）。
    const g = doc;
    const prevAttr = g.__uiSkinsBodyAttr ?? null;
    const nextAttr = spec.bodyAttr ?? null;
    if (prevAttr !== nextAttr) {
        // bodyAttr 形如 `attr` 或 `attr=value`（市场皮肤 html[data-dsh-skin="<id>"]）。
        const parseAttr = (raw) => {
            const eq = raw.indexOf('=');
            return eq >= 0 ? [raw.slice(0, eq), raw.slice(eq + 1)] : [raw, ''];
        };
        if (prevAttr) {
            const [name] = parseAttr(prevAttr);
            doc.documentElement.removeAttribute(name);
            doc.body?.removeAttribute(name);
        }
        if (nextAttr) {
            const [name, value] = parseAttr(nextAttr);
            doc.documentElement.setAttribute(name, value);
            doc.body?.setAttribute(name, value);
        }
        g.__uiSkinsBodyAttr = nextAttr;
    }
    setAttr(doc, 'data-ui-theme', spec.themeId);
    setAttr(doc, 'data-ui-layout', spec.layoutId);
    let style = doc.getElementById(STYLE_ID);
    if (!style) {
        style = doc.createElement('style');
        style.id = STYLE_ID;
        doc.head.appendChild(style);
    }
    style.textContent = spec.css;
}
function setAttr(doc, name, value) {
    if (value)
        doc.documentElement.setAttribute(name, value);
    else
        doc.documentElement.removeAttribute(name);
}

  },
  "src/client/registry.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiSkinsClient = void 0;
/**
 * ctx.uiSkinsClient —— 浏览器半的组件注册表。
 * UI pack 的 ./client 入口在这里按 (packId, name) 注册渲染组件；
 * 三级解析产出的 UiComponentRef 在运行时解析到具体组件。
 *
 * 注意：slot 注册表本身不依赖 React（dsh-client-ui-slots 是类型代数 + 注册表），
 * 因此这里用中性的 UiComponent 形态；真实 Web Client 中组件即 React 组件。
 */
const cordis_1 = require("@deepseek-ai/cordis");
class UiSkinsClient extends cordis_1.Service {
    static inject = [];
    packs = new Map();
    missing = new Set();
    constructor(ctx) {
        super(ctx, 'uiSkinsClient');
    }
    /**
     * 注册一个 UI pack 的组件面。
     * 调用方用 ctx.effect(() => ctx.uiSkinsClient.register(...)) 包裹以绑定插件生命周期。
     */
    register(pack) {
        if (!pack?.id)
            throw new Error('uiSkinsClient.register: 缺少 pack.id');
        const table = new Map(Object.entries(pack.components));
        this.packs.set(pack.id, table);
        this.missing.clear();
        return () => {
            if (this.packs.get(pack.id) === table)
                this.packs.delete(pack.id);
        };
    }
    /**
     * 按引用解析组件；未注册时返回 undefined 并去重告警一次。
     * 兼容两种注册键：组件名（契约）与 slot key（作者习惯），后者经 slotKey 兜底。
     */
    resolve(ref, slotKey) {
        const table = this.packs.get(ref.pack);
        const component = table?.get(ref.name) ?? (slotKey ? table?.get(slotKey) : undefined);
        if (!component) {
            const key = `${ref.pack}/${ref.name}`;
            if (!this.missing.has(key)) {
                this.missing.add(key);
                console.warn(`[ui-skins] 组件未注册: ${key}（对应 pack 的 ./client 入口是否加载？）`);
            }
        }
        return component;
    }
}
exports.UiSkinsClient = UiSkinsClient;

  },
  "src/client/picker.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePickerButton = makePickerButton;
exports.openPicker = openPicker;
const react_1 = require("react");
const STYLE_ID = 'dsh-ui-skins-picker-style';
const STYLE = `
.ui-skins-overlay { position: fixed; inset: 0; z-index: 2147483000; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif; }
.ui-skins-panel { width: min(680px, 92vw); max-height: 86vh; overflow: auto; border-radius: 12px;
  background: #14161c; color: #e8eaf0; padding: 20px 22px; box-shadow: 0 18px 60px rgba(0,0,0,.55);
  border: 1px solid #2a2e38; }
.ui-skins-panel h3 { margin: 0 0 4px; font-size: 16px; }
.ui-skins-panel .sub { color: #98a0b0; font-size: 12px; margin-bottom: 14px; }
.ui-skins-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 10px 0; }
.ui-skins-row .lbl { font-size: 12px; color: #98a0b0; min-width: 56px; }
.ui-skins-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; margin: 8px 0 4px; }
.ui-skins-card { border: 1px solid #2a2e38; border-radius: 10px; padding: 10px; cursor: pointer; background: #1a1d25; }
.ui-skins-card:hover { border-color: #4a5060; }
.ui-skins-card.sel { border-color: #7c9cff; box-shadow: 0 0 0 1px #7c9cff inset; }
.ui-skins-card .ttl { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.ui-skins-card .desc { font-size: 11px; color: #98a0b0; margin-top: 4px; min-height: 26px; }
.ui-skins-swatch { display: inline-flex; border-radius: 4px; overflow: hidden; border: 1px solid #2a2e38; }
.ui-skins-swatch i { width: 12px; height: 12px; display: inline-block; }
.ui-skins-badge { font-size: 9px; padding: 1px 5px; border-radius: 4px; background: #2b3350; color: #9db4ff; border: 1px solid #3a4468; }
.ui-skins-preview { width: 100%; height: 72px; object-fit: cover; border-radius: 6px; margin: 6px 0; border: 1px solid #2a2e38; }
.ui-skins-chip { border: 1px solid #2a2e38; background: #1a1d25; color: #e8eaf0; border-radius: 999px;
  padding: 4px 12px; font-size: 12px; cursor: pointer; }
.ui-skins-chip:hover { border-color: #4a5060; }
.ui-skins-chip.sel { border-color: #7c9cff; background: #232a3d; }
.ui-skins-radio { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; }
.ui-skins-select { background: #1a1d25; color: #e8eaf0; border: 1px solid #2a2e38; border-radius: 6px;
  padding: 4px 8px; font-size: 12px; max-width: 320px; }
.ui-skins-foot { display: flex; gap: 10px; align-items: center; margin-top: 16px; }
.ui-skins-btn { border: 1px solid #2a2e38; background: #1a1d25; color: #e8eaf0; border-radius: 8px;
  padding: 7px 16px; font-size: 13px; cursor: pointer; }
.ui-skins-btn.primary { background: #3355dd; border-color: #3355dd; color: #fff; }
.ui-skins-btn.danger { color: #ff8f8f; }
.ui-skins-btn:hover { filter: brightness(1.15); }
.ui-skins-status { font-size: 12px; color: #8fd48f; margin-left: auto; }
@media (prefers-color-scheme: light) {
  .ui-skins-panel { background: #f7f8fa; color: #1c1f26; border-color: #d8dce4; }
  .ui-skins-card, .ui-skins-chip, .ui-skins-btn, .ui-skins-select { background: #fff; color: #1c1f26; border-color: #d8dce4; }
  .ui-skins-card.sel, .ui-skins-chip.sel { border-color: #3355dd; box-shadow: 0 0 0 1px #3355dd inset; }
  .ui-skins-btn.primary { background: #3355dd; color: #fff; }
}
`;
function ensureStyle(doc) {
    if (doc.getElementById(STYLE_ID))
        return;
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLE;
    doc.head.appendChild(style);
}
function el(doc, tag, attrs = {}, children = []) {
    const node = doc.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'class')
            node.className = value;
        else
            node.setAttribute(key, value);
    }
    for (const child of children)
        node.append(child);
    return node;
}
function swatchOf(pack) {
    const tokens = pack.baseTokens ?? {};
    const wrap = el(document, 'span', { class: 'ui-skins-swatch' });
    wrap.append(el(document, 'i', { style: `background:${tokens['--ui-bg'] ?? '#000'}` }));
    wrap.append(el(document, 'i', { style: `background:${tokens['--ui-accent'] ?? '#888'}` }));
    return wrap;
}
/** 皮肤按钮（list 型 cell）：点击打开选择器；label 可自定义。 */
function makePickerButton(options, label = '🎨 皮肤', title = '配置 UI/UX（工作区 / 会话）') {
    return function UiSkinsPickerButton(props) {
        const resolved = typeof options === 'function' ? options(props ?? {}) : options;
        return (0, react_1.createElement)('button', {
            type: 'button',
            'data-ui-skins-picker': '',
            title,
            onClick: () => {
                void openPicker(resolved).catch((error) => console.warn('[ui-skins] 皮肤选择器打开失败:', error));
            },
        }, label);
    };
}
/** 打开皮肤选择器（幂等：同一时刻仅一个实例）。 */
async function openPicker(options) {
    const doc = document;
    if (doc.querySelector('.ui-skins-overlay'))
        return;
    ensureStyle(doc);
    const { api } = options;
    const [state, workspaces, current] = await Promise.all([
        api.describe(),
        api.listWorkspaces().catch(() => []),
        api.resolve({ sessionId: options.sessionId, workspaceId: options.workspaceId }),
    ]);
    const spec = current.spec;
    // ---- 目标：会话 / 工作区 ----
    let target = options.sessionId
        ? { kind: 'session', id: options.sessionId }
        : { kind: 'workspace', id: options.workspaceId ?? workspaces[0]?.id ?? '' };
    // ---- 选择状态（默认 = 当前生效值回落 pack 默认） ----
    let packId = spec.packId ?? state.packs[0]?.id ?? '';
    const pickPack = () => state.packs.find((p) => p.id === packId);
    let themeSel = spec.themeId ?? null; // null = pack 默认
    let layoutSel = spec.layoutId ?? null;
    const overlay = el(doc, 'div', { class: 'ui-skins-overlay' });
    const panel = el(doc, 'div', { class: 'ui-skins-panel', role: 'dialog', 'aria-label': 'UI/UX 皮肤选择器' });
    overlay.append(panel);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay)
            close();
    });
    const status = el(doc, 'span', { class: 'ui-skins-status' });
    const setStatus = (text) => {
        status.textContent = text;
    };
    // 目标区
    const targetRow = el(doc, 'div', { class: 'ui-skins-row' });
    const wsSelect = el(doc, 'select', { class: 'ui-skins-select' });
    for (const ws of workspaces) {
        wsSelect.append(el(doc, 'option', { value: ws.id }, [ws.path.split('/').pop() ?? ws.id, ` — ${ws.path}`]));
    }
    if (options.workspaceId)
        wsSelect.value = options.workspaceId;
    const sessionRadio = el(doc, 'label', { class: 'ui-skins-radio' }, [
        el(doc, 'input', { type: 'radio', name: 'ui-skins-target', value: 'session' }),
        options.sessionId ? `当前会话` : '当前会话（不可用）',
    ]);
    const wsRadio = el(doc, 'label', { class: 'ui-skins-radio' }, [
        el(doc, 'input', { type: 'radio', name: 'ui-skins-target', value: 'workspace' }),
        '工作区',
    ]);
    const sessionInput = sessionRadio.querySelector('input');
    const wsInput = wsRadio.querySelector('input');
    sessionInput.disabled = !options.sessionId;
    sessionInput.checked = target.kind === 'session';
    wsInput.checked = target.kind === 'workspace';
    sessionInput.addEventListener('change', () => {
        if (sessionInput.checked && options.sessionId)
            target = { kind: 'session', id: options.sessionId };
    });
    wsInput.addEventListener('change', () => {
        if (wsInput.checked)
            target = { kind: 'workspace', id: wsSelect.value };
    });
    wsSelect.addEventListener('change', () => {
        target = { kind: 'workspace', id: wsSelect.value };
        wsInput.checked = true;
        sessionInput.checked = false;
    });
    targetRow.append(el(doc, 'span', { class: 'lbl' }, ['应用到']), sessionRadio, wsRadio, wsSelect);
    // pack 网格
    const grid = el(doc, 'div', { class: 'ui-skins-grid' });
    // 主题/布局 chips
    const themeRow = el(doc, 'div', { class: 'ui-skins-row' });
    const layoutRow = el(doc, 'div', { class: 'ui-skins-row' });
    const rerenderChips = () => {
        const pack = pickPack();
        themeRow.replaceChildren(el(doc, 'span', { class: 'lbl' }, ['主题']));
        layoutRow.replaceChildren(el(doc, 'span', { class: 'lbl' }, ['布局']));
        const themeDefault = el(doc, 'button', { class: `ui-skins-chip${themeSel === null ? ' sel' : ''}` }, ['(pack 默认)']);
        themeDefault.addEventListener('click', () => {
            themeSel = null;
            rerenderChips();
        });
        themeRow.append(themeDefault);
        for (const theme of Object.values(pack?.themes ?? {})) {
            const chip = el(doc, 'button', { class: `ui-skins-chip${themeSel === theme.id ? ' sel' : ''}` }, [theme.title ?? theme.id]);
            chip.addEventListener('click', () => {
                themeSel = theme.id;
                rerenderChips();
            });
            themeRow.append(chip);
        }
        const layoutDefault = el(doc, 'button', { class: `ui-skins-chip${layoutSel === null ? ' sel' : ''}` }, ['(pack 默认)']);
        layoutDefault.addEventListener('click', () => {
            layoutSel = null;
            rerenderChips();
        });
        layoutRow.append(layoutDefault);
        for (const layout of Object.values(pack?.layouts ?? {})) {
            const chip = el(doc, 'button', { class: `ui-skins-chip${layoutSel === layout.id ? ' sel' : ''}` }, [layout.title ?? layout.id]);
            chip.addEventListener('click', () => {
                layoutSel = layout.id;
                rerenderChips();
            });
            layoutRow.append(chip);
        }
    };
    const rerenderGrid = () => {
        grid.replaceChildren();
        for (const pack of state.packs) {
            const card = el(doc, 'div', { class: `ui-skins-card${pack.id === packId ? ' sel' : ''}`, 'data-pack': pack.id });
            const ttl = el(doc, 'div', { class: 'ttl' }, [swatchOf(pack), pack.title ?? pack.id]);
            if (pack.external) {
                ttl.append(el(doc, 'span', {
                    class: 'ui-skins-badge',
                    title: `外部：${pack.external.source} · CSS: ${pack.external.cssOrigin ?? 'none'}`,
                }, ['外部']));
            }
            const desc = el(doc, 'div', { class: 'desc' }, [pack.description ?? '']);
            card.append(ttl, desc);
            const imgSrc = pack.preview?.light ?? pack.preview?.dark;
            if (imgSrc)
                card.append(el(doc, 'img', { class: 'ui-skins-preview', src: imgSrc, alt: '' }));
            card.addEventListener('click', () => {
                packId = pack.id;
                themeSel = null;
                layoutSel = null;
                rerenderGrid();
                rerenderChips();
            });
            grid.append(card);
        }
    };
    // 底部操作
    const applyBtn = el(doc, 'button', { class: 'ui-skins-btn primary' }, ['应用']);
    const clearBtn = el(doc, 'button', { class: 'ui-skins-btn danger' }, ['清除本层覆盖']);
    const closeBtn = el(doc, 'button', { class: 'ui-skins-btn' }, ['关闭']);
    applyBtn.addEventListener('click', async () => {
        const level = target.kind === 'session' ? 'session' : 'workspace';
        try {
            await api.setLayer(level, target.id, {
                pack: packId,
                theme: themeSel,
                layout: layoutSel,
            });
            setStatus(`已应用到${level === 'session' ? '会话' : '工作区'} ✓ 皮肤即时生效`);
        }
        catch (error) {
            setStatus(`应用失败：${String(error).slice(0, 120)}`);
        }
    });
    clearBtn.addEventListener('click', async () => {
        const level = target.kind === 'session' ? 'session' : 'workspace';
        try {
            await api.setLayer(level, target.id, null);
            setStatus('已清除本层覆盖 ✓ 回落下层继承');
        }
        catch (error) {
            setStatus(`清除失败：${String(error).slice(0, 120)}`);
        }
    });
    closeBtn.addEventListener('click', close);
    panel.append(el(doc, 'h3', {}, ['🎨 UI/UX 皮肤选择器']), el(doc, 'div', { class: 'sub' }, [
        `当前生效：${spec.packId ?? 'dsh 原生'} / ${spec.themeId ?? '-'} / ${spec.layoutId ?? '-'}　·　UI 来自已安装的 ${state.packs.length} 个皮肤包`,
    ]), targetRow, grid, themeRow, layoutRow, el(doc, 'div', { class: 'ui-skins-foot' }, [applyBtn, clearBtn, closeBtn, status]));
    rerenderGrid();
    rerenderChips();
    doc.body.append(overlay);
}

  },
  "src/client/observer.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeObserver = makeObserver;
exports.makeBadge = makeBadge;
/**
 * 目标观察器：注册进 session 作用域 list slot（conversation.session.header.utilities）的小组件。
 * session 作用域的 slot 会把 sessionId 放进组件 props（Slots 文档“组件输入”表），
 * 观察器把它上报给 SkinRuntime；工作区 id 由 host 侧经 workspaceRegistry 推导。
 *
 * slot 注册参数（slotKey/id/order）可配置——不同 dsh 版本的 slot 树可能演进，
 * 届时改配置即可，无需改代码（无硬编码可调参数）。
 */
const react_1 = require("react");
function makeObserver(runtime) {
    return function UiSkinsObserver(props) {
        const { sessionId } = (props ?? {});
        (0, react_1.useEffect)(() => {
            runtime.setTarget({ sessionId });
            return () => {
                runtime.setTarget({ sessionId: undefined });
            };
        }, [sessionId]);
        return null;
    };
}
/** 皮肤徽标：顺带演示组件级注册的最小形态。 */
function makeBadge(getLabel) {
    return function UiSkinsBadge() {
        return (0, react_1.createElement)('span', { 'data-ui-skins-badge': '' }, getLabel());
    };
}

  }
};
var __cache = {};
function __key(from, spec) {
  var parts = from.split('/');
  parts.pop();
  for (var seg of spec.split('/')) {
    if (seg === '.' || seg === '') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/');
}
function __require(from, spec) {
  if (spec.charAt(0) === '.') {
    var key = __key(from, spec);
    var factory = __modules[key];
    if (factory === undefined) throw new Error('client bundle: missing module ' + key);
    var cached = __cache[key];
    if (cached !== undefined) return cached.exports;
    var mod = __cache[key] = { exports: {} };
    factory(mod, mod.exports, function (sub) { return __require(key, sub); });
    return mod.exports;
  }
  return require(spec);
}
var __entry = __modules["src/client/index.ts"];
if (__entry === undefined) throw new Error('client bundle: missing entry');
__entry(module, exports, function (sub) { return __require("src/client/index.ts", sub); });
return module.exports; } });
