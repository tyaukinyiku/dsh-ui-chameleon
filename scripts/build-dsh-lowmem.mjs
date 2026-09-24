#!/usr/bin/env node
/**
 * build-dsh-lowmem.mjs —— 低内存环境（≤4GiB cgroup）下构建 dsh 产物。
 *
 * dsh 官方 build:lib 用单进程 `tsc -b tsconfig.{host,client}.json` 一次编译 267 个项目，
 * 堆需求超过 3GiB，在 4GiB 容器里会被 OOM kill。这里改为**逐项目独立进程**：
 * 增量缓存（tsbuildinfo）沿用，单进程内存峰值按单项目封顶。
 *
 * 用法：node scripts/build-dsh-lowmem.mjs <dsh-root> [host|client|web|all]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const DSH = resolve(process.argv[2] ?? '../dsh')
const FACE = process.argv[3] ?? 'all'
const HEAP = process.env.DSH_TSC_HEAP ?? '2500'

function readRefs(tsconfig) {
  const text = readFileSync(join(DSH, tsconfig), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  const config = JSON.parse(text)
  return (config.references ?? []).map((ref) => ref.path)
}

function run(command, args, label) {
  const started = Date.now()
  execFileSync(command, args, { cwd: DSH, stdio: ['ignore', 'inherit', 'inherit'] })
  console.log(`[lowmem] ${label} 完成（${((Date.now() - started) / 1000).toFixed(1)}s）`)
}

function tscFace(tsconfig, face) {
  const refs = readRefs(tsconfig)
  console.log(`[lowmem] ${face}: ${refs.length} 个项目，逐项目构建（heap ${HEAP}MB）`)
  let index = 0
  for (const ref of refs) {
    index += 1
    const started = Date.now()
    try {
      execFileSync(
        process.execPath,
        [`--max-old-space-size=${HEAP}`, './node_modules/typescript/bin/tsc', '-b', ref],
        { cwd: DSH, stdio: ['ignore', 'ignore', 'pipe'] },
      )
      console.log(`[lowmem] ${face} ${index}/${refs.length} ok ${ref}（${((Date.now() - started) / 1000).toFixed(1)}s）`)
    } catch (error) {
      console.error(`[lowmem] ${face} ${index}/${refs.length} FAILED ${ref}`)
      console.error(String(error.stderr ?? error))
      process.exit(1)
    }
  }
  // 顶层聚合 tsc 会单进程加载全部项目，在 ≤4GiB 环境必 OOM；逐项目产出已完整，可跳过。
  if (process.env.DSH_AGGREGATE === '1') {
    run(process.execPath, [`--max-old-space-size=${HEAP}`, './node_modules/typescript/bin/tsc', '-b', tsconfig], `${face} 聚合`)
  }
  run('./node_modules/.bin/tsdown', [`--env.DSH_BUILD_FACE`, face], `tsdown ${face}`)
}

if (FACE === 'host' || FACE === 'all') tscFace('tsconfig.host.json', 'host')
if (FACE === 'client' || FACE === 'all') tscFace('tsconfig.client.json', 'client')
if (FACE === 'web' || FACE === 'all') {
  run('./node_modules/.bin/pnpm', ['--filter', '@deepseek-ai/dsh-web-frontend', 'run', 'build'], 'web 前端')
}
console.log('[lowmem] 全部完成')
