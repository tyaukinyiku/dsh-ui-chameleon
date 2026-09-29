/**
 * 外部 web-ui 皮肤单元适配器：skin.json → UiPackDescriptor。
 *
 * 安全边界：只把外部单元当**数据**读（skin.json / CSS / 预览图），不执行外部代码；
 * 需要执行的部分（功能插件）由 dsh 自己的 loader 按用户显式安装加载。
 *
 * CSS 资产优先级：entry.cssFiles 显式 > 单元内 *.css 发现 > lib/client.js 启发式提取。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, resolve, sep } from 'node:path'
import type { ExternalPackEntry, UiPackDescriptor } from './types.ts'

export interface ExternalPackAdapted {
  pack: UiPackDescriptor
  /** 皮肤单元根目录。 */
  root: string
  /** 资产白名单：rel（URL 路径） -> 绝对路径（asset 路由按此服务，防越界）。 */
  assets: Map<string, string>
  warnings: string[]
  /** false = 未成功适配（来源缺失/拉取失败），不注册 pack 仅留诊断。 */
  ok: boolean
  /** 官方 hooks 契约模块文本（动态装饰/美术层），由传输面 /external/<id>/hooks 提供。 */
  hooks?: string
}

export const EXTERNAL_ROUTE_PREFIX = '/ui-skins/external'

/** 从给定起点向上找 node_modules 目录（包名解析锚点）。 */
export function findNodeModules(start: string): string | null {
  let dir = start
  for (let i = 0; i < 10; i++) {
    const cand = join(dir, 'node_modules')
    if (existsSync(cand) && statSync(cand).isDirectory()) return cand
    const parent = resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return null
}

/** 解析外部单元根目录：路径直用；包名在若干 node_modules 锚点里找。 */
export function resolveExternalRoot(source: string, searchFrom: string[] = []): string | null {
  if (source.startsWith('/') || source.startsWith('.')) {
    const abs = resolve(source)
    return existsSync(abs) && statSync(abs).isDirectory() ? abs : null
  }
  const anchors = new Set<string>()
  for (const from of searchFrom) {
    const nm = findNodeModules(from)
    if (nm) anchors.add(nm)
  }
  for (const nm of anchors) {
    const abs = join(nm, ...source.split('/'))
    if (existsSync(abs) && statSync(abs).isDirectory()) return abs
  }
  return null
}

function readJson(file: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

/** 启发式：从 JS bundle 的字符串字面量里提取 CSS 文本（css-modules 注入产物）。
 *  三种引号**独立扫描**（单一交替正则会被短字符串里的异种引号吞掉后续大字面量）。 */
export function extractCssFromBundle(js: string): string {
  const out: string[] = []
  const seen = new Set<string>()
  const patterns = [
    { re: /"((?:[^"\\\n]|\\.){30,})"/g, json: true },
    { re: /'((?:[^'\\\n]|\\.){30,})'/g, json: false },
    { re: /`((?:[^`\\]|\\.){30,})`/g, json: false },
  ]
  for (const { re, json } of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(js)) !== null) {
      const raw = m[1]
      if (!raw) continue
      let s: string
      if (json) {
        try {
          s = JSON.parse(`"${raw}"`) as string
        } catch {
          continue
        }
      } else {
        s = raw.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\`/g, '`').replace(/\\\\/g, '\\')
      }
      if (!looksLikeCss(s) || seen.has(s)) continue
      seen.add(s)
      out.push(sanitizeCssChunk(s))
    }
  }
  return out.join('\n')
}


/** 逐段净化：配平引号/圆括号/花括号——残缺碎片会毒化整表 CSS 解析（规则被解析器丢弃）。 */
function sanitizeCssChunk(s: string): string {
  let braces = 0
  let parens = 0
  let inStr = ''
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i]
    if (inStr) {
      if (c === '\\') i += 1
      else if (c === inStr) inStr = ''
      continue
    }
    if (c === '"' || c === "'") inStr = c
    else if (c === '{') braces += 1
    else if (c === '}') braces = Math.max(0, braces - 1)
    else if (c === '(') parens += 1
    else if (c === ')') parens = Math.max(0, parens - 1)
  }
  let tail = ''
  if (inStr) tail += inStr
  if (parens > 0 && parens <= 5) tail += ')'.repeat(parens)
  if (braces > 0 && braces <= 5) tail += '}'.repeat(braces)
  return tail ? s + '\n' + tail : s
}

