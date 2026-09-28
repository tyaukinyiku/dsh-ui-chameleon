/**
 * 市场源适配器单测（dsh-market.com v2 资产契约）：来源解析、url() 重写、
 * bodyAttr 值形态、拉取失败降级。fetch 打桩，不发真网络请求。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { adaptMarketSkin, marketSkinId, rewriteCssUrls } from '../src/external.ts'

test('市场来源解析：market: 前缀 / /skins/<id> / ?skin=<id> / 非市场 URL', () => {
  assert.equal(marketSkinId('market:verdandi'), 'verdandi')
  assert.equal(marketSkinId('https://dsh-market.com/skins/cafe-roastery'), 'cafe-roastery')
  assert.equal(marketSkinId('https://dsh-market.com/tryon/?skin=harbor'), 'harbor')
  assert.equal(marketSkinId('https://example.com/skins/x'), null)
  assert.equal(marketSkinId('@captain1275/dsh-client-ui-skin-aurora'), null)
  assert.equal(marketSkinId('market:'), null)
})

test('url() 相对路径重写为市场资产绝对地址（data:/绝对地址不重写）', () => {
  const css = '.a{background:url(assets/bg.png)} .b{background:url("https://x/y.png")} .c{background:url(data:image/png;base64,xx)}'
  const out = rewriteCssUrls(css, 'https://dsh-market.com/api/skin-center/v2/skins/verdandi')
  assert.match(out, /url\("?https:\/\/dsh-market\.com\/api\/skin-center\/v2\/skins\/verdandi\/assets\/bg\.png"?\)/)
  assert.match(out, /url\("https:\/\/x\/y\.png"\)/)
  assert.match(out, /url\(data:image\/png;base64,xx\)/)
})

test('市场皮肤适配：样式拼接 + bodyAttr=data-dsh-skin=<id> + cssOrigin=market', async () => {
  const orig = globalThis.fetch
  globalThis.fetch = async (url) => {
    const u = String(url)
    if (u.endsWith('/stylesheet')) return { ok: true, status: 200, text: async () => ':root { --a: 1 }' }
    if (u.endsWith('/patches')) return { ok: true, status: 200, text: async () => '.vd-x { color: red }' }
    return { ok: false, status: 404, text: async () => '' }
  }
  try {
    const a = await adaptMarketSkin('verdandi', { source: 'market:verdandi' })
    assert.equal(a.pack.id, 'ext-verdandi')
    assert.equal(a.pack.bodyAttr, 'data-dsh-skin=verdandi')
    assert.equal(a.pack.external?.cssOrigin, 'market')
    assert.match(a.pack.baseCss ?? '', /--a: 1/)
    assert.match(a.pack.baseCss ?? '', /vd-x/)
    assert.equal(a.ok, true)
  } finally {
    globalThis.fetch = orig
  }
})

test('市场拉取失败：警告降级、ok 仍真（留诊断）', async () => {
  const orig = globalThis.fetch
  globalThis.fetch = async () => {
    throw new Error('offline')
  }
  try {
    const a = await adaptMarketSkin('ghost', { source: 'market:ghost', title: '幽灵', description: 'x' })
    assert.equal(a.ok, true)
    assert.equal(a.pack.title, '幽灵')
    assert.equal(a.pack.external?.cssOrigin, 'none')
    assert.ok(a.warnings.length >= 2 && a.warnings.every((w) => w.includes('拉取异常')))
  } finally {
    globalThis.fetch = orig
  }
})
