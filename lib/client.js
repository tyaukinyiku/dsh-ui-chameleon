window.__ModuleLoader__.load({ id: "dsh-ui-chameleon", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var __modules = {
  "src/client-combined.ts": function (module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = void 0;
exports.apply = apply;
const uiSkinsClient = __importStar(require("../packages/ui-skins/src/client/index.ts"));
const packDefault = __importStar(require("../packages/ui-pack-default/src/client.ts"));
const packExample = __importStar(require("../packages/ui-pack-example/src/client.ts"));
const packAurora = __importStar(require("../packages/ui-pack-aurora/src/client.ts"));
const packManuscript = __importStar(require("../packages/ui-pack-manuscript/src/client.ts"));
const packTerminal = __importStar(require("../packages/ui-pack-terminal/src/client.ts"));
exports.name = 'dsh-ui-chameleon/client';
function apply(ctx) {
    ctx.plugin(uiSkinsClient); // 提供 ctx.uiSkinsClient + 皮肤按钮/选择器/观察器
    ctx.plugin(packDefault);
    ctx.plugin(packExample);
    ctx.plugin(packAurora);
    ctx.plugin(packManuscript);
    ctx.plugin(packTerminal);
}

  },
  "packages/ui-pack-terminal/src/client.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = exports.name = void 0;
exports.apply = apply;
/**
 * dsh-ui-pack-terminal —— 浏览器半（组件面）：终端标记与角标。
 */
const react_1 = require("react");
exports.name = 'ui-pack-terminal/client';
exports.inject = ['uiSkinsClient'];
const TermMark = function TermMark() {
    return (0, react_1.createElement)('span', { 'data-ui-term-mark': '' }, '[>_ TERMINAL]');
};
const TermCorner = function TermCorner(props) {
    const { sessionId } = (props ?? {});
    return (0, react_1.createElement)('span', { 'data-ui-term-corner': '', title: sessionId ? `session ${sessionId}` : 'terminal' }, 'tty0');
};
const components = {
    TermMark,
    TermCorner,
    'conversation.hero.brand.mark': TermMark,
    'sidebar.brand.mark': TermMark,
    'conversation.session.header.corner': TermCorner,
};
function apply(ctx) {
    ctx.effect(() => {
        const registry = ctx.uiSkinsClient;
        return registry.register({ id: 'terminal', components });
    }, 'ui-pack-terminal: register components');
}

  },
  "packages/ui-pack-manuscript/src/client.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = exports.name = void 0;
exports.apply = apply;
/**
 * dsh-ui-pack-manuscript —— 浏览器半（组件面）：书刊标记与角标。
 */
const react_1 = require("react");
exports.name = 'ui-pack-manuscript/client';
exports.inject = ['uiSkinsClient'];
const MsMark = function MsMark() {
    return (0, react_1.createElement)('span', { 'data-ui-ms-mark': '' }, 'MANUSCRIPT');
};
const MsCorner = function MsCorner(props) {
    const { sessionId } = (props ?? {});
    return (0, react_1.createElement)('span', { 'data-ui-ms-corner': '', title: sessionId ? `session ${sessionId}` : 'manuscript' }, 'folio · manuscript');
};
const components = {
    MsMark,
    MsCorner,
    'conversation.hero.brand.mark': MsMark,
    'sidebar.brand.mark': MsMark,
    'conversation.session.header.corner': MsCorner,
};
function apply(ctx) {
    ctx.effect(() => {
        const registry = ctx.uiSkinsClient;
        return registry.register({ id: 'manuscript', components });
    }, 'ui-pack-manuscript: register components');
}

  },
  "packages/ui-pack-aurora/src/client.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = exports.name = void 0;
exports.apply = apply;
/**
 * dsh-ui-pack-aurora —— 浏览器半（组件面）：极光标记与角标。
 */
const react_1 = require("react");
exports.name = 'ui-pack-aurora/client';
exports.inject = ['uiSkinsClient'];
const AuroraMark = function AuroraMark() {
    return (0, react_1.createElement)('span', { 'data-ui-aurora-mark': '' }, '✦ AURORA');
};
const AuroraCorner = function AuroraCorner(props) {
    const { sessionId } = (props ?? {});
    return (0, react_1.createElement)('span', { 'data-ui-aurora-corner': '', title: sessionId ? `session ${sessionId}` : 'aurora' }, 'AURORA ✦');
};
const components = {
    AuroraMark,
    AuroraCorner,
    'conversation.hero.brand.mark': AuroraMark,
    'sidebar.brand.mark': AuroraMark,
    'conversation.session.header.corner': AuroraCorner,
};
function apply(ctx) {
    ctx.effect(() => {
        const registry = ctx.uiSkinsClient;
        return registry.register({ id: 'aurora', components });
    }, 'ui-pack-aurora: register components');
}

  },
  "packages/ui-pack-example/src/client.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = exports.name = void 0;
exports.apply = apply;
/**
 * dsh-ui-pack-example —— 浏览器半（组件面）。
 * 演示组件级覆盖：QuartzCorner 替换 conversation.session.header.corner 的展示。
 * 组件照常收到该 slot 的组装 props（owner props + 标准 hooks + inject face），可直接使用。
 */
const react_1 = require("react");
exports.name = 'ui-pack-example/client';
exports.inject = ['uiSkinsClient'];
const QuartzCorner = function QuartzCorner(props) {
    const { sessionId } = (props ?? {});
    return (0, react_1.createElement)('span', { 'data-quartz-corner': '', title: sessionId ? `session ${sessionId}` : 'quartz' }, '◇ quartz');
};
const components = {
    // 契约键 = 组件名（UiComponentRef.name 指向它）；同时保留 slot key 别名。
    QuartzCorner,
    'conversation.session.header.corner': QuartzCorner,
};
function apply(ctx) {
    ctx.effect(() => {
        const registry = ctx.uiSkinsClient;
        return registry.register({ id: 'quartz', components });
    }, 'ui-pack-example: register components');
}

  },
  "packages/ui-pack-default/src/client.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = exports.name = void 0;
exports.apply = apply;
/**
 * dsh-ui-pack-default —— 浏览器半（组件面）：注册 pack 组件。
 * 组件即普通渲染函数（真实 Web Client 中就是 React 组件，可使用全部标准 slot hooks）。
 */
