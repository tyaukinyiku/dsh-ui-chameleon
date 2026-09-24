window.__ModuleLoader__.load({ id: "dsh-ui-pack-example", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var __modules = {
  "src/client.ts": function (module, exports, require) {
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
