#!/usr/bin/env node
/**
 * build-client.mjs —— 把每个包的浏览器半打成 dsh client bundle。
 *
 * 产物格式（对齐 @deepseek-ai/dsh-client-tsdown.client 的输出契约）：
 *   window.__ModuleLoader__.load({ id: "<package name>", factory: (require) => {
 *   var module = { exports: {} }; var exports = module.exports;
 *   …CJS bundle body（平台模块经 require("<specifier>") 取用）…
 *   return module.exports; } });
 *
 * 实现：typescript.transpileModule 逐模块转 CJS，手写迷你 CommonJS 装配器合并
 * 相对导入；'.' 开头的相对导入走内部表，其余交给 loader 的 require
 * （平台 seed：react、@deepseek-ai/cordis 等 PLATFORM_MODULES）。
 *
 * 用法：node scripts/build-client.mjs [--all | <package-dir>...]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require_ = createRequire(import.meta.url)
const ts = require_('typescript')

const ROOT = dirname(fileURLToPath(import.meta.url))
const PACKAGES = join(ROOT, '..', 'packages')

/** 平台 seed 模块（= dsh 的 PLATFORM_MODULES 中我们实际会 require 的子集）。 */
const PLATFORM = new Set(['react', 'react/jsx-runtime', 'react-dom', '@deepseek-ai/cordis'])

function listTargets() {
  return readdirSync(PACKAGES, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(PACKAGES, entry.name))
    .filter((dir) => existsSync(join(dir, 'package.json')))
}

function findEntry(pkgDir) {
  for (const candidate of ['src/client-combined.ts', 'src/client/index.ts', 'src/client.ts']) {
    if (existsSync(join(pkgDir, candidate))) return candidate
  }
  return null
}

function transpile(file) {
  const source = readFileSync(file, 'utf8')
  const output = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      importHelpers: false,
    },
  })
  return output.outputText
}

/** 从转译后的 CJS 里收集相对 require("./x.ts") 依赖。 */
function localDeps(code) {
  const deps = []
  for (const match of code.matchAll(/require\((["'])(\.{1,2}\/[^"']+)\1\)/g)) deps.push(match[2])
  return deps
}

function normalizeKey(fromDir, spec) {
  const resolved = normalize(join(fromDir, spec))
  return resolved.replace(/\\/g, '/')
}

function buildPackage(pkgDir) {
  const manifest = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
  const entry = findEntry(pkgDir)
  if (!entry) return false

  const modules = new Map() // key -> { code }
  const queue = [entry]
  while (queue.length > 0) {
    const key = queue.pop()
    if (modules.has(key)) continue
    const file = join(pkgDir, key)
    const code = transpile(file)
    modules.set(key, code)
    const dir = dirname(key)
    for (const dep of localDeps(code)) {
      queue.push(normalizeKey(dir === '.' ? '' : dir, dep))
    }
  }

  const body = [...modules.entries()]
    .map(([key, code]) => `  ${JSON.stringify(key)}: function (module, exports, require) {\n${code}\n  }`)
    .join(',\n')

  const bundle = `window.__ModuleLoader__.load({ id: ${JSON.stringify(manifest.name)}, factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var __modules = {
${body}
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
var __entry = __modules[${JSON.stringify(entry)}];
if (__entry === undefined) throw new Error('client bundle: missing entry');
__entry(module, exports, function (sub) { return __require(${JSON.stringify(entry)}, sub); });
return module.exports; } });
`

  mkdirSync(join(pkgDir, 'lib'), { recursive: true })
  writeFileSync(join(pkgDir, 'lib', 'client.js'), bundle)
  console.log(`built ${manifest.name} -> lib/client.js (${modules.size} modules)`)
  return true
}

const args = process.argv.slice(2)
const targets = args.length === 0 || args[0] === '--all' ? [...listTargets(), join(ROOT, '..')] : args
let built = 0
for (const target of targets) {
  if (buildPackage(target)) built += 1
}
if (built === 0) {
  console.error('build-client: 没有可构建的包（需要 src/client/index.ts 或 src/client.ts）')
  process.exit(1)
}