const react_1 = require("react");
exports.name = 'ui-pack-default/client';
exports.inject = ['uiSkinsClient'];
const BrandMark = function BrandMark() {
    return (0, react_1.createElement)('span', { 'data-ui-brand': 'default' }, '◆ dsh');
};
const WorkspaceHint = function WorkspaceHint() {
    return (0, react_1.createElement)('small', { 'data-ui-hint': '' }, 'default skin');
};
const components = {
    // 契约键 = 组件名（UiComponentRef.name 指向它）；同时保留 slot key 别名，两种写法均可解析。
    BrandMark,
    'conversation.hero.brand.mark': BrandMark,
    'sidebar.brand.mark': BrandMark,
    WorkspaceHint,
    'conversation.hero.workspace': WorkspaceHint,
};
function apply(ctx) {
    ctx.effect(() => {
        const registry = ctx.uiSkinsClient;
        return registry.register({ id: 'default', components });
    }, 'ui-pack-default: register components');
}

  },
  "packages/ui-skins/src/client/index.ts": function (module, exports, require) {
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
  "packages/ui-skins/src/client/api.ts": function (module, exports, require) {
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
  "packages/ui-skins/src/client/runtime.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkinRuntime = void 0;
const theme_ts_1 = require("./theme.ts");
const dispatcher_ts_1 = require("./dispatcher.ts");
const index_ts_1 = require("./skin-engine/index.ts");
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
            void syncEngineSkin(this.doc, envelope.spec);
            void syncHooks(this.doc, envelope.spec);
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
// ---------------------------------------------------------------------------
// 引擎渲染同步（A 路线）：externalSkinId 驱动官方 skin-controller 原子切换。
// 引擎自带 latest-request-wins；此处只需把「当前目标用哪款皮肤」喂给它。
// ---------------------------------------------------------------------------
let engineActiveId = null;
let engineSeq = 0;
let engineCatalog = null;
/** 防御性清扫：ledger 漏记的引擎样式表链接（残留会致清除后皮肤态不退出）。 */
function sweepEngineLinks(doc, keepSkinId) {
    for (const link of Array.from(doc.head.querySelectorAll('link[rel="stylesheet"]'))) {
        const href = link.getAttribute('href') ?? '';
        if (!href.includes('/external/v2/skins/'))
            continue;
        if (keepSkinId !== null && href.includes(`/external/v2/skins/${keepSkinId}/`))
            continue;
        link.remove();
    }
}
async function syncEngineSkin(doc, spec) {
    const next = spec.externalSkinId ?? null;
    if (next === engineActiveId)
        return;
    const seq = ++engineSeq;
    const controller = (0, index_ts_1.getSkinEngine)();
    if (next === null) {
        const result = await controller.switchTo(null, null);
        if (seq === engineSeq) {
            engineActiveId = result;
            sweepEngineLinks(doc, result);
        }
        return;
    }
    try {
        if (!engineCatalog)
            engineCatalog = await (0, index_ts_1.fetchEngineCatalog)();
        let entry = engineCatalog.get(next) ?? null;
        if (!entry) {
            // 热收录后的新皮肤：重拉 catalog 一次。
            engineCatalog = await (0, index_ts_1.fetchEngineCatalog)();
            entry = engineCatalog.get(next) ?? null;
        }
        if (!entry) {
            console.warn(`[ui-skins] 引擎 catalog 缺皮肤条目：${next}`);
            return;
        }
        const result = await controller.switchTo(next, entry);
        if (seq === engineSeq) {
            engineActiveId = result;
            sweepEngineLinks(doc, result);
        }
    }
    catch (error) {
        console.warn('[ui-skins] 引擎切换失败:', error);
    }
}
// ---------------------------------------------------------------------------
// 官方 hooks 契约挂载（x-org.linxin666.skin-center/v1alpha1）：
// 模块加载不执行任何东西；apply(ctx) 拥有全部 DOM 写入并通过 ctx.onCleanup 登记回收。
// 激活 pack 时挂载、切走时回收——美术/装饰层与原生渲染一致，且保留会话/工作区分层。
// ---------------------------------------------------------------------------
let hooksCleanups = [];
let hooksPackId = null;
async function syncHooks(doc, spec) {
    const nextId = spec.hooks ? spec.packId : null;
    if (nextId === hooksPackId)
        return;
    for (const fn of hooksCleanups.splice(0)) {
        try {
            fn();
        }
        catch {
            /* 回收容错 */
        }
    }
    doc.documentElement.removeAttribute('data-ui-hooks');
    hooksPackId = nextId;
    if (!spec.hooks)
        return;
    try {
        // 经 <script type="module"> + blob URL 原生执行（TS 会把 import() 转成 require(url) 而失效）
        const res = await fetch(spec.hooks.url);
        if (!res.ok)
            return;
        const text = await res.text();
        const blobUrl = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
        const done = new Promise((resolve) => {
            const timer = setTimeout(resolve, 8000);
            const onDone = () => {
                clearTimeout(timer);
                resolve();
            };
            window.addEventListener('uiskins-hooks-done', onDone, { once: true });
        });
        window.__uiSkinsHooksPending = {
            assetBase: spec.hooks.assetBase,
            cleanups: hooksCleanups,
        };
        const el = doc.createElement('script');
        el.type = 'module';
        el.textContent =
            `import * as m from ${JSON.stringify(blobUrl)};` +
                `const s = window.__uiSkinsHooksPending;` +
                `if (typeof m.apply === 'function') m.apply({ assetBase: s.assetBase, onCleanup: (fn) => s.cleanups.push(fn) });` +
                `window.dispatchEvent(new Event('uiskins-hooks-done'));`;
        doc.head.appendChild(el);
        await done;
        URL.revokeObjectURL(blobUrl);
        doc.documentElement.setAttribute('data-ui-hooks', spec.packId ?? '');
    }
    catch {
        /* hooks 失败不拖垮皮肤基础层 */
    }
}

  },
  "packages/ui-skins/src/client/skin-engine/index.ts": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_API_BASE = void 0;
exports.getSkinEngine = getSkinEngine;
exports.fetchEngineCatalog = fetchEngineCatalog;
/**
 * skin-engine 客户端接线 —— 把 vendored 官方皮肤运行时（skin-controller /
 * semantic-adapter / shell-rendering / decoration-layers / effect-ledger）挂进
 * chameleon 的 SkinRuntime：
 *
 *   - 渲染语义与 dsh-web 皮肤中心一致：原子 activation（样式表 <link> → 背景
 *     美术层 → hooks（完整 SkinHooksContext：六层装饰层 + theme 订阅）→ 翻
 *     html[data-dsh-skin] → 回收上一 activation），外加 L2 语义打标与壳层渲染
 *     适配；
 *   - chameleon 只做编排：三级解析决定「哪个目标用哪款皮肤」，选择持久化由
 *     绑定层（session/workspace/dsh）负责，故 engine 的 persist 槽为空操作；
 *   - hooks 模块导入经 <script type="module"> + blob URL（静态 import 字面量，
 *     永不被转译成 require(url)）。
 */
const effect_ledger_ts_1 = require("./effect-ledger.ts");
const semantic_adapter_ts_1 = require("./semantic-adapter.ts");
const shell_rendering_ts_1 = require("./shell-rendering.ts");
const skin_controller_ts_1 = require("./skin-controller.ts");
/** 引擎 v2 传输面（host：skin-engine/external-v2.ts）。 */
exports.ENGINE_API_BASE = '/ui-skins/external/v2';
let handle = null;
/** hooks.mjs 动态模块导入（blob URL + module script；TS 转译安全）。 */
async function importHooksModule(url) {
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`hooks fetch ${url} -> ${res.status}`);
    const text = await res.text();
    const blobUrl = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
    try {
        const done = new Promise((resolveDone) => {
            const timer = setTimeout(resolveDone, 8000);
            const onDone = () => {
                clearTimeout(timer);
                resolveDone();
            };
            window.addEventListener('uiskins-engine-hooks-ready', onDone, { once: true });
        });
        const holder = window;
        holder.__uiSkinsEngineHooks = undefined;
        const el = doc().createElement('script');
        el.type = 'module';
        // 字符串内静态 import —— 不会被任何转译步骤改写。
        el.textContent =
            `import * as m from ${JSON.stringify(blobUrl)};` +
                `window.__uiSkinsEngineHooks = m;` +
                `window.dispatchEvent(new Event('uiskins-engine-hooks-ready'));`;
        doc().head.appendChild(el);
        await done;
        el.remove();
        return holder.__uiSkinsEngineHooks;
    }
    finally {
        URL.revokeObjectURL(blobUrl);
    }
}
function doc() {
    return document;
}
/** 每文档单例：装饰层/语义打标/壳层适配都是组件级，随文档存活。 */
function getSkinEngine() {
    if (handle)
        return handle.controller;
    const d = doc();
    const deps = {
        doc: d,
        ledger: (0, effect_ledger_ts_1.createEffectLedger)(),
        apiBase: exports.ENGINE_API_BASE,
        importHooks: importHooksModule,
        // 选择持久化归 chameleon 三级绑定层（session/workspace/dsh），引擎只管渲染。
        persist: async () => { },
        onError: (message, error) => {
            console.warn('[skin-engine]', message, error);
        },
    };
    const controller = (0, skin_controller_ts_1.createSkinController)(deps);
    const adapter = (0, semantic_adapter_ts_1.createSemanticAdapter)(d);
    adapter.start();
    const disposeShell = (0, shell_rendering_ts_1.installShellRenderingAdapter)(d);
    handle = { controller, adapter, disposeShell };
    return controller;
}
/** 拉取引擎 catalog（skinId → 控制器条目）；host 在收编时已做安全管线验证。 */
async function fetchEngineCatalog() {
    const res = await fetch(`${exports.ENGINE_API_BASE}/catalog`);
    if (!res.ok)
        throw new Error(`engine catalog -> ${res.status}`);
    const rows = (await res.json());
    const map = new Map();
    for (const row of rows) {
        if (row?.manifest?.id)
            map.set(row.manifest.id, { manifest: row.manifest });
    }
    return map;
}

  },
  "packages/ui-skins/src/client/skin-engine/skin-controller.ts": function (module, exports, require) {
"use strict";
/**
 * Skin runtime controller (issue #506, contract section 8) — the browser
 * switch engine. One switch is one NEW activation identity:
 *
 *   switchTo(id):
 *     1. seq = ++latestRequest          (latest-request-wins)
 *     2. activation = ledger.beginActivation()
 *     3. fetch stylesheet (+ patches)   (already scoped + whitelisted host-side)
 *     4. install <style> tags, background media, hooks (all ledger-recorded)
 *     5. if seq is stale -> dispose this activation and bail
 *     6. flip html[data-dsh-skin]       (the atomic visual cut)
 *     7. dispose the previous activation
 *     8. persist the selection
 *
 * Every step before the flip is discardable; a stale or failed switch leaves
 * the previous skin fully intact. hooks import/apply errors are caught: the
 * static part (stylesheet, media) stays active — the escape hatch can never
 * take the skin down with it.
 *
 * lifecycleScope split: the ledger tracks activation scope; the catalog
 * snapshot, the decoration layer elements and the persisted selection are
 * component scope and survive every switch.
 * @module @linxin666/dsh-client-ui-skin-center/runtime/skin-controller
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSkinController = createSkinController;
const decoration_layers_ts_1 = require("./decoration-layers.ts");
const backdrop_scene_ts_1 = require("./backdrop-scene.ts");
function createSkinController(deps) {
    const doc = deps.doc;
    const ledger = deps.ledger;
    const apiBase = deps.apiBase ?? '/api/skin-center/v2';
    const fetchImpl = deps.fetchImpl ?? fetch.bind(doc.defaultView);
    const layers = (0, decoration_layers_ts_1.ensureDecorationLayers)(doc);
    const onError = deps.onError ?? (() => { });
    const themeGet = deps.themeGet ?? (() => (doc.body?.hasAttribute('data-ds-dark-theme') ? 'dark' : 'light'));
    const themeSubscribe = deps.themeSubscribe ?? ((listener) => {
        let last = themeGet();
        const observer = new doc.defaultView.MutationObserver(() => {
            const next = themeGet();
            if (next !== last) {
                last = next;
                listener(next);
            }
        });
        if (doc.body)
            observer.observe(doc.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
        return () => observer.disconnect();
    });
    /**
     * Re-paint the current activation's background media for the live
     * light/dark theme (the controller owns the layer, so a theme flip must
     * swap the variant the same way an activation does). No-op when there is
     * nothing painted or the manifest carries no backgroundMedia.
     */
    function repaintBackgroundForTheme() {
        if (active === null || currentActivation === null || lastEntry === null)
            return;
        const media = lastEntry.manifest.contributes.backgroundMedia;
        if (!media)
            return;
        if (deps.suppressBackgroundMedia?.() === true)
            return;
        const variant = themeGet() === 'dark' ? (media.dark ?? media.light) : (media.light ?? media.dark);
        if (!variant)
            return;
        const assetBase = `${apiBase}/skins/${lastEntry.manifest.id}`;
        setBackgroundLayer(currentActivation, (0, decoration_layers_ts_1.buildBackgroundMedia)(doc, variant, assetBase));
    }
    const unsubscribeTheme = themeSubscribe(() => repaintBackgroundForTheme());
    const loadStylesheet = deps.loadStylesheet ?? ((href) => new Promise((resolveLink, rejectLink) => {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        const timer = setTimeout(() => rejectLink(new Error(`stylesheet load timeout: ${href}`)), 15000);
        link.onload = () => { clearTimeout(timer); resolveLink(); };
        link.onerror = () => { clearTimeout(timer); rejectLink(new Error(`stylesheet load failed: ${href}`)); };
        doc.head.appendChild(link);
    }));
    let latestRequest = 0;
    let currentActivation = null;
    const initialSkinId = doc.documentElement?.getAttribute('data-dsh-skin') || null;
    let active = initialSkinId;
    /** The committed selection try-on restores (component scope). */
    let committed = { id: initialSkinId, entry: null };
    /** Last non-null applied entry, so refresh() can re-activate it. */
    let lastEntry = null;
    /** Last evaluated background-suppression verdict (refresh() skips no-ops). */
    let lastSuppressed = deps.suppressBackgroundMedia?.() === true;
    let trying = null;
    let previewing = false;
    const listeners = new Set();
    // React's useSyncExternalStore requires a CACHED snapshot: getSnapshot must
    // return the same reference until the state actually changes, or the store
    // consumer loops forever (and the settings card crashes blank).
    let stateSnapshot = { active: initialSkinId, trying: null, previewing: false };
    const emit = () => {
        stateSnapshot = { active, trying, previewing };
        for (const listener of listeners)
            listener();
    };
    /**
     * Install one stylesheet as a tracked <link> (the load itself happened in
     * loadStylesheet; here we only register the teardown). Links keep relative
     * url() resolution intact — a <style> tag would resolve them against the
     * document and 404 every skin asset.
     */
    function trackStylesheet(activation, label, href) {
        const link = doc.head.querySelector(`link[href="${href}"]`);
        ledger.record(activation, `style:${label}`, () => link?.remove());
    }
    /**
     * Paint the skin background art into the `background` decoration layer
     * (z-index:-2) with a snapshot for the activation ledger. Only the CURRENT
     * activation may restore: when an older activation is disposed after a
     * newer one already re-painted the layer, restoring its snapshot would
     * clobber the newer paint.
     *
     * Two reasons the art lives in the layer, not on `document.body`:
     *  - Chromium's backdrop-filter does not sample the canvas/body background,
     *    so the skin-center blur layer (z-index:-1) could never blur body-painted
     *    art (issue #732 defect A). A real fixed element IS sampled, so after
     *    this change the same blur + scrim controls work on the skin backdrop
     *    just like they already do on the Wallpaper Engine layers (issue #777).
     *  - dragon-heir hooks expect the art in ctx.layers.background (they swap
     *    the painted img and apply the v1 filter lift); the layer is the v2
     *    contract and body painting was a leftover half-migration.
     * The body's own opaque background is forced transparent while art is
     * mounted, or the shell's static panels would cover the negative-z layer.
     */
    function setBackgroundLayer(activation, nodes) {
        const style = doc.body.style;
        const previousBackgroundColor = style.getPropertyValue('background-color');
        const previousBackgroundImage = style.getPropertyValue('background-image');
        const restore = () => {
            if (currentActivation !== activation)
                return;
            (0, decoration_layers_ts_1.clearLayer)(layers.background);
            (0, backdrop_scene_ts_1.setSceneBackdropActive)(doc, 'skin', false);
            if (previousBackgroundColor === '')
                style.removeProperty('background-color');
            else
                style.setProperty('background-color', previousBackgroundColor);
            if (previousBackgroundImage === '')
                style.removeProperty('background-image');
            else
                style.setProperty('background-image', previousBackgroundImage);
        };
        (0, decoration_layers_ts_1.clearLayer)(layers.background);
        if (nodes.length > 0) {
            for (const node of nodes)
                layers.background.appendChild(node);
            style.setProperty('background-color', 'transparent');
            style.setProperty('background-image', 'none');
            (0, backdrop_scene_ts_1.setSceneBackdropActive)(doc, 'skin', true);
        }
        else {
            (0, backdrop_scene_ts_1.setSceneBackdropActive)(doc, 'skin', false);
            if (previousBackgroundColor === '')
                style.removeProperty('background-color');
            else
                style.setProperty('background-color', previousBackgroundColor);
            if (previousBackgroundImage === '')
                style.removeProperty('background-image');
            else
                style.setProperty('background-image', previousBackgroundImage);
        }
        ledger.record(activation, 'background:layer', restore);
    }
    function installBackground(activation, entry) {
        const media = entry.manifest.contributes.backgroundMedia;
        if (!media) {
            setBackgroundLayer(activation, []);
            return;
        }
        // WE wallpaper > user manual background > skin manifest background.
        if (deps.suppressBackgroundMedia?.() === true) {
            setBackgroundLayer(activation, []);
            return;
        }
        const variant = themeGet() === 'dark' ? (media.dark ?? media.light) : (media.light ?? media.dark);
        if (!variant) {
            setBackgroundLayer(activation, []);
            return;
        }
        const assetBase = `${apiBase}/skins/${entry.manifest.id}`;
        setBackgroundLayer(activation, (0, decoration_layers_ts_1.buildBackgroundMedia)(doc, variant, assetBase));
    }
    async function installHooks(activation, entry) {
        const facet = entry.manifest.facets?.client;
        if (!facet)
            return;
        const importHooks = deps.importHooks ?? ((url) => Promise.resolve(`${url}`).then(s => __importStar(require(s))));
        try {
            const mod = (await importHooks(`${apiBase}/skins/${entry.manifest.id}/hooks.mjs`));
            const factory = mod?.default;
            if (typeof factory !== 'function')
                throw new Error('hooks.mjs must default-export defineSkinHooks()');
            const hooks = factory();
            if (typeof hooks?.apply !== 'function')
                throw new Error('defineSkinHooks() must return { apply }');
            const cleanups = [];
            const ctx = {
                skinId: entry.manifest.id,
                scopeAttr: entry.manifest.id,
                assetBase: `${apiBase}/skins/${entry.manifest.id}`,
                layers,
                theme: {
                    get: themeGet,
                    subscribe: themeSubscribe,
                },
                onCleanup: (fn) => {
                    cleanups.push(fn);
                },
            };
            hooks.apply(ctx);
            ledger.record(activation, 'hooks', () => {
                try {
                    hooks.dispose?.();
                }
                catch (error) {
                    onError(`hooks dispose failed for ${entry.manifest.id}`, error);
                }
                for (const cleanup of cleanups.reverse()) {
                    try {
                        cleanup();
                    }
                    catch (error) {
                        onError(`hooks cleanup failed for ${entry.manifest.id}`, error);
                    }
                }
            });
        }
        catch (error) {
            // The escape hatch never takes the static skin down with it.
            onError(`hooks failed for ${entry.manifest.id}; static skin stays active`, error);
        }
    }
    async function persist(id) {
        if (deps.persist) {
            await deps.persist(id);
            return;
        }
        await fetchImpl(`${apiBase}/active`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ active: id }),
        });
    }
    async function switchInternal(id, entry, shouldPersist) {
        const seq = ++latestRequest;
        const activation = ledger.beginActivation();
        try {
            if (id !== null && entry !== null) {
                const stylesheetHref = `${apiBase}/skins/${id}/stylesheet`;
                const patchesHref = entry.manifest.contributes.patches !== undefined
                    ? `${apiBase}/skins/${id}/patches`
                    : null;
                await loadStylesheet(stylesheetHref);
                trackStylesheet(activation, 'stylesheet', stylesheetHref);
                if (patchesHref !== null) {
                    await loadStylesheet(patchesHref).catch(() => { });
                    trackStylesheet(activation, 'patches', patchesHref);
                }
                if (seq !== latestRequest)
                    throw new StaleSwitch();
                installBackground(activation, entry);
                await installHooks(activation, entry);
            }
            else {
                // Stock / entryless switch owns the background layer too: it must
                // clear a previous skin's paint (the old activation's restore is
                // skipped as stale by the ownership gate).
                setBackgroundLayer(activation, []);
            }
            if (seq !== latestRequest)
                throw new StaleSwitch();
            // The atomic cut: attribute first, then retire the old activation.
            if (id === null)
                doc.documentElement.removeAttribute('data-dsh-skin');
            else
                doc.documentElement.setAttribute('data-dsh-skin', id);
            const previous = currentActivation;
            currentActivation = activation;
            active = id;
            if (entry !== null)
                lastEntry = entry;
            if (shouldPersist) {
                committed = { id, entry };
                trying = null;
                previewing = false;
            }
            else {
                previewing = id !== committed.id;
                trying = previewing ? id : null;
            }
            emit();
            if (previous !== null)
                ledger.disposeActivation(previous);
            if (shouldPersist) {
                await persist(id).catch((error) => onError('failed to persist the skin selection', error));
            }
            return active;
        }
        catch (error) {
            ledger.disposeActivation(activation);
            if (error instanceof StaleSwitch)
                return active;
            if (currentActivation === null) {
                active = null;
                committed = { id: null, entry: null };
                doc.documentElement.removeAttribute('data-dsh-skin');
                emit();
            }
            onError(`switch to ${id ?? 'stock'} failed; previous skin intact`, error);
            return active;
        }
    }
    return {
        get active() {
            return active;
        },
        get layers() {
            return layers;
        },
        async switchTo(id, entry) {
            return await switchInternal(id, entry, true);
        },
        async tryOn(id, entry) {
            return await switchInternal(id, entry, false);
        },
        async exitTryOn() {
            const result = await switchInternal(committed.id, committed.entry, false);
            return result;
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getState() {
            return stateSnapshot;
        },
        async refresh() {
            const suppressed = deps.suppressBackgroundMedia?.() === true;
            if (suppressed === lastSuppressed)
                return active;
            lastSuppressed = suppressed;
            const id = active;
            if (id !== null && lastEntry === null) {
                return active;
            }
            return await switchInternal(id, id === null ? null : lastEntry, false);
        },
        shutdown() {
            latestRequest += 1;
            unsubscribeTheme();
            if (currentActivation !== null) {
                ledger.disposeActivation(currentActivation);
                currentActivation = null;
            }
            active = null;
            trying = null;
            previewing = false;
            committed = { id: null, entry: null };
            emit();
            doc.documentElement.removeAttribute('data-dsh-skin');
        },
    };
}
class StaleSwitch extends Error {
    constructor() {
        super('superseded by a newer switch');
    }
}

  },
  "packages/ui-skins/src/client/skin-engine/backdrop-scene.ts": function (module, exports, require) {
"use strict";
/**
 * Unified "backdrop visible" scene marker (issue #777).
 *
 * A skin with painted background media or a mounted Wallpaper Engine
 * wallpaper both put real backdrop art behind the app. The two runtime
 * controllers (skin-controller and wallpaper) report their mount state
 * through setSceneBackdropActive(); this module folds them into ONE body /
 * html marker `data-dsh-backdrop-active` and installs the shared composer
 * seat neutralizer that keys on it.
 *
 * The shell's active composer seat paints a bottom occlusion gradient under
 * the sticky input card (rc.8: a linear gradient to --dsw-alias-bg-base,
 * z-index 7). Backdrop scenes intentionally remove that seat-wide gradient in
 * both active and hero phases so wallpaper art remains unobstructed down to the
 * viewport edge. Skin-provided seat-wide ::before masks are neutralized too.
 * Composer task/statistics surfaces are styled by the shared shell adapter
 * from skin theme tokens, not by this scene layer.
 *
 * The input card itself ([data-composer-card], the official shell's stable card
 * anchor) keeps its translucent tint and gains the configurable backdrop blur
 * (default INPUT_FROST_BLUR_PX).
 *
 * The card rule is enabled only while the conversation actually has message
 * content (data-dsh-conversation-content): an empty conversation has no正文 to
 * occlude, so the input keeps its normal hero appearance without a frost flash.
 * The strength is provided by --dsh-input-card-blur and falls back to the
 * compatibility default when the setting has not loaded yet.
 *
 * The marker is body/html level (managed outside the surface/part/plugin
 * enum, see contracts/semantic-attrs-v1.md) and survives a neutralizer
 * teardown; the style is inert whenever the marker is absent.
 * @module @linxin666/dsh-client-ui-skin-center/runtime/backdrop-scene
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INPUT_FROST_BLUR_PX = exports.CONVERSATION_CONTENT_ATTR = exports.COMPOSER_FROST_ATTR = exports.SCENE_NEUTRALIZER_ATTR = exports.BACKDROP_ACTIVE_ATTR = void 0;
exports.setSceneBackdropActive = setSceneBackdropActive;
exports.ensureSceneNeutralizer = ensureSceneNeutralizer;
exports.syncComposerFrost = syncComposerFrost;
/** Shared marker: set on html + body while a source reports backdrop art. */
exports.BACKDROP_ACTIVE_ATTR = 'data-dsh-backdrop-active';
/** The shared composer-seat neutralizer style's own attribute. */
exports.SCENE_NEUTRALIZER_ATTR = 'data-dsh-scene-neutralizer';
/**
 * Attribute of the composer frost follower: a body-level, fixed, empty element
 * sized to the input card's border box while a scene is active.
 *
 * It exists because the frost must NOT be painted on the card. A non-none
 * backdrop-filter (like transform, filter, contain or perspective) makes an
 * element the CONTAINING BLOCK for its fixed-position descendants, and the
 * official shell renders its tooltips inside the composer card: the composer
 * send arrow's bubble is position: fixed, so with the frost on the card it
 * resolved its viewport coordinates against the card, landed far outside it
 * but still inside the conversation scrollport, added its own height to
 * scrollHeight, and every hover clamped the scroll to the new bottom — the
 * whole conversation jumped by hundreds of pixels and snapped back on the
 * next frame (issue #1724). Documented throughout the catalog skins as the
 * reason a card ancestor never carries a filter.
 *
 * A body-level sibling is not an ancestor of the card, so it may carry the
 * blur; because nested backdrop-filters do not compose, the card itself must
 * stay filter-free for the follower's blur to read through its translucent
 * fill. The element is empty and pointer-events:none, and it is a sibling of
 * the app root, never inside the scrollport.
 */
exports.COMPOSER_FROST_ATTR = 'data-dsh-composer-frost';
/** Stacking rung of the follower: above the skin art layers, below the shell. */
const COMPOSER_FROST_Z_INDEX = '-1';
/** Conversation-content marker: set while the active conversation has rows. */
exports.CONVERSATION_CONTENT_ATTR = 'data-dsh-conversation-content';
/**
 * Stable shell scrollport scoped row selectors. Official builds emit the chat
 * anchor; the CSS-module suffix fallbacks retain compatibility with older
 * shells without returning to a body-wide topic/session query.
 */
const ACTIVE_CONVERSATION_CONTENT_SELECTOR = [
    '[data-conversation-scroll] [data-chat-anchor-key]',
    '[data-conversation-scroll] [class*="_userRow"]',
    '[data-conversation-scroll] [class*="_compactionRow"]',
    '[data-conversation-scroll] [class*="_contextRow"]',
    '[data-conversation-scroll] [class*="_turnErrorRow"]',
].join(', ');
/** Compatibility default for the input-card backdrop blur strength (px). */
exports.INPUT_FROST_BLUR_PX = 10;
const sourceSets = new WeakMap();
const contentObservers = new WeakMap();
const contentFrames = new WeakMap();
/** Write a marker attribute only when the desired state is not applied yet. */
function applyMarker(el, attr, active) {
    if (el === null)
        return;
    if (active) {
        if (el.getAttribute(attr) !== 'true')
            el.setAttribute(attr, 'true');
        return;
    }
    if (el.hasAttribute(attr))
        el.removeAttribute(attr);
}
/**
 * Report one source's backdrop-art presence. The marker stays on while any
 * source is active, so the skin and wallpaper controllers never clobber each
 * other across their mount/unmount cycles.
 */
function setSceneBackdropActive(doc, source, active) {
    let sources = sourceSets.get(doc);
    if (sources === undefined) {
        sources = new Set();
        sourceSets.set(doc, sources);
    }
    if (active)
        sources.add(source);
    else
        sources.delete(source);
    syncMarker(doc, sources);
}
/** Reflect the source set onto html/body and ensure the neutralizer on use. */
function syncMarker(doc, sources) {
    const active = sources.size > 0;
    applyMarker(doc.body, exports.BACKDROP_ACTIVE_ATTR, active);
    applyMarker(doc.documentElement, exports.BACKDROP_ACTIVE_ATTR, active);
    if (active) {
        ensureSceneNeutralizer(doc);
        startContentObserver(doc);
    }
    else {
        stopContentObserver(doc);
    }
    // The frost gate is the marker pair, so every path that changes either one
    // re-evaluates it: a scene mount/unmount, and the conversation-content flip
    // the observer above reports.
    syncComposerFrost(doc);
}
/**
 * Track whether the active conversation scrollport has message rows for the
 * frost gate. Topic pickers and outgoing session trees can retain their own
 * data-chat-anchor-key nodes during a switch; a body-wide query would count
 * those stale rows and flash the composer frost over the new empty topic.
 */
function updateConversationContent(doc) {
    const has = doc.body !== null && doc.body.querySelector(ACTIVE_CONVERSATION_CONTENT_SELECTOR) !== null;
    applyMarker(doc.body, exports.CONVERSATION_CONTENT_ATTR, has);
    applyMarker(doc.documentElement, exports.CONVERSATION_CONTENT_ATTR, has);
    // The composer frost is gated on this marker, so the flip must reach it.
    syncComposerFrost(doc);
}
/**
 * Coalesce the mutation bursts of a streaming conversation into one content
 * check per frame; a check scheduled for a document that stopped observing is
 * dropped so a late frame can never re-add the marker after teardown.
 */
function scheduleConversationContent(doc) {
    if (contentFrames.has(doc))
        return;
    const win = doc.defaultView;
    if (win === null || typeof win.requestAnimationFrame !== 'function') {
        updateConversationContent(doc);
        return;
    }
    contentFrames.set(doc, win.requestAnimationFrame(() => {
        contentFrames.delete(doc);
        if (!contentObservers.has(doc))
            return;
        updateConversationContent(doc);
    }));
}
/** Observe the conversation tree while a backdrop is visible. */
function startContentObserver(doc) {
    if (contentObservers.has(doc))
        return;
    updateConversationContent(doc);
    const win = doc.defaultView;
    if (win === null || typeof win.MutationObserver !== 'function')
        return;
    const observer = new win.MutationObserver(() => scheduleConversationContent(doc));
    observer.observe(doc.body ?? doc.documentElement, { childList: true, subtree: true });
    contentObservers.set(doc, observer);
}
/** Stop the content observer, cancel pending work and drop the marker. */
function stopContentObserver(doc) {
    const frame = contentFrames.get(doc);
    if (frame !== undefined) {
        const win = doc.defaultView;
        if (win !== null && typeof win.cancelAnimationFrame === 'function')
            win.cancelAnimationFrame(frame);
        contentFrames.delete(doc);
    }
    const observer = contentObservers.get(doc);
    if (observer !== undefined) {
        observer.disconnect();
        contentObservers.delete(doc);
    }
    applyMarker(doc.body, exports.CONVERSATION_CONTENT_ATTR, false);
    applyMarker(doc.documentElement, exports.CONVERSATION_CONTENT_ATTR, false);
    syncComposerFrost(doc);
}
/**
 * Install the shared composer-seat neutralizer, keyed by head presence so a
 * cleared head (tests) or a re-mount re-creates it. Without the marker the
 * rules are inert, so the style can outlive a single mount without changing
 * any other look.
 *
 * The composer card is deliberately absent from this sheet: its frost rides
 * {@link COMPOSER_FROST_ATTR} instead, because no rule here may put a
 * containing-block property back on the card (issue #1724).
 */
function ensureSceneNeutralizer(doc) {
    if (doc.head === null)
        return;
    if (doc.head.querySelector(`style[${exports.SCENE_NEUTRALIZER_ATTR}]`) !== null)
        return;
    const style = doc.createElement('style');
    style.setAttribute(exports.SCENE_NEUTRALIZER_ATTR, '');
    style.textContent = `
    html[data-dsh-backdrop-active] [data-composer-seat],
    html[data-dsh-backdrop-active] [data-composer-seat]::before {
      background: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    html[data-dsh-backdrop-active][data-dsh-conversation-content] [${exports.COMPOSER_FROST_ATTR}] {
      backdrop-filter: blur(var(--dsh-input-card-blur, ${exports.INPUT_FROST_BLUR_PX}px)) !important;
      -webkit-backdrop-filter: blur(var(--dsh-input-card-blur, ${exports.INPUT_FROST_BLUR_PX}px)) !important;
    }
  `;
    doc.head.appendChild(style);
}
const frostFollowers = new WeakMap();
/** The composer card the frost tracks, or null while none is mounted. */
function composerCardOf(doc) {
    return doc.body === null ? null : doc.body.querySelector('[data-composer-card]');
}
/**
 * Create the follower on first use and keep it sized to the composer card.
 *
 * The element is empty, fixed and inert: it paints nothing of its own, and it
 * receives no pointer events, so it can never take a tap from the composer or
 * the sidebar. Sizing uses one measure per animation frame (the shape
 * shell-rendering.ts uses for the composer height) rather than a per-mutation
 * read, and writes only when the box actually changed.
 */
function syncFrostFollower(doc) {
    const follower = frostFollowers.get(doc);
    if (follower === undefined)
        return;
    const card = composerCardOf(doc);
    if (card === null)
        return;
    // A conversation switch replaces the composer card; move the observation to
    // the node we now track (this runs inside the coalesced content check).
    if (follower.observed !== card) {
        if (follower.observed !== null)
            follower.resizeObserver?.unobserve(follower.observed);
        follower.observed = card;
        follower.resizeObserver?.observe(card);
        follower.applied = '';
    }
    const rect = card.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0)
        return;
    // The follower paints the card's own shape, including a skin's radius
    // override, so the blurred region never reads as a rectangle behind a
    // rounded card. Read per apply: a skin may change it after mount.
    const radius = doc.defaultView?.getComputedStyle(card).borderRadius ?? '';
    const box = [rect.top, rect.left, rect.width, rect.height, radius]
        .map((value) => typeof value === 'number' ? Math.round(value) : value)
        .join('|');
    if (box === follower.applied)
        return;
    follower.applied = box;
    const style = follower.el.style;
    style.top = `${Math.round(rect.top)}px`;
    style.left = `${Math.round(rect.left)}px`;
    style.width = `${Math.round(rect.width)}px`;
    style.height = `${Math.round(rect.height)}px`;
    style.borderRadius = radius;
}
/** Coalesce a burst of geometry changes into one measurement per frame. */
function scheduleFrostSync(doc) {
    const follower = frostFollowers.get(doc);
    if (follower === undefined || follower.frame !== null)
        return;
    const win = doc.defaultView;
    if (win === null || typeof win.requestAnimationFrame !== 'function') {
        syncFrostFollower(doc);
        return;
    }
    follower.frame = win.requestAnimationFrame(() => {
        follower.frame = null;
        if (!frostFollowers.has(doc))
            return;
        syncFrostFollower(doc);
    });
}
/** Mount the follower while a scene is visible and start tracking the card. */
function startFrostFollower(doc) {
    if (frostFollowers.has(doc) || doc.body === null)
        return;
    const el = doc.createElement('div');
    el.setAttribute(exports.COMPOSER_FROST_ATTR, '');
    el.setAttribute('aria-hidden', 'true');
    const style = el.style;
    style.position = 'fixed';
    style.pointerEvents = 'none';
    style.zIndex = COMPOSER_FROST_Z_INDEX;
    style.borderRadius = 'inherit';
    const follower = { el, resizeObserver: null, observed: null, onResize: null, frame: null, applied: '' };
    // A body-level sibling, appended after the app root so the shell's own
    // layers (and any skin decoration) keep their place; the rung above decides
    // paint order, not the append position.
    doc.body.appendChild(el);
    frostFollowers.set(doc, follower);
    const win = doc.defaultView;
    if (win !== null && typeof win.ResizeObserver === 'function') {
        follower.resizeObserver = new win.ResizeObserver(() => scheduleFrostSync(doc));
    }
    if (win !== null && typeof win.addEventListener === 'function') {
        follower.onResize = () => scheduleFrostSync(doc);
        win.addEventListener('resize', follower.onResize);
    }
    syncFrostFollower(doc);
}
/** Remove the follower and stop every loop that fed it. */
function stopFrostFollower(doc) {
    const follower = frostFollowers.get(doc);
    if (follower === undefined)
        return;
    frostFollowers.delete(doc);
    const win = doc.defaultView;
    // Cancel whatever is queued BEFORE the element goes: a frame that still held
    // a reference would otherwise re-apply a box to a detached node.
    if (follower.frame !== null && win !== null && typeof win.cancelAnimationFrame === 'function') {
        win.cancelAnimationFrame(follower.frame);
        follower.frame = null;
    }
    follower.resizeObserver?.disconnect();
    follower.resizeObserver = null;
    if (follower.onResize !== null) {
        win?.removeEventListener('resize', follower.onResize);
        follower.onResize = null;
    }
    follower.el.remove();
}
/**
 * Attach the composer frost to the current scene state. Called from the shared
 * marker sync so the follower exists exactly while a backdrop is visible and
 * the conversation has content — the same gate the card's old frost rule used.
 *
 * The follower tracks the card through a ResizeObserver on the card itself and
 * one interval-free re-schedule on every re-mount, so a conversation switch
 * that replaces the composer keeps the frost aligned without a polling loop.
 */
