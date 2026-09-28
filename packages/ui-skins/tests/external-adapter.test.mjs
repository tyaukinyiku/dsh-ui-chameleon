/**
 * 外部包适配器单测：skin.json → UiPackDescriptor 映射、CSS 优先级、bundle 提取启发式、
 * 资产越界防护、根目录解析。node --test 直接跑 TS 源码（类型剥离）。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { adaptExternalPack, extractCssFromBundle, resolveExternalRoot } from '../src/external.ts'

/** 构造一个第三方皮肤单元 fixture（dsh-skins/skins/<id> 事实标准布局）。 */
function makeUnit(skin, { cssFiles = {}, bundle = '' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'chim-ext-'))
  writeFileSync(join(root, 'skin.json'), JSON.stringify(skin))
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: skin.package ?? 'x/y' }))
  for (const [rel, text] of Object.entries(cssFiles)) {
    mkdirSync(join(root, rel, '..'), { recursive: true })
    writeFileSync(join(root, rel), text)
  }
  if (bundle) {
    mkdirSync(join(root, 'lib'))
    writeFileSync(join(root, 'lib', 'client.js'), bundle)
  }
  return root
}

test('skin.json → descriptor 映射（id/accent/bodyAttr/预览/来源标注）', () => {
  const root = makeUnit(
    {
      id: 'aurora',
      name: '极光 · Aurora',
      tagline: '自定义背景图',
      description: '毛玻璃面板',
      accent: '#7aa2ff',
      bodyAttr: 'data-dsh-aurora',
      package: '@captain1275/dsh-client-ui-skin-aurora',
    },
    { cssFiles: { 'skin.css': 'body[data-dsh-aurora] { color: red; }' } },
  )
  const adapted = adaptExternalPack(root, { source: '@captain1275/dsh-client-ui-skin-aurora' })
  assert.equal(adapted.pack.id, 'ext-aurora')
  assert.equal(adapted.pack.title, '极光 · Aurora')
  assert.equal(adapted.pack.bodyAttr, 'data-dsh-aurora')
  assert.equal(adapted.pack.baseTokens?.['--ui-accent'], '#7aa2ff')
  assert.match(adapted.pack.description ?? '', /自定义背景图.*毛玻璃面板/s)
  assert.equal(adapted.pack.external?.cssOrigin, 'discover')
  assert.equal(adapted.pack.external?.package, '@captain1275/dsh-client-ui-skin-aurora')
  assert.match(adapted.pack.baseCss ?? '', /body\[data-dsh-aurora\]/)
  rmSync(root, { recursive: true, force: true })
})

test('cssFiles 显式优先于发现；id 可覆盖', () => {
  const root = makeUnit(
    { id: 'miku', bodyAttr: 'data-dsh-miku' },
    { cssFiles: { 'a.css': '/* A */', 'b.css': '/* B */', 'lib/deep.css': '/* DEEP */' } },
  )
  const adapted = adaptExternalPack(root, { source: 'pkg', id: 'ext-custom', cssFiles: ['b.css'] })
  assert.equal(adapted.pack.id, 'ext-custom')
  assert.equal(adapted.pack.external?.cssOrigin, 'files')
  assert.match(adapted.pack.baseCss ?? '', /B/)
  assert.doesNotMatch(adapted.pack.baseCss ?? '', /A|DEEP/)
  rmSync(root, { recursive: true, force: true })
})

test('bundle 提取启发式：css-modules 注入产物里挖出 CSS', () => {
  const bundle = [
    'var x = 1;',
    'const short = "don\'t";',
    'const css = "body[data-dsh-x]{background:#123456;color:var(--x)}"',
    'function require(e){return null}',
    'const notCss = "function foo() { return 1; }"',
  ].join('\n')
  const extracted = extractCssFromBundle(bundle)
  assert.match(extracted, /body\[data-dsh-x\]\{background:#123456/)
  assert.doesNotMatch(extracted, /function foo/)

  // 无 CSS 的 bundle → 适配结果 cssOrigin=none + 告警
  const root = makeUnit({ id: 'empty' }, { bundle: 'var a = "hello world this is not css at all";' })
  const adapted = adaptExternalPack(root, { source: 'pkg' })
  assert.equal(adapted.pack.external?.cssOrigin, 'none')
  assert.ok(adapted.warnings.some((w) => w.includes('未找到 CSS')))
  rmSync(root, { recursive: true, force: true })
})

test('预览图越界路径不入白名单', () => {
  const root = makeUnit({
    id: 'evil',
    preview: { light: '../outside.png', dark: 'preview/dark.png' },
  })
  writeFileSync(join(root, 'preview-dark.png'), 'x')
  mkdirSync(join(root, 'preview'))
  writeFileSync(join(root, 'preview', 'dark.png'), 'x')
  const adapted = adaptExternalPack(root, { source: 'pkg' })
  assert.equal(adapted.assets.has('../outside.png'), false)
  assert.ok(adapted.assets.has('preview/dark.png'))
  assert.ok(adapted.warnings.some((w) => w.includes('预览图缺失')))
  assert.ok(!(adapted.pack.preview?.light))
  rmSync(root, { recursive: true, force: true })
})

test('resolveExternalRoot：路径与包名（node_modules 锚点）', () => {
  const root = makeUnit({ id: 'p' })
  assert.equal(resolveExternalPack0(root), root)
  assert.equal(resolveExternalRoot('/no/such/dir/anywhere'), null)
  // 包名：在锚点的 node_modules 下挂一个包
  const anchor = mkdtempSync(join(tmpdir(), 'chim-anchor-'))
  mkdirSync(join(anchor, 'node_modules', '@scope', 'pkg'), { recursive: true })
  writeFileSync(join(anchor, 'node_modules', '@scope', 'pkg', 'package.json'), '{}')
  const hit = resolveExternalRoot('@scope/pkg', [anchor])
  assert.ok(hit && hit.endsWith(join('node_modules', '@scope', 'pkg')))
  rmSync(root, { recursive: true, force: true })
  rmSync(anchor, { recursive: true, force: true })
})

function resolveExternalPack0(root) {
  return resolveExternalRoot(root, [])
}