function looksLikeCss(s: string): boolean {
  // 排除 JS / GLSL 等同形文本（注意 CSS 合法含 @import，不能用裸 `import ` 排除）
  if (/=>|require\(|\bfunction\s*\(|\bimport\s*[{*'"`]|#version|void\s+main|gl_Position|uniform\s|precision\s+highp/.test(s)) {
    return false
  }
  return s.includes('{') && s.includes('}') && /\{[^{}]*[:;][^{}]*\}/.test(s) && /[.#\[*:a-zA-Z]|--|@media|:root/.test(s)
}

function walkCss(dir: string, depth: number, out: string[]): void {
  if (depth <= 0) return
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const abs = join(dir, name)
    const st = statSync(abs)
    if (st.isDirectory()) walkCss(abs, depth - 1, out)
    else if (extname(name).toLowerCase() === '.css') out.push(abs)
  }
}


/** 递归登记资产白名单（rel -> abs），供 asset 路由服务。 */
function walkAssetFiles(dir: string, root: string, assets: Map<string, string>, depth: number): void {
  if (depth <= 0 || !existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    if (statSync(abs).isDirectory()) walkAssetFiles(abs, root, assets, depth - 1)
    else assets.set(abs.slice(root.length + 1).split(sep).join('/'), abs)
  }
}

/** 把一个外部皮肤单元适配为 UiPackDescriptor。 */
export function adaptExternalPack(root: string, entry: ExternalPackEntry): ExternalPackAdapted {
  const warnings: string[] = []
  const assets = new Map<string, string>()
  const skin = readJson(join(root, 'skin.json')) ?? {}
  if (!existsSync(join(root, 'skin.json'))) warnings.push('skin.json 缺失，仅按目录启发式适配')

  const skinId = typeof skin.id === 'string' && skin.id ? skin.id : basename(root)
  const id = entry.id || `ext-${skinId}`

  const pack: UiPackDescriptor = {
    id,
    title: typeof skin.name === 'string' && skin.name ? skin.name : skinId,
    description: [skin.tagline, skin.description]
      .filter((v): v is string => typeof v === 'string' && !!v)
      .join(' '),
  }
  if (typeof skin.accent === 'string' && skin.accent) {
    pack.baseTokens = { '--ui-accent': skin.accent }
  }
  if (typeof skin.bodyAttr === 'string' && skin.bodyAttr) pack.bodyAttr = skin.bodyAttr

  // 预览图 → /ui-skins/external/<id>/asset/<rel>（登记白名单）
  const preview = skin.preview as { light?: unknown; dark?: unknown } | undefined
  if (preview && typeof preview === 'object') {
    const mapped: { light?: string; dark?: string } = {}
    for (const variant of ['light', 'dark'] as const) {
      const rel = preview[variant]
      if (typeof rel !== 'string' || !rel) continue
      const relNorm = rel.replace(/^\.?\//, '')
      const abs = resolve(root, relNorm)
      if (abs.startsWith(root + sep) && existsSync(abs)) {
        assets.set(relNorm, abs)
        mapped[variant] = `${EXTERNAL_ROUTE_PREFIX}/${id}/asset/${relNorm}`
      } else {
        warnings.push(`预览图缺失: ${relNorm}`)
      }
    }
    if (mapped.light || mapped.dark) pack.preview = mapped
  }

  // v2 资产布局（市场下载落盘形态 $DSH_HOME/skins/<id>/）：stylesheet + patches + assets/**
  const v2Style = join(root, 'stylesheet')
  const v2Patches = join(root, 'patches')
  if (existsSync(v2Style) || existsSync(v2Patches)) {
    const parts: string[] = []
    for (const f of [v2Style, v2Patches]) {
      if (!existsSync(f)) continue
      const text = readFileSync(f, 'utf8')
      // 与市场源一致：:root 锚定到 pack 激活属性赢下官方 token 层叠
      parts.push(rewriteCssUrls(text.replaceAll(':root', `html[data-ui-pack="${id}"]`), `${EXTERNAL_ROUTE_PREFIX}/${id}/asset`))
    }
    if (parts.length > 0) {
      pack.baseCss = parts.join('\n')
      // v2 作用域在样式表内嵌（html[data-dsh-skin="<id>"]），以 CSS 为准提取激活标记
      const scope = parts.join('\n').match(/data-dsh-skin="([^"]+)"/)
      pack.bodyAttr = `data-dsh-skin=${scope ? scope[1] : skinId}`
      walkAssetFiles(join(root, 'assets'), root, assets, 4)
      pack.external = {
        kind: 'external-skin',
        source: entry.source,
        originalId: skinId,
        package: typeof skin.package === 'string' ? skin.package : undefined,
        cssOrigin: 'v2',
      }
      pack.hooksUrl = `${EXTERNAL_ROUTE_PREFIX}/${id}/hooks`
      pack.assetBase = `${EXTERNAL_ROUTE_PREFIX}/${id}/asset`
      const hooksFile = join(root, 'hooks.mjs')
      const hooks = existsSync(hooksFile) ? readFileSync(hooksFile, 'utf8') : undefined
      return { pack, root, assets, warnings, ok: true, hooks }
    }
  }

  // CSS 资产：显式 > 发现 > 提取
  const cssFiles: string[] = []
  let cssOrigin: 'files' | 'discover' | 'extract' | 'none' = 'none'
  if (entry.cssFiles && entry.cssFiles.length > 0) {
    cssOrigin = 'files'
    for (const rel of entry.cssFiles) {
      const relNorm = rel.replace(/^\.?\//, '')
      const abs = resolve(root, relNorm)
      if (abs.startsWith(root + sep) && existsSync(abs)) {
        cssFiles.push(abs)
        assets.set(relNorm, abs)
      } else warnings.push(`cssFiles 缺失: ${relNorm}`)
    }
  } else {
    walkCss(root, 3, cssFiles)
    if (cssFiles.length > 0) cssOrigin = 'discover'
  }
  let cssText = ''
  if (cssFiles.length > 0) {
    cssText = cssFiles.map((f) => readFileSync(f, 'utf8')).join('\n')
  } else {
    for (const cand of ['lib/client.js', 'client.js', 'dist/client.js', 'lib/client.mjs']) {
      const abs = join(root, cand)
      if (!existsSync(abs)) continue
      const extracted = extractCssFromBundle(readFileSync(abs, 'utf8'))
      if (extracted.trim()) {
        cssText = extracted
        cssOrigin = 'extract'
        break
      }
    }
  }
  if (cssOrigin === 'none') warnings.push('未找到 CSS 资产（可配 cssFiles 显式声明）')
  if (cssText.trim()) {
    // v1/提取路径同样要重写 url() 到资产路由（否则相对路径在文档根 404）
    pack.baseCss = rewriteCssUrls(cssText, `${EXTERNAL_ROUTE_PREFIX}/${id}/asset`)
  }
  walkAssetFiles(join(root, 'assets'), root, assets, 4)

  const pkgName = readJson(join(root, 'package.json'))?.name
  pack.external = {
    kind: 'external-skin',
    source: entry.source,
    originalId: skinId,
    package: typeof pkgName === 'string' ? pkgName : typeof skin.package === 'string' ? skin.package : undefined,
    cssOrigin,
  }
  return { pack, root, assets, warnings, ok: true }
}


// ---------------------------------------------------------------------------
// dsh-market.com 市场源（x-org.linxin666.skin-center/v1alpha1 v2 资产契约）
//   GET /api/skin-center/v2/skins/{id}/stylesheet | patches   → CSS 文本
//   作用域 html[data-dsh-skin="<id>"]（loader-owned，由 bodyAttr 激活机制设置）
//   hooks.mjs 为动态装饰（JS）——安全边界内不执行；assets/* 需运行时联网。
// ---------------------------------------------------------------------------

export const MARKET_ASSET_BASE = 'https://dsh-market.com/api/skin-center/v2/skins'

/** 解析市场来源：`market:<skinId>` 或 dsh-market.com URL（/skins/<id>、?skin=<id>）。 */
export function marketSkinId(source: string): string | null {
  if (source.startsWith('market:')) return source.slice('market:'.length) || null
  if (!/^https?:\/\/(www\.)?dsh-market\.com\//.test(source)) return null
  try {
    const url = new URL(source)
    const q = url.searchParams.get('skin')
    if (q) return q
    const m = url.pathname.match(/\/skins\/([^/]+)/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

/** 把 CSS 里相对 url(...) 重写为市场资产绝对地址（市场管线不重写相对路径）。 */
export function rewriteCssUrls(css: string, assetBase: string): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (match, quote, u) => {
    const target = String(u)
    if (/^(data:|https?:|\/\/|#)/.test(target)) return match
    return `url(${quote}${assetBase.replace(/\/$/, '')}/${target.replace(/^\.\//, '')}${quote})`
  })
}

/** 市场皮肤 → UiPackDescriptor（样式层适配；bodyAttr 形如 `data-dsh-skin=<id>`）。 */
export async function adaptMarketSkin(skinId: string, entry: ExternalPackEntry): Promise<ExternalPackAdapted> {
  const warnings: string[] = []
  const id = entry.id || `ext-${skinId}`
  const assetBase = `${MARKET_ASSET_BASE}/${encodeURIComponent(skinId)}`
  const cssParts: string[] = []
  let cssOrigin: 'market' | 'none' = 'none'
  for (const asset of ['stylesheet', 'patches']) {
    try {
      const res = await fetch(`${assetBase}/${asset}`)
      if (!res.ok) {
        warnings.push(`市场资产 ${asset} 拉取失败: HTTP ${res.status}`)
        continue
      }
      const text = await res.text()
      if (text.trim()) {
        // `:root`(0,1,0) 会被 dsh 官方同名 token 的后注入定义压过——市场皮肤多为
        // 官方 token 重映射，必须以更高特异度(0,1,1)锚定在 pack 激活属性上才能赢下层叠。
        const scoped = text.replaceAll(':root', `html[data-ui-pack="${id}"]`)
        cssParts.push(rewriteCssUrls(scoped, assetBase))
        cssOrigin = 'market'
      }
    } catch (error) {
      warnings.push(`市场资产 ${asset} 拉取异常: ${String(error)}`)
    }
  }
  const pack: UiPackDescriptor = {
    id,
    title: entry.title || skinId,
    description: entry.description || `dsh-market.com 市场皮肤（${skinId}）`,
    bodyAttr: `data-dsh-skin=${skinId}`,
    hooksUrl: `${EXTERNAL_ROUTE_PREFIX}/${id}/hooks`,
    assetBase,
  }
  let hooks: string | undefined
  try {
    const res = await fetch(`${assetBase}/hooks.mjs`)
    if (res.ok) {
      const text = await res.text()
      if (text.trim()) hooks = text
    }
  } catch {
    /* 无 hooks（纯 CSS 皮肤）属正常 */
  }
  if (cssParts.length > 0) pack.baseCss = cssParts.join('\n')
  pack.external = { kind: 'external-skin', source: entry.source, originalId: skinId, cssOrigin }
  return { pack, root: `market:${skinId}`, assets: new Map(), warnings, ok: true, hooks }
}

/** 顶层调度器：市场源 / 本地单元（包名或路径）统一入口。 */
export async function adaptExternalSource(
  entry: ExternalPackEntry,
  searchFrom: string[] = [],
): Promise<ExternalPackAdapted> {
  const skinId = marketSkinId(entry.source)
  if (skinId) return adaptMarketSkin(skinId, entry)
  const root = resolveExternalRoot(entry.source, searchFrom)
  if (!root) {
    return {
      pack: {
        id: `ext-missing-${Date.now()}`,
        title: entry.title || entry.source,
        external: { kind: 'external-skin', source: entry.source, originalId: '', cssOrigin: 'none' },
      },
      root: '',
      assets: new Map(),
      warnings: [`无法解析外部单元: ${entry.source}（包名需已安装在 profile node_modules，或用目录路径 / market:<skinId>）`],
      ok: false,
    }
  }
  return { ...adaptExternalPack(root, entry), ok: true }
}


// ---------------------------------------------------------------------------
// 无感发现：市场下载目录（$DSH_HOME/skins/<id>/）与 profile node_modules 皮肤包
// ---------------------------------------------------------------------------

/** 展开 `~` 前缀。 */
export function expandHome(path: string): string {
  return path.startsWith('~') ? join(process.env.HOME ?? '', path.slice(1)) : path
}

/** 扫描一个目录下的皮肤单元（子目录含 skin.json 或 v2 stylesheet/patches）。 */
export function scanSkinUnits(dir: string): string[] {
  const out: string[] = []
  const base = expandHome(dir)
  if (!existsSync(base) || !statSync(base).isDirectory()) return out
  for (const name of readdirSync(base)) {
    const abs = join(base, name)
    if (!statSync(abs).isDirectory()) continue
    if (existsSync(join(abs, 'skin.json')) || existsSync(join(abs, 'stylesheet')) || existsSync(join(abs, 'patches'))) {
      out.push(abs)
    }
  }
  return out
}

/** 扫描 node_modules 顶层（含 @scope）里的皮肤包（dsh plugin add 安装的皮肤）。 */
export function scanNodeModulesSkins(nodeModulesDir: string): string[] {
  const out: string[] = []
  if (!existsSync(nodeModulesDir)) return out
  for (const name of readdirSync(nodeModulesDir)) {
    if (name === '.bin' || name === '.pnpm' || name.startsWith('.')) continue
    const abs = join(nodeModulesDir, name)
    if (!statSync(abs).isDirectory()) continue
    if (name.startsWith('@')) {
      for (const sub of readdirSync(abs)) {
        const subAbs = join(abs, sub)
        if (statSync(subAbs).isDirectory() && existsSync(join(subAbs, 'skin.json'))) out.push(subAbs)
      }
    } else if (existsSync(join(abs, 'skin.json'))) {
      out.push(abs)
    }
  }
  return out
}
