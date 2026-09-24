window.__ModuleLoader__.load({ id: "dsh-ui-pack-default", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var __modules = {
  "src/client.ts": function (module, exports, require) {
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
var __entry = __modules["src/client.ts"];
if (__entry === undefined) throw new Error('client bundle: missing entry');
__entry(module, exports, function (sub) { return __require("src/client.ts", sub); });
return module.exports; } });
