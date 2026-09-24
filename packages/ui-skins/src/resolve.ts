/**
 * 三级解析（纯函数：无 I/O、无框架依赖，Node 与浏览器共用）。
 *
 *   会话层（session） > 工作区层（workspace） > dsh 层
 *
 * 合并语义（各字段一致）：
 *   键缺席        = 继承下层
 *   显式 null     = 清除（阻断继承，回到 pack 默认 / 空）
 *   具体值        = 覆盖
 */
import type {
  Level,
  UiComponentRef,
  UiLayerConfig,
  UiLayout,
  UiPackDescriptor,
  UiProvenance,
  UiSpec,
  UiTheme,
} from './types.ts'

/** 层级顺序：低 → 高。 */
export const LEVELS_LOW_TO_HIGH: readonly Level[] = ['dsh', 'workspace', 'session']

const SCALAR_FIELDS = ['pack', 'theme', 'layout', 'css'] as const
const LAYER_KEYS = new Set<string>([...SCALAR_FIELDS, 'tokens', 'components'])

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function describeType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

export interface NormalizeResult {
  config: UiLayerConfig
  errors: string[]
}

function normalizeComponentRef(input: unknown, where: string, errors: string[]): UiComponentRef | undefined {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    errors.push(`${where}: 期望 { pack, name } 对象，得到 ${describeType(input)}`)
    return undefined
  }
  const raw = input as Record<string, unknown>
  const pack = raw.pack
  const name = raw.name
  if (typeof pack !== 'string' || !pack) errors.push(`${where}.pack: 期望非空 string`)
  if (typeof name !== 'string' || !name) errors.push(`${where}.name: 期望非空 string`)
  const ref: UiComponentRef = {
    pack: typeof pack === 'string' ? pack : '',
    name: typeof name === 'string' ? name : '',
  }
  if (raw.key !== undefined) {
    if (typeof raw.key === 'string') ref.key = raw.key
    else errors.push(`${where}.key: 期望 string`)
  }
  if (raw.id !== undefined) {
    if (typeof raw.id === 'string') ref.id = raw.id
    else errors.push(`${where}.id: 期望 string`)
  }
  if (raw.order !== undefined) {
    if (typeof raw.order === 'number' && Number.isFinite(raw.order)) ref.order = raw.order
    else errors.push(`${where}.order: 期望 number`)
  }
  if (raw.priority !== undefined) {
    if (typeof raw.priority === 'number' && Number.isFinite(raw.priority)) ref.priority = raw.priority
    else errors.push(`${where}.priority: 期望 number`)
  }
  for (const key of Object.keys(raw)) {
    if (!['pack', 'name', 'key', 'id', 'order', 'priority'].includes(key)) {
      errors.push(`${where}: 未知字段 ${key}`)
    }
  }
  return ref
}

/**
 * 校验并规范化一层配置。写路径把 errors 视为拒绝理由（配置错误要响亮）；
 * 读路径把 errors 并入 UiSpec.warnings 后继续（读路径优雅降级）。
 */
export function normalizeLayerConfig(input: unknown, where = 'layer'): NormalizeResult {
  const errors: string[] = []
  const config: UiLayerConfig = {}
  if (input === undefined) return { config, errors }
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { config, errors: [`${where}: 期望对象，得到 ${describeType(input)}`] }
  }
  const raw = input as Record<string, unknown>

  for (const field of SCALAR_FIELDS) {
    if (!hasOwn(raw, field)) continue
    const value = raw[field]
    if (value === null || typeof value === 'string') {
      ;(config as Record<string, unknown>)[field] = value
    } else {
      errors.push(`${where}.${field}: 期望 string | null，得到 ${describeType(value)}`)
    }
  }

  if (hasOwn(raw, 'tokens')) {
    const value = raw.tokens
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`${where}.tokens: 期望对象，得到 ${describeType(value)}`)
    } else {
      const tokens: Record<string, string | null> = {}
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        if (item === null || typeof item === 'string') tokens[key] = item as string | null
        else errors.push(`${where}.tokens.${key}: 期望 string | null，得到 ${describeType(item)}`)
      }
      config.tokens = tokens
    }
  }

  if (hasOwn(raw, 'components')) {
    const value = raw.components
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`${where}.components: 期望对象，得到 ${describeType(value)}`)
    } else {
      const components: Record<string, UiComponentRef | null> = {}
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        if (item === null) {
          components[key] = null
          continue
        }
        const ref = normalizeComponentRef(item, `${where}.components.${key}`, errors)
        if (ref) components[key] = ref
      }
      config.components = components
    }
  }

  for (const key of Object.keys(raw)) {
    if (!LAYER_KEYS.has(key)) errors.push(`${where}: 未知字段 ${key}`)
  }

  return { config, errors }
}