function syncComposerFrost(doc) {
    const wanted = doc.body !== null && doc.body.hasAttribute(exports.BACKDROP_ACTIVE_ATTR)
        && doc.body.hasAttribute(exports.CONVERSATION_CONTENT_ATTR);
    if (!wanted) {
        stopFrostFollower(doc);
        return;
    }
    startFrostFollower(doc);
}

  },
  "packages/ui-skins/src/client/skin-engine/decoration-layers.ts": function (module, exports, require) {
"use strict";
/**
 * Fixed decoration layers (issue #506, contract section 6).
 *
 * Six skin-center-owned, non-interactive containers mounted once per
 * document (component scope): background / ambient / top / bottom / sidebar /
 * foreground. Skins fill them per activation (background media, scrims,
 * strips); the CONTENT is activation scope — on every switch the controller
 * replaces it through the effect ledger.
 *
 * Guarantees:
 *  - pointer-events: none always (decoration must never eat clicks);
 *  - the layer elements themselves survive skin switches, reloads of the
 *    skin runtime, and HMR (ensure* is idempotent);
 *  - stacking stays below the official shell overlay: background/ambient sit
 *    behind the app, the strip/foreground layers use moderate z-indices that
 *    lose to dialogs/overlays (official overlay paints above 1000);
 *  - the background layer carries its own compositor layer (will-change:
 *    transform): a full-viewport skin background image is expensive to
 *    re-rasterize, and without isolation Chromium re-rasterizes it in
 *    horizontal bands whenever unrelated repaint bursts (streaming chat,
 *    animated pets, overlay menus) invalidate the same area — visible as
 *    vertical band flicker (issue #1013).
 * @module @linxin666/dsh-client-ui-skin-center/runtime/decoration-layers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DECORATION_LAYER_NAMES = void 0;
exports.ensureDecorationLayers = ensureDecorationLayers;
exports.setLayerContent = setLayerContent;
exports.clearLayer = clearLayer;
exports.buildBackgroundMedia = buildBackgroundMedia;
exports.DECORATION_LAYER_NAMES = [
    'background',
    'ambient',
    'top',
    'bottom',
    'sidebar',
    'foreground',
];
const LAYER_ATTR = 'data-dsh-skin-layer';
/**
 * Per-layer paint order. The background sits at -2: negative z-index
 * elements paint ABOVE the html/body backgrounds (so a skin's own opaque
 * root background-color renders BEHIND its art — the v1 layering) yet below
 * every panel surface. It shares -2 with the WE scrim, which never paints
 * at the same time (an active WE wallpaper suppresses skin media, enforced
 * by the controller). The skin-background blur veil (-1) still samples the
 * art above it. Ambient effects paint above the veils; the strip/foreground
 * layers stay below the official overlay band (>=1000).
 */
const LAYER_STYLE = {
    // Explicit longhands only: the inset shorthand has burned us once (a
    // mid-session layer lost its bottom edge), longhands parse everywhere.
    background: 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:-2;pointer-events:none;will-change:transform;',
    ambient: 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:30;pointer-events:none;',
    top: 'position:fixed;top:0;left:0;right:0;z-index:40;pointer-events:none;',
    bottom: 'position:fixed;bottom:0;left:0;right:0;z-index:40;pointer-events:none;',
    sidebar: 'position:fixed;top:0;bottom:0;left:0;z-index:40;pointer-events:none;',
    foreground: 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:41;pointer-events:none;',
};
function ensureOne(doc, name) {
    const existing = doc.querySelector(`[${LAYER_ATTR}="${name}"]`);
    if (existing) {
        // Never trust a previous writer's styles: re-assert invariants.
        existing.style.cssText = LAYER_STYLE[name];
        return existing;
    }
    const el = doc.createElement('div');
    el.setAttribute(LAYER_ATTR, name);
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = LAYER_STYLE[name];
    doc.body.appendChild(el);
    return el;
}
/**
 * Ensure all six layers exist and return their handles. Idempotent; safe to
 * call on every activation.
 */
function ensureDecorationLayers(doc) {
    return {
        background: ensureOne(doc, 'background'),
        ambient: ensureOne(doc, 'ambient'),
        top: ensureOne(doc, 'top'),
        bottom: ensureOne(doc, 'bottom'),
        sidebar: ensureOne(doc, 'sidebar'),
        foreground: ensureOne(doc, 'foreground'),
    };
}
/**
 * Replace one layer's content (activation scope). Returns a teardown that
 * removes exactly the nodes this call added — idempotent, ledger-ready.
 */
function setLayerContent(layer, nodes) {
    const added = [...nodes];
    for (const node of added)
        layer.appendChild(node);
    let done = false;
    return () => {
        if (done)
            return;
        done = true;
        for (const node of added)
            node.parentNode?.removeChild(node);
    };
}
/** Remove every node an activation left in a layer (used on dispose). */
function clearLayer(layer) {
    while (layer.firstChild)
        layer.removeChild(layer.firstChild);
}
/**
 * Build the background media element for a manifest backgroundMedia layer.
 * Returns null when the theme variant has no media. The element fills the
 * background layer; the scrim (when declared) is a sibling overlay.
 */
function buildBackgroundMedia(doc, layer, assetBase) {
    const nodes = [];
    const fullBleed = 'position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;object-fit:cover;';
    if (layer.type === 'image') {
        const img = doc.createElement('img');
        img.src = `${assetBase}/${layer.src}`;
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.style.cssText = fullBleed;
        nodes.push(img);
    }
    else {
        const video = doc.createElement('video');
        video.src = `${assetBase}/${layer.src}`;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.setAttribute('aria-hidden', 'true');
        video.style.cssText = fullBleed;
        nodes.push(video);
    }
    if (layer.scrim) {
        const scrim = doc.createElement('div');
        scrim.setAttribute('aria-hidden', 'true');
        scrim.style.cssText = `position:absolute;inset:0;background:${layer.scrim};`;
        nodes.push(scrim);
    }
    return nodes;
}

  },
  "packages/ui-skins/src/client/skin-engine/shell-rendering.ts": function (module, exports, require) {
"use strict";
/**
 * Shared shell rendering corrections for every visual mode owned by the skin
 * center (issue #954). The official shell exposes stable slot / composer
 * anchors, while the workspace-list fade itself is still a CSS-module class.
 * Keep that fallback scoped below sidebar.workspaces so an unrelated animation
 * or overlay whose class contains "fade" is never affected.
 *
 * The stylesheet is inert for the stock look: a catalog skin, custom theme or
 * wallpaper must be active. It is installed once per runtime and removed with
 * that runtime, so disabling the plugin restores the shell unchanged.
 * @module @linxin666/dsh-client-ui-skin-center/runtime/shell-rendering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COMPOSER_CLEARANCE_PX = exports.SHELL_RENDERING_STYLE_ATTR = void 0;
exports.shellRenderingCss = shellRenderingCss;
exports.installShellRenderingAdapter = installShellRenderingAdapter;
/** Marker owned by the shared shell-rendering stylesheet. */
exports.SHELL_RENDERING_STYLE_ATTR = 'data-dsh-shell-rendering';
/** Fallback composer seat height for scrollport bottom clearance (px). */
exports.DEFAULT_COMPOSER_CLEARANCE_PX = 100;
const ACTIVE_VISUAL_SELECTOR = [
    'html[data-dsh-skin]',
    'html[data-dsh-custom-theme]:not([data-dsh-skin])',
    'html[data-dsh-wallpaper-active]',
].join(', ');
const COMPOSER_SEAT_SELECTORS = [
    '[data-slot="conversation.composer"]',
    '[data-composer-seat]',
    '[data-dsh-surface="composer"]',
];
/** Build the inert-by-default public rendering corrections. */
function shellRenderingCss() {
    const scopes = ACTIVE_VISUAL_SELECTOR.split(', ');
    const scoped = (selector) => scopes.map(scope => `${scope} ${selector}`).join(',\n');
    return `
    /* Viewport lock: prevent outer page scrollbar and viewport
       displacement during element focus/scrollIntoView. */
    ${ACTIVE_VISUAL_SELECTOR},
    ${scoped('body')} {
      height: 100% !important;
      width: 100% !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    ${scoped('[data-slot="sidebar.workspaces"] [class*="_fade"]')} {
      background: none !important;
      background-image: none !important;
    }
    ${scoped('[data-composer-card] textarea[data-phase]::placeholder')},
    ${scoped('textarea[data-dsh-part="composer-input"]::placeholder')} {
      color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-caption)) !important;
      -webkit-text-fill-color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-caption)) !important;
      opacity: 1 !important;
    }
    ${scoped('[data-phase="active"] [data-slot="conversation.input.dock"] > *')},
    ${scoped('[data-phase="active"] [data-slot="conversation.composer.dock"] > *')},
    ${scoped('[data-phase="active"] [data-slot="conversation.composer.dock"] + *')} {
      /* One skin-driven accessory surface for task and statistics docks. Skins
         automatically follow their existing semantic theme tokens and may
         override the --dsh-composer-accessory-* variables for a stronger
         signature without coupling this adapter to a specific catalog skin.

         The third head covers an accessory that is a SIBLING of the dock slot
         host rather than a child of it. The slot host is display: contents, so
         the shell lays its children out as items of the surrounding dock row
         and the child heads reach them; 0.1.7's context meter was placed beside
         that host instead of inside it, so it shared the row with the
         statistics pill but stayed bare (issue #1715) -- one line, two looks.
         The adjacent-sibling head keeps the row uniform without naming any
         hashed class or localized label, and covers whatever future accessory
         the shell seats next to the dock. The plate lands on the accessory's
         own seat, never on a trigger inside it, so a component's own hover
         feedback keeps painting on top. */
      background: var(--dsh-composer-accessory-bg, var(--dsw-specific-tip, var(--dsw-alias-bg-layer-1))) !important;
      color: var(--dsh-composer-accessory-color, var(--dsw-alias-label-tertiary)) !important;
      border: var(--dsh-composer-accessory-border, none) !important;
      border-radius: var(--dsh-composer-accessory-radius, 12px) !important;
      box-shadow: var(--dsh-composer-accessory-shadow, var(--dsw-shadow-lv1, 0 2px 10px rgba(7, 20, 38, 0.18)));
      backdrop-filter: blur(var(--dsh-composer-accessory-blur, var(--dsh-input-card-blur, 10px))) !important;
      -webkit-backdrop-filter: blur(var(--dsh-composer-accessory-blur, var(--dsh-input-card-blur, 10px))) !important;
    }
    ${scoped('[data-phase="active"] [data-slot="conversation.composer.dock"] > *')},
    ${scoped('[data-phase="active"] [data-slot="conversation.composer.dock"] + *')} {
      /* Same metrics for a dock child and for the sibling seat beside the dock
         slot host, so the two accessories of one row end up the same height:
         the plate must not make one of them look like a different control. */
      margin-top: var(--dsh-composer-accessory-gap, 4px);
      margin-bottom: var(--dsh-composer-accessory-gap, 4px);
      padding-top: 2px;
      padding-bottom: 2px;
    }
    ${scoped('[data-slot="conversation.input.dock"] > [data-goal-bar="true"][data-goal-bar="true"][data-goal-bar="true"]')} {
      /* The host goal dock spans the full composer seat and contains its own
         centered compact bar. Do not paint the outer dock as an accessory: that
         creates a viewport-wide veil behind the active-goal chip. The repeated
         stable marker deliberately raises specificity above catalog-skin dock
         selectors that load after this shared adapter. */
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    ${scoped('[data-phase="active"] [data-slot="conversation.input.dock"] > [data-queue-dock]')} {
      /* The native queue dock stacks two boxes inside the input dock: a root
         wrapper that only supplies the shared dock inset, and the panel inside
         it that paints its own --dsw-specific-tip fill. Painting the wrapper as
         an accessory adds a second opaque plate one dock inset (8px) wider than
         the panel on each side, which reads as an extra sheet of paper under
         the queue (issue #1572). Reset the accessory surface so the panel stays
         the single layer; the wrapper keeps its inset, so the panel remains
         aligned with the composer card. */
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    ${scoped('[data-conversation-scroll]')},
    ${scoped('[data-dsh-part="scrollport"]')} {
      /* The composer is the scrollport's final in-flow child. Reserving physical
         padding after it lifts the active dock by one composer height and also
         shifts the hero above center. */
      padding-bottom: 0 !important;
    }
    /* #978 / #1133: Line-level scroll-margin retains scrollIntoView() clearance
       above the sticky composer without placing a scrollport-level scroll-padding
       that breaks browser caret-reveal geometry (which caused micro-scrolling on
       every keystroke while reading history). */
    ${scoped('[data-conversation-scroll] [data-chat-anchor-key]')},
    ${scoped('[data-conversation-scroll] [data-chat-flow-kind]')},
    ${scoped('[data-conversation-scroll] [data-dsh-part="message-row"]')},
    ${scoped('[data-conversation-scroll] [data-turn-tail]')},
    ${scoped('[data-conversation-scroll] [class*="_userRow"]')},
    ${scoped('[data-conversation-scroll] [class*="_compactionRow"]')},
    ${scoped('[data-conversation-scroll] [class*="_contextRow"]')},
    ${scoped('[data-conversation-scroll] [class*="_turnErrorRow"]')} {
      scroll-margin-bottom: var(--dsh-composer-height, ${exports.DEFAULT_COMPOSER_CLEARANCE_PX}px) !important;
    }
    /* dsh 0.1.7 turned the right sidebar panel shell into an always-mounted,
       always-visible positioning box (only its inner dockkit surfaces hide
       while the panel is closed). Skin rules written for the older shell plate
       that shell element and, with the panel closed, cover the conversation
       area with a phantom column. Strip paint from the closed shell whatever
       the active skin; an open panel ([data-sidebar-right-open]) keeps every
       skin paint. The attribute predates the layout change, so the rule is a
       no-op on older shells. */
    ${scoped('[data-slot="rightbar.session"] > [data-sidebar-right-panel]:not([data-sidebar-right-open])')} {
      background: none !important;
      background-color: transparent !important;
      background-image: none !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
    /* #1117: The upstream recommended badge pairs two background-fill tokens
       as bg + text — in dark mode, skins like Blue Fantasy collapse them to
       near-identical dark navy values (contrast ~1:1). Override the text
       color to a readable foreground and tweak the background for contrast.
       The dark-theme attribute lives on <body>, so it belongs inside the
       scoped selector: prefixing the already-scoped list produced
       "body ... html ...", a descendant chain that can never match (#1490). */
    ${scoped('body[data-ds-dark-theme] [data-question-key] [class*="_badge"]')},
    ${scoped('body[data-ds-dark-theme] [data-question-scroll] [class*="_badge"]')} {
      color: var(--dsw-alias-label-primary, #ffffff) !important;
      background: var(--dsw-alias-interactive-bg-active, color-mix(in srgb, var(--dsw-alias-button-info-fill, #4a5fa8) 50%, transparent)) !important;
    }
  `;
}
/** Install the shared corrections and return their idempotent teardown. */
function installShellRenderingAdapter(doc) {
    if (doc.head === null)
        return () => { };
    const existing = doc.head.querySelector(`style[${exports.SHELL_RENDERING_STYLE_ATTR}]`);
    if (existing !== null)
        return () => { };
    const style = doc.createElement('style');
    style.setAttribute(exports.SHELL_RENDERING_STYLE_ATTR, '');
    style.textContent = shellRenderingCss();
    doc.head.appendChild(style);
    const win = doc.defaultView;
    try {
        win?.scrollTo?.(0, 0);
    }
    catch { }
    const composerSelector = COMPOSER_SEAT_SELECTORS.join(', ');
    let resizeObserver = null;
    let mutationObserver = null;
    let observedComposer = null;
    let appliedHeight = '';
    let scheduledFrame = null;
    let disposed = false;
    // The shell mounts one composer seat per conversation; keep the resolved
    // element while it stays connected instead of re-querying the body for every
    // mutation batch (issue #954 follow-up: streaming produced many queries/s).
    const resolveComposer = () => {
        if (observedComposer !== null && observedComposer.isConnected)
            return observedComposer;
        return doc.body === null ? null : doc.body.querySelector(composerSelector);
    };
    const syncHeight = () => {
        if (doc.body === null)
            return;
        const composer = resolveComposer();
        if (composer === null)
            return;
        if (observedComposer !== composer) {
            if (observedComposer !== null && resizeObserver !== null) {
                resizeObserver.unobserve(observedComposer);
            }
            observedComposer = composer;
            if (resizeObserver !== null) {
                resizeObserver.observe(composer);
            }
        }
        const rect = composer.getBoundingClientRect();
        if (rect.height <= 0)
            return;
        const root = doc.documentElement;
        const next = `${Math.ceil(rect.height)}px`;
        // Skip the custom-property write (and its forced style invalidation) while
        // the measured height still matches what is already applied.
        if (next === appliedHeight || root === null)
            return;
        appliedHeight = next;
        root.style.setProperty('--dsh-composer-height', next);
    };
    // Coalesce mutation bursts into at most one measure/write per frame; the
    // disposer cancels whatever is still scheduled.
    const scheduleSync = () => {
        if (scheduledFrame !== null || disposed)
            return;
        if (win === null || typeof win.requestAnimationFrame !== 'function') {
            syncHeight();
            return;
        }
        scheduledFrame = win.requestAnimationFrame(() => {
            scheduledFrame = null;
            if (disposed)
                return;
            syncHeight();
        });
    };
    if (win !== null && typeof win.ResizeObserver === 'function') {
        resizeObserver = new win.ResizeObserver(() => syncHeight());
    }
    if (win !== null && typeof win.MutationObserver === 'function' && doc.body !== null) {
        mutationObserver = new win.MutationObserver(() => scheduleSync());
        mutationObserver.observe(doc.body, { childList: true, subtree: true });
    }
    syncHeight();
    return () => {
        if (disposed)
            return;
        disposed = true;
        if (scheduledFrame !== null) {
            if (win !== null && typeof win.cancelAnimationFrame === 'function')
                win.cancelAnimationFrame(scheduledFrame);
            scheduledFrame = null;
        }
        if (resizeObserver !== null) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (mutationObserver !== null) {
            mutationObserver.disconnect();
            mutationObserver = null;
        }
        observedComposer = null;
        appliedHeight = '';
        doc.documentElement?.style.removeProperty('--dsh-composer-height');
        style.remove();
    };
}

  },
  "packages/ui-skins/src/client/skin-engine/semantic-adapter.ts": function (module, exports, require) {
"use strict";
/**
 * Semantic adapter (issue #506, contract section 6, L2 compat adapter).
 *
 * One merged MutationObserver that stamps the semantic-attribute enumeration
 * (contracts/semantic-attrs-v1.md) onto the official shell DOM and onto
 * plugin roots that already expose stable anchors. This is explicitly a
 * COMPAT adapter — not a permanent public contract:
 *  - official areas migrate to first-party attributes when the upstream
 *    theme seam lands (then these rules are re-evaluated for deletion);
 *  - third-party plugin areas stay here long-term (plugins that opt in
 *    output the attributes themselves and the adapter becomes a no-op).
 *
 * Properties:
 *  - merged: a single observer handles every rule;
 *  - idempotent: re-tagging an already-correct element is a no-op, so React
 *    re-renders simply get re-stamped when their nodes are re-added;
 *  - fail-closed diagnostics: rules that match nothing and selectors the
 *    engine rejects are reported, never thrown into the page;
 *  - the adapter never REMOVES attributes it did not set; disposal only
 *    disconnects the observer (stamping is cosmetic and scopes itself under
 *    html[data-dsh-skin] consumers).
 * @module @linxin666/dsh-client-ui-skin-center/runtime/semantic-adapter
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEMANTIC_RULES_V1 = void 0;
exports.createSemanticAdapter = createSemanticAdapter;
/**
 * The v1 rule table. Single ownership: only the skin-center edits this.
 * Anchors verified against @deepseek-ai rc.7 (see docs/archive survey).
 */
exports.SEMANTIC_RULES_V1 = [
    // ---- surfaces (official shell) ----
    { selector: '[data-slot="root"]', attrs: [['data-dsh-surface', 'root']], note: 'ui-renderer root outlet' },
    { selector: '[data-slot="sidebar"]', attrs: [['data-dsh-surface', 'sidebar']], note: 'layout sidebar outlet' },
    {
        selector: '[data-slot="conversation"], [class*="centerCol"]',
        attrs: [['data-dsh-surface', 'conversation']],
        note: 'conversation column: legacy conversation outlet; since dsh 0.1.7 the column carries no data hook, so the css-module suffix (hash prefix varies, suffix stable) is the anchor',
    },
    { selector: '[data-slot="conversation.session.header"]', attrs: [['data-dsh-surface', 'session-header']], note: 'conversation header outlet' },
    { selector: '[data-slot="conversation.composer"]', attrs: [['data-dsh-surface', 'composer']], note: 'composer chain outlet' },
    {
        selector: '[data-slot="details"], [data-rightbar-col]',
        attrs: [['data-dsh-surface', 'details']],
        note: 'details column: legacy details outlet; since dsh 0.1.7 the right sidebar column carries the official data-rightbar-col hook (0-width while collapsed, so stamping it paints nothing when closed)',
    },
    { selector: '[data-shell-overlay]', attrs: [['data-dsh-surface', 'overlay']], note: 'frame overlay attribute' },
    { selector: '[data-slot="shell.overlay"]', attrs: [['data-dsh-surface', 'overlay']], note: 'shell overlay outlet' },
    {
        selector: '[role="dialog"]:has([data-slot="settings.section"])',
        attrs: [['data-dsh-surface', 'settings']],
        note: 'settings dialog (composite: dialog containing the section outlet)',
    },
    // ---- shell parts ----
    { selector: '[data-chat-flow-kind]', attrs: [['data-dsh-part', 'message-row']], note: 'chat flow item' },
    { selector: '[data-streaming]', attrs: [['data-dsh-part', 'message-body']], note: 'assistant markdown root' },
    { selector: '[data-conversation-scroll]', attrs: [['data-dsh-part', 'scrollport']], note: 'conversation scrollport' },
    {
        selector: 'textarea[data-phase], [data-composer-input]',
        attrs: [['data-dsh-part', 'composer-input']],
        note: 'composer input: legacy textarea; current shells render a Lexical contenteditable carrying data-composer-input',
    },
    { selector: '[data-decoration="chip"]', attrs: [['data-dsh-part', 'composer-chip']], note: 'composer reference chip' },
    { selector: '[data-queue-dock]', attrs: [['data-dsh-part', 'queue-dock']], note: 'queued turns dock' },
    { selector: '[data-turn-tail]', attrs: [['data-dsh-part', 'turn-tail']], note: 'turn tail row' },
    { selector: '[data-side]', attrs: [['data-dsh-part', 'resize-handle']], note: 'column resize handle' },
    {
        selector: 'button[class*="newSession"]',
        attrs: [['data-dsh-part', 'new-session']],
        note: 'sidebar new-session action (compat seam shields skins from localized labels)',
    },
    // ---- plugin roots (plugins without stable anchors opt in via AGENTS.md) ----
    {
        selector: '[data-dsh-taskboard-view], [data-dsh-taskboard-board]',
        attrs: [['data-dsh-plugin', 'task-board']],
        note: 'task-board panel/board (the sidebar row is shell-owned: its glyph carries data-dsh-panel-entry and the family rule below stamps the row)',
    },
    {
        selector: '[data-dsh-ssh-view]',
        attrs: [['data-dsh-plugin', 'ssh']],
        note: 'ssh panel (the sidebar row is shell-owned: its glyph carries data-dsh-panel-entry and the family rule below stamps the row)',
    },
    {
        selector: '[data-gitgraph-chip-anchor], [data-gitgraph-dialog]',
        attrs: [['data-dsh-plugin', 'git-graph']],
        note: 'git-graph chip/dialog',
    },
    {
        selector: '[data-dsh-pet-root]',
        attrs: [['data-dsh-plugin', 'pet']],
        note: 'pet global root',
    },
    // ---- family parts ----
    {
        selector: '[class*="panelRow"]:has([data-dsh-panel-entry])',
        attrs: [['data-dsh-part', 'sidebar-entry']],
        note: 'a plugin-registered sidebar row (sidebar.panellist): the shell owns the row box and stamps no hook of its own, so the row is recognised by its css-module class plus the glyph identity the registering plugin outputs — same compat technique as newSession',
    },
];
/**
 * The anchors the rule table keys on, as one attribute filter for the
 * observer: a glyph or row anchor that is SET on an element already in the
 * tree must re-anchor its ancestors exactly like a newly inserted one.
 */
const ANCHOR_ATTRIBUTES = [
    'data-dsh-panel-entry',
    'data-dsh-surface',
    'data-dsh-part',
    'data-dsh-plugin',
    'data-slot',
    'data-chat-flow-kind',
    'data-conversation-scroll',
    'data-turn-tail',
    'data-composer-input',
    'data-queue-dock',
    'data-rightbar-col',
    'data-shell-overlay',
    'data-dsh-taskboard-view',
    'data-dsh-taskboard-board',
    'data-dsh-ssh-view',
    'data-dsh-pet-root',
    'data-gitgraph-chip-anchor',
    'data-gitgraph-dialog',
    'data-decoration',
    'data-streaming',
    'data-side',
    'data-phase',
];
// 'class' is deliberately absent: React sets className when it creates the
// element, so a row whose class matters already carries it when the childList
// record arrives, and class toggles are by far the most frequent attribute
// traffic on the page. The filter stays on identity anchors.
/**
 * Safety bound of the ancestor walk, NOT a depth ceiling.
 *
 * The walk's normal terminator is the observed root: every node the observer
 * can report is inside document.body, so the walk returns there (measured —
 * with this bound removed the walk still stops at body on every delivery).
 * This constant only fires for a change inside a subtree that is not connected
 * to the observed root at all, where there is no ancestor to anchor yet and
 * the node's own childList delivery stamps it once it IS attached.
 *
 * It is deliberately far above any real markup depth (the shell's own sidebar
 * row is three hops deep) instead of a small number that would silently leave
 * a deeper row unanchored — which is the very defect this walk exists to fix
 * (issue #1732). A measured sweep anchors through 23 wrapper levels and misses
 * from 24, i.e. only past the point where the tree is pathological.
 */
const ANCESTOR_HOPS = 24;
function createSemanticAdapter(doc) {
    const rules = exports.SEMANTIC_RULES_V1.map((rule) => ({ rule, usable: true, matchedInPass: 0 }));
    let observer = null;
    let stamped = 0;
    let running = false;
    const applyRule = (live, el) => {
        if (!live.usable)
            return;
        let hit = false;
        try {
            hit = el.matches(live.rule.selector);
        }
        catch {
            live.usable = false;
            return;
        }
        if (!hit)
            return;
        live.matchedInPass += 1;
        for (const [name, value] of live.rule.attrs) {
            if (el.getAttribute(name) !== value) {
                el.setAttribute(name, value);
                stamped += 1;
            }
        }
    };
    const applyToTree = (rootEl) => {
        for (const live of rules) {
            if (!live.usable)
                continue;
            applyRule(live, rootEl);
            let matches = [];
            try {
                matches = Array.from(rootEl.querySelectorAll(live.rule.selector));
            }
            catch {
                live.usable = false;
                continue;
            }
            for (const el of matches)
                applyRule(live, el);
        }
    };
    const fullPass = () => {
        for (const live of rules)
            live.matchedInPass = 0;
        if (doc.documentElement)
            applyToTree(doc.documentElement);
    };
    /**
     * Re-anchor one changed node and its ancestor chain.
     *
     * applyToTree only walks DOWNWARD: a rule whose selector matches an ancestor
     * of the changed node (the panel-list row is recognised by the glyph INSIDE
     * it) is never re-evaluated when that descendant arrives. React mounts the
     * row first and the registering plugin's glyph a tick later, so without this
     * the row keeps no anchor at all until something forces a full pass
     * (issue #1732). The walk is bounded and stops at the document root.
     */
    const reanchorAround = (node) => {
        const root = doc.body ?? doc.documentElement;
        let current = node;
        for (let hop = 0; current !== null && hop <= ANCESTOR_HOPS; hop += 1) {
            for (const live of rules) {
                if (live.usable)
                    applyRule(live, current);
            }
            // Stop at the observed root: going further cannot reach a node the
            // observer is even watching, and body is the ceiling it was given.
            if (current === root || current === doc.documentElement)
                return;
            current = current.parentElement;
        }
    };
    return {
        get running() {
            return running;
        },
        start() {
            if (running)
                return;
            running = true;
            fullPass();
            observer = new doc.defaultView.MutationObserver((records) => {
                try {
                    for (const record of records) {
                        for (const node of Array.from(record.addedNodes)) {
                            if (node.nodeType !== 1)
                                continue;
                            const el = node;
                            applyToTree(el);
                            // The added subtree may itself be the glyph a row wants; the row
                            // is an ANCESTOR of it and applyToTree never looks up (#1732).
                            reanchorAround(el.parentElement ?? el);
                        }
                        // A glyph whose ANCHOR is set on an element already in the tree
                        // (a re-render that flips the attribute instead of replacing the
                        // node) is the same signal, and childList alone never sees it.
                        const target = record.target.nodeType === 1 ? record.target : null;
                        if (target !== null && record.type === 'attributes')
                            reanchorAround(target);
                    }
                }
                catch {
                    // Fail-closed: a tagging error must never break the host page.
                }
            });
            observer.observe(doc.body ?? doc.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [...ANCHOR_ATTRIBUTES],
            });
        },
        stop() {
            running = false;
            observer?.disconnect();
            observer = null;
        },
        diagnostics() {
            return {
                invalidRules: rules.filter((r) => !r.usable).map((r) => r.rule.selector),
                unmatchedRules: rules.filter((r) => r.usable && r.matchedInPass === 0).map((r) => r.rule.selector),
                stamped,
            };
        },
    };
}

  },
  "packages/ui-skins/src/client/skin-engine/effect-ledger.ts": function (module, exports, require) {
"use strict";
/**
 * Effect ledger (issue #506, contract section 6).
 *
 * Every runtime effect a skin activation creates — style tags, CSS variable
 * overrides, decoration-layer content, listeners, hook cleanups — is recorded
 * here as an append-only entry bound to its activation identity. Switching
 * skins releases the old activation's entries in reverse order; disposal is
 * idempotent and may run 0, 1 or N times.
 *
 * lifecycleScope split:
 *  - "activation": everything injectable — released on every skin switch;
 *  - "component": skin static assets and the user's selection — survive
 *    switches, reloads and HMR. The ledger only tracks activation scope.
 *
 * Pure logic, no DOM types required (entries are opaque teardown closures).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEffectLedger = createEffectLedger;
function createEffectLedger(now = () => Date.now()) {
    let seq = 0;
    let nextActivation = 1;
    const log = [];
    const live = new Map();
    const disposed = new Set();
    function push(activationId, kind, label, replacesSeq) {
        seq += 1;
        log.push({ seq, activationId, kind, label, replacesSeq, at: now() });
        return seq;
    }
    function release(effect, activationId) {
        if (effect.released)
            return;
        effect.released = true;
        push(activationId, 'release', effect.label);
        try {
            effect.teardown();
        }
        catch {
            // A failing teardown must never block the remaining cleanup; the
            // failure itself is a ledger fact for diagnostics.
            push(activationId, 'cleanup-failed', effect.label);
        }
    }
    return {
        beginActivation() {
            const id = nextActivation++;
            live.set(id, []);
            push(id, 'create', 'activation');
            return id;
        },
        record(activationId, label, teardown) {
            const bucket = live.get(activationId);
            if (!bucket || disposed.has(activationId)) {
                throw new Error(`effect "${label}" recorded on disposed/unknown activation ${activationId}`);
            }
            const entrySeq = push(activationId, 'create', label);
            bucket.push({ seq: entrySeq, label, teardown, released: false });
            return entrySeq;
        },
        replace(activationId, label, previousSeq, teardown) {
            const bucket = live.get(activationId);
            if (!bucket || disposed.has(activationId)) {
                throw new Error(`effect "${label}" replaced on disposed/unknown activation ${activationId}`);
            }
            if (previousSeq !== undefined) {
                const previous = bucket.find((e) => e.seq === previousSeq);
                if (previous)
                    release(previous, activationId);
            }
            const entrySeq = push(activationId, 'replace', label, previousSeq);
            bucket.push({ seq: entrySeq, label, teardown, released: false });
            return entrySeq;
        },
        disposeActivation(activationId) {
            if (disposed.has(activationId))
                return;
            disposed.add(activationId);
            const bucket = live.get(activationId) ?? [];
            for (const effect of [...bucket].reverse())
                release(effect, activationId);
        },
        isDisposed(activationId) {
            return disposed.has(activationId);
        },
        entries() {
            return log;
        },
    };
}

  },
  "packages/ui-skins/src/client/dispatcher.ts": function (module, exports, require) {
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
  "packages/ui-skins/src/client/theme.ts": function (module, exports, require) {
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
  "packages/ui-skins/src/client/registry.ts": function (module, exports, require) {
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
  "packages/ui-skins/src/client/picker.ts": function (module, exports, require) {
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
  "packages/ui-skins/src/client/observer.ts": function (module, exports, require) {
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
var __entry = __modules["src/client-combined.ts"];
if (__entry === undefined) throw new Error('client bundle: missing entry');
__entry(module, exports, function (sub) { return __require("src/client-combined.ts", sub); });
return module.exports; } });
