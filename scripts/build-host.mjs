#!/usr/bin/env node
/**
 * build-host.mjs —— 把各包 host 半（src/**，排除 src/client）转译到 lib-host/，
 * 供 git 安装后以**构建产物**加载（安装态没有 tsx，TS 源码无法被 loader 加载）。
 *
 * 形态：ESM 逐文件转译 + 相对导入说明符 `./x.ts` → `./x.js` 改写；
 * 裸导入（react / zod / @deepseek-ai/*）原样保留——@deepseek-ai/* 仅出现在
 * `import type`（转译即擦除），运行时零框架依赖。
 *
 * 用法：node scripts/build-host.mjs [--all | <package-dir>...]
 */
import { mkdirSync, readFileSync, readdirSync, existsSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require_ = createRequire(import.meta.url)
const ts = require_('typescript')

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGES = join(ROOT, 'packages')

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) out.push(full)
  }
  return out
}

function buildPackage(pkgDir) {
  const srcDir = join(pkgDir, 'src')
  if (!existsSync(srcDir)) return false
  const files = walk(srcDir).filter((f) => !f.includes('src/client') && !f.endsWith('client-combined.ts'))
  if (files.length === 0) return false
  for (const file of files) {
    const rel = relative(srcDir, file)
    const out = join(pkgDir, 'lib-host', rel.replace(/\.ts$/, '.js'))
    mkdirSync(dirname(out), { recursive: true })
    const source = readFileSync(file, 'utf8')
    let code = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: true, // 只保留真实值导入（import type 全部擦除）
        importHelpers: false,
      },
    }).outputText
    // 相对导入说明符改写：./x.ts → ./x.js（含 type 前缀残留的兜底）
    code = code.replace(/(from\s+['"])(\.{1,2}\/[^'"]+)\.ts(['"])/g, '$1$2.js$3')
    writeFileSync(out, code)
  }
  console.log(`built host ${relative(ROOT, pkgDir)} -> lib-host (${files.length} modules)`)
  return true
}

const args = process.argv.slice(2)
const targets = args.length === 0 || args[0] === '--all'
  ? [
      ...readdirSync(PACKAGES, { withFileTypes: true })
        .filter((e) => e.isDirectory() && statSync(join(PACKAGES, e.name)).isDirectory())
        .map((e) => join(PACKAGES, e.name)),
      ROOT, // 聚合入口（安装态唯一插件面）最后构建，依赖各包 lib-host
    ]
  : args
let built = 0
for (const target of targets) if (buildPackage(target)) built += 1
if (built === 0) {
  console.error('build-host: 没有可构建的包')
  process.exit(1)
}