/**
 * 同语义的层合并：把多层配置压成一层（低 → 高）。
 * 用于工作区层内部合成（.dsh/ui.json < 存储绑定）等场景。
 */
export function mergeLayerConfigs(...layers: Array<UiLayerConfig | undefined>): UiLayerConfig {
  const merged: UiLayerConfig = {}
  for (const layer of layers) {
    if (!layer) continue
    for (const field of ['pack', 'theme', 'layout', 'css'] as const) {
      if (hasOwn(layer, field)) (merged as Record<string, unknown>)[field] = layer[field]
    }
    if (layer.tokens) {
      const tokens = { ...(merged.tokens ?? {}) }
      for (const [key, value] of Object.entries(layer.tokens)) {
        if (value === null) delete tokens[key]
        else tokens[key] = value
      }
      if (Object.keys(tokens).length > 0) merged.tokens = tokens
      else delete merged.tokens
    }
    if (layer.components) {
      const components = { ...(merged.components ?? {}) }
      for (const [key, value] of Object.entries(layer.components)) {
        if (value === null) delete components[key]
        else components[key] = value
      }
      if (Object.keys(components).length > 0) merged.components = components
      else delete merged.components
    }
  }
  return merged
}

export interface ResolveInput {
  layers: { dsh: UiLayerConfig; workspace?: UiLayerConfig; session?: UiLayerConfig }
  packs?: Iterable<UiPackDescriptor>
}

function pickScalar(
  layers: ResolveInput['layers'],
  field: 'pack' | 'theme' | 'layout',
): { value: string | null | undefined; level?: Level } {
  for (let i = LEVELS_LOW_TO_HIGH.length - 1; i >= 0; i -= 1) {
    const level = LEVELS_LOW_TO_HIGH[i]
    const config = layers[level]
    if (config && hasOwn(config, field)) return { value: config[field], level }
  }
  return { value: undefined }
}

