/**
 * 三级解析单测（node --test；直接跑 TS 源码，依赖 node ≥ 22.18 的类型剥离）。
 * 覆盖：会话>工作区>dsh 优先级、null 清除语义、token/css/component 合并、来源标注、读路径告警。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeLayerConfigs, normalizeLayerConfig, resolveUi } from '../src/resolve.ts'

const packs = [
  {
    id: 'aurora',
    baseTokens: { '--ui-bg': '#0b0b12', '--ui-accent': '#7c5cff', '--ui-radius': '16px' },
    baseCss: '/* aurora-base */',
    baseComponents: { 'hero.mark': { pack: 'aurora', name: 'AuroraMark' } },
    themes: {
      night: { id: 'night', tokens: { '--ui-accent': '#00e5c0' }, css: '/* night */' },
      dawn: { id: 'dawn', tokens: { '--ui-bg': '#faf3e7' } },
    },
    layouts: {
      focus: {
        id: 'focus',
        tokens: { '--ui-gap': '4px' },
        css: '/* focus */',
        components: { 'main.shell': { pack: 'aurora', name: 'FocusShell' } },
      },
      compact: { id: 'compact', css: '/* compact */' },
    },
    defaultTheme: 'night',
    defaultLayout: 'focus',
  },
]

test('无配置：无 pack，空 token/css，不报错', () => {
  const spec = resolveUi({ layers: { dsh: {} }, packs })
  assert.equal(spec.packId, null)
  assert.equal(spec.themeId, null)
  assert.equal(spec.layoutId, null)
  assert.deepEqual(spec.tokens, {})
  assert.equal(spec.css, '')
  assert.deepEqual(spec.components, {})
  assert.deepEqual(spec.warnings, [])
})

test('dsh 层选 pack：theme/layout 回到 pack 默认', () => {
  const spec = resolveUi({ layers: { dsh: { pack: 'aurora' } }, packs })
  assert.equal(spec.packId, 'aurora')
  assert.equal(spec.themeId, 'night')
  assert.equal(spec.layoutId, 'focus')
  assert.equal(spec.provenance.theme, 'pack-default')
  assert.equal(spec.provenance.layout, 'pack-default')
  assert.equal(spec.tokens['--ui-accent'], '#00e5c0') // 主题覆盖 pack 基础
  assert.equal(spec.tokens['--ui-gap'], '4px') // 布局 token
  assert.equal(spec.components['main.shell']?.name, 'FocusShell')
  assert.equal(spec.components['hero.mark']?.name, 'AuroraMark')
})

test('优先级：会话 > 工作区 > dsh（逐字段）', () => {
  const spec = resolveUi({
    layers: {
      dsh: { pack: 'aurora', theme: 'dawn', layout: 'compact' },
      workspace: { theme: 'night' },
      session: { layout: 'focus' },
    },
    packs,
  })
  assert.equal(spec.packId, 'aurora')
  assert.equal(spec.themeId, 'night') // 工作区胜过 dsh
  assert.equal(spec.layoutId, 'focus') // 会话胜过 dsh
  assert.equal(spec.provenance.theme, 'workspace')
  assert.equal(spec.provenance.layout, 'session')
})

test('会话没配置用工作区，工作区没配置用 dsh', () => {
  const fromWorkspace = resolveUi({
    layers: { dsh: { pack: 'aurora', theme: 'dawn' }, workspace: { theme: 'night' } },
    packs,
  })
  assert.equal(fromWorkspace.themeId, 'night')
  const fromDsh = resolveUi({
    layers: { dsh: { pack: 'aurora', theme: 'dawn' }, session: { layout: 'compact' } },
    packs,
  })
  assert.equal(fromDsh.themeId, 'dawn')
  assert.equal(fromDsh.layoutId, 'compact')
})

test('null 清除：阻断继承并回到 pack 默认/空', () => {
  const spec = resolveUi({
    layers: {
      dsh: { pack: 'aurora', theme: 'dawn', css: '/* dsh */' },
      workspace: { theme: 'night', css: '/* ws */' },
      session: { theme: null, css: null, pack: null },
    },
    packs,
  })
  assert.equal(spec.packId, null) // 显式清除 pack
  assert.equal(spec.themeId, null) // pack 清除后无处可回
  assert.equal(spec.css, '') // 层级 css 被清空
  assert.equal(spec.provenance.pack, 'session')
})

