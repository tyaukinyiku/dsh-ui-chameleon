window.__ModuleLoader__.load({ id: "dsh-ui-pack-manuscript", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var __modules = {
  "src/client.ts": function (module, exports, require) {
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
