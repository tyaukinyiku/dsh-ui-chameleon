#!/usr/bin/env node
/**
 * link-dsh-deps.mjs —— 为本仓库的插件包补齐运行时依赖解析。
 *
 * 树外插件运行时会 import 少量 dsh 框架包（@deepseek-ai/cordis、
 * @deepseek-ai/schemastery、@deepseek-ai/dsh-storage-domain、zod）。
 * 这些包不在 npm registry 上，而是 dsh 仓库的工作区包；这里把它们以符号链接
 * 接入本仓库 node_modules（等价于 pnpm 的 workspace 链接），目标包自身的依赖
 * 由 dsh 侧的 pnpm install 解析。
 *
 * 用法：node scripts/link-dsh-deps.mjs [dsh-checkout 路径]（默认 ../dsh）
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, symlinkSync, unlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DSH = resolve(process.argv[2] ?? join(ROOT, '..', 'dsh'))

if (!existsSync(join(DSH, 'package.json'))) {
  console.error(`link-dsh-deps: 找不到 dsh 仓库：${DSH}`)
  process.exit(1)
}

/** 需要链接的运行时依赖 -> dsh 仓库内位置（相对 dsh 根）。 */
const LINKS = {
  '@deepseek-ai/cordis': 'vendor/cordis',
  '@deepseek-ai/schemastery': 'vendor/schemastery',
  '@deepseek-ai/dsh-storage': 'packages/storage/storage',
  '@deepseek-ai/dsh-storage-domain': 'packages/storage/storage-domain',
}

const nodeModules = join(ROOT, 'node_modules')
mkdirSync(nodeModules, { recursive: true })

function link(name, target) {
  const linkPath = join(nodeModules, ...name.split('/'))
  mkdirSync(dirname(linkPath), { recursive: true })
  if (existsSync(linkPath) || isSymlink(linkPath)) {
    try {
      unlinkSync(linkPath)
    } catch {
      /* 已存在且不可移除时保留 */
    }
  }
  if (!existsSync(target)) {
    console.warn(`link-dsh-deps: 跳过 ${name}（目标不存在：${target}）`)
    return
  }
  symlinkSync(target, linkPath, 'dir')
  console.log(`linked ${name} -> ${target}`)
}

function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink()
  } catch {
    return false
  }
}

for (const [name, target] of Object.entries(LINKS)) link(name, join(DSH, target))

// zod 是 dsh-storage-domain 的依赖：从其 pnpm 侧借道链接。
const zodCandidates = [
  join(DSH, 'packages/storage/storage-domain/node_modules/zod'),
  ...safeReaddir(join(DSH, 'node_modules/.pnpm'))
    .filter((entry) => entry.startsWith('zod@'))
    .map((entry) => join(DSH, 'node_modules/.pnpm', entry, 'node_modules/zod')),
]
const zod = zodCandidates.find((candidate) => existsSync(join(candidate, 'package.json')))
if (zod) {
  const version = JSON.parse(readFileSync(join(zod, 'package.json'), 'utf8')).version
  link('zod', zod)
  console.log(`zod version: ${version}`)
} else {
  console.warn('link-dsh-deps: 未找到 zod（先在 dsh 里跑 pnpm install）')
}

function safeReaddir(path) {
  try {
    return readdirSync(path)
  } catch {
    return []
  }
}