/** 三级解析：产出可直接交给浏览器应用的 UiSpec。 */
export function resolveUi(input: ResolveInput): UiSpec {
  const { layers } = input
  const warnings: string[] = []
  const provenance: UiProvenance = {
    pack: 'none',
    theme: 'none',
    layout: 'none',
    tokens: {},
    components: {},
    css: [],
  }

  // ---- 1. pack：高 → 低第一个“有此键”的层 ----
  const packPick = pickScalar(layers, 'pack')
  let pack: UiPackDescriptor | undefined
  if (typeof packPick.value === 'string') {
    pack = [...(input.packs ?? [])].find((item) => item.id === packPick.value)
    if (!pack) {
      warnings.push(`UI pack 未注册: ${packPick.value}`)
    } else {
      provenance.pack = packPick.level ?? 'none'
    }
  } else if (packPick.value === null) {
    provenance.pack = packPick.level ?? 'none' // 显式清除：不使用任何 pack
  }

  // ---- 2. theme / layout：显式清除或未选择 → 回到 pack 默认 ----
  const themePick = pickScalar(layers, 'theme')
  let themeId: string | null = null
  let theme: UiTheme | undefined
  {
    const fallback = pack?.defaultTheme ?? null
    if (themePick.value === undefined || themePick.value === null) {
      themeId = fallback
      provenance.theme = themeId ? 'pack-default' : 'none'
    } else if (!pack) {
      warnings.push(`设置了 theme(${themePick.value}) 但没有生效的 pack`)
      provenance.theme = 'none'
    } else {
      themeId = themePick.value
      provenance.theme = themePick.level ?? 'none'
    }
    if (themeId && pack) {
      theme = pack.themes?.[themeId]
      if (!theme) warnings.push(`UI pack ${pack.id} 未提供主题: ${themeId}`)
    }
  }

  const layoutPick = pickScalar(layers, 'layout')
  let layoutId: string | null = null
  let layout: UiLayout | undefined
  {
    const fallback = pack?.defaultLayout ?? null
    if (layoutPick.value === undefined || layoutPick.value === null) {
      layoutId = fallback
      provenance.layout = layoutId ? 'pack-default' : 'none'
    } else if (!pack) {
      warnings.push(`设置了 layout(${layoutPick.value}) 但没有生效的 pack`)
      provenance.layout = 'none'
    } else {
      layoutId = layoutPick.value
      provenance.layout = layoutPick.level ?? 'none'
    }
    if (layoutId && pack) {
      layout = pack.layouts?.[layoutId]
      if (!layout) warnings.push(`UI pack ${pack.id} 未提供布局: ${layoutId}`)
    }
  }

  // ---- 3. css：pack 基础 → 主题 → 布局，再叠层级附加 css（null 清空层级部分）----
  const cssChunks: string[] = []
  if (pack?.baseCss) {
    cssChunks.push(pack.baseCss)
    provenance.css.push('pack-base')
  }
  if (theme?.css) {
    cssChunks.push(theme.css)
    provenance.css.push('theme')
  }
  if (layout?.css) {
    cssChunks.push(layout.css)
    provenance.css.push('layout')
  }
  const levelCss: string[] = []
  for (const level of LEVELS_LOW_TO_HIGH) {
    const config = layers[level]
    if (!config || !hasOwn(config, 'css')) continue
    const value = config.css
    if (value === null) {
      levelCss.length = 0
      provenance.css = provenance.css.filter(
        (entry) => entry === 'pack-base' || entry === 'theme' || entry === 'layout',
      )
    } else if (typeof value === 'string') {
      levelCss.push(value)
      provenance.css.push(level)
    }
  }
  cssChunks.push(...levelCss)

  // ---- 4. tokens：pack → 主题 → 布局打底，层覆盖低 → 高；null 删除覆盖 ----
  const baseTokens: Record<string, string> = {
    ...(pack?.baseTokens ?? {}),
    ...(theme?.tokens ?? {}),
    ...(layout?.tokens ?? {}),
  }
  for (const key of Object.keys(baseTokens)) provenance.tokens[key] = 'pack'
  const overrides: Record<string, string> = {}
  for (const level of LEVELS_LOW_TO_HIGH) {
    const config = layers[level]
    if (!config?.tokens) continue
    for (const [key, value] of Object.entries(config.tokens)) {
      if (value === null) {
        delete overrides[key]
        if (hasOwn(baseTokens, key)) provenance.tokens[key] = 'pack'
        else delete provenance.tokens[key]
      } else {
        overrides[key] = value
        provenance.tokens[key] = level
      }
    }
  }
  const tokens = { ...baseTokens, ...overrides }

  // ---- 5. components：pack → 布局打底，层覆盖低 → 高；null = 清除（回到 dsh 原生 UI）----
  const components: Record<string, UiComponentRef> = {
    ...(pack?.baseComponents ?? {}),
    ...(layout?.components ?? {}),
  }
  for (const key of Object.keys(components)) provenance.components[key] = 'pack'
  for (const level of LEVELS_LOW_TO_HIGH) {
    const config = layers[level]
    if (!config?.components) continue
    for (const [key, value] of Object.entries(config.components)) {
      if (value === null) {
        delete components[key]
        delete provenance.components[key]
      } else {
        components[key] = value
        provenance.components[key] = level
      }
    }
  }

  return {
    packId: pack?.id ?? null,
    themeId,
    layoutId,
    tokens,
    css: cssChunks.join('\n'),
    components,
    provenance,
    warnings,
  }
}
