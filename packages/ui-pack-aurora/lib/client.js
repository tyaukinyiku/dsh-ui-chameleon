window.__ModuleLoader__.load({ id: "dsh-ui-pack-aurora", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var __modules = {
  "src/client.ts": function (module, exports, require) {
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