test('null 清除 theme 回到 pack 默认（pack 仍在）', () => {
  const spec = resolveUi({
    layers: { dsh: { pack: 'aurora', theme: 'dawn' }, session: { theme: null } },
    packs,
  })
  assert.equal(spec.themeId, 'night')
  assert.equal(spec.provenance.theme, 'pack-default')
})

test('tokens：低→高覆盖，null 删除覆盖并回落打底值', () => {
  const spec = resolveUi({
    layers: {
      dsh: { pack: 'aurora', tokens: { '--ui-accent': '#111111', '--ui-radius': '8px' } },
      workspace: { tokens: { '--ui-radius': '2px' } },
      session: { tokens: { '--ui-radius': null, '--ui-accent': null, '--ui-extra': 'x' } },
    },
    packs,
  })
  assert.equal(spec.tokens['--ui-radius'], '16px') // 覆盖被删，回落 pack 打底
  assert.equal(spec.tokens['--ui-accent'], '#00e5c0') // 覆盖被删，回落主题打底
  assert.equal(spec.tokens['--ui-extra'], 'x')
  assert.equal(spec.provenance.tokens['--ui-radius'], 'pack')
  assert.equal(spec.provenance.tokens['--ui-extra'], 'session')
})

test('components：逐层覆盖，null 清除回到 dsh 原生（含 pack 自带覆盖）', () => {
  const spec = resolveUi({
    layers: {
      dsh: { pack: 'aurora' },
      workspace: { components: { 'hero.mark': { pack: 'aurora', name: 'WsMark' } } },
      session: {
        components: {
          'hero.mark': null,
          'main.shell': { pack: 'aurora', name: 'SessionShell', order: -500 },
        },
      },
    },
    packs,
  })
  assert.equal(spec.components['hero.mark'], undefined) // 连 pack 自带覆盖一起清除
  assert.equal(spec.components['main.shell']?.name, 'SessionShell')
  assert.equal(spec.components['main.shell']?.order, -500)
  assert.equal(spec.provenance.components['main.shell'], 'session')
})

test('css：pack→主题→布局→层级依序拼接，null 只清层级部分', () => {
  const spec = resolveUi({
    layers: {
      dsh: { pack: 'aurora', css: '/* dsh */' },
      workspace: { css: null },
      session: { css: '/* session */' },
    },
    packs,
  })
  assert.equal(spec.css, '/* aurora-base */\n/* night */\n/* focus */\n/* session */')
  assert.deepEqual(spec.provenance.css, ['pack-base', 'theme', 'layout', 'session'])
})

test('读路径：未注册 pack/主题进 warnings，不抛错', () => {
  const spec = resolveUi({
    layers: { dsh: { pack: 'ghost', theme: 'nope' } },
    packs,
  })
  assert.equal(spec.packId, null)
  assert.ok(spec.warnings.some((w) => w.includes('ghost')))
})

test('provenance.pack 标注选择层', () => {
  const spec = resolveUi({
    layers: { dsh: { pack: 'aurora' }, workspace: { pack: 'aurora' } },
    packs,
  })
  assert.equal(spec.provenance.pack, 'workspace')
})

test('normalizeLayerConfig：结构校验与未知字段', () => {
  const ok = normalizeLayerConfig({
    pack: 'aurora',
    theme: null,
    tokens: { '--a': '1', '--b': null },
    components: { 'x.y': { pack: 'aurora', name: 'X', order: -1, entryKey: 'k' } },
  })
  assert.deepEqual(ok.errors, [])
  assert.equal(ok.config.tokens['--b'], null)

  const bad = normalizeLayerConfig({ pack: 42, tokens: { '--a': true }, nope: 1 })
  assert.equal(bad.errors.length, 3)

  const badRef = normalizeLayerConfig({ components: { 'x.y': { pack: 'aurora' } } })
  assert.ok(badRef.errors.some((e) => e.includes('name')))
})

test('mergeLayerConfigs：同语义层合并（工作区层内部合成用）', () => {
  const merged = mergeLayerConfigs(
    { pack: 'aurora', tokens: { '--a': '1', '--b': '2' }, css: '/* file */' },
    { tokens: { '--b': null, '--c': '3' }, css: '/* store */' },
  )
  assert.equal(merged.pack, 'aurora')
  assert.deepEqual(merged.tokens, { '--a': '1', '--c': '3' })
  assert.equal(merged.css, '/* store */')
})
