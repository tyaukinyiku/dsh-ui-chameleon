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
            const component = this.registry.resolve(ref);
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
    if (ref.key !== undefined)
        registration.key = ref.key;
    if (ref.id !== undefined)
        registration.id = ref.id;
    else
        registration.id = `${OVERRIDE_ID_PREFIX}${ref.pack}:${ref.name}`; // list 型必填 id；single/keyed 忽略
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
    /** 按引用解析组件；未注册时返回 undefined 并去重告警一次。 */
    resolve(ref) {
        const component = this.packs.get(ref.pack)?.get(ref.name);
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
