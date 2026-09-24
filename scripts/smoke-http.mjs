#!/usr/bin/env node
/**
 * smoke-http.mjs —— 联调冒烟：对已启动的 dsh web（含 ui-skins 插件）逐项验证 /ui-skins/* 面。
 *
 * 前置：dsh web 已用 examples/cordis.patch.local.yml 启动（默认 http://127.0.0.1:3080）。
 * 用法：node scripts/smoke-http.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? 'http://127.0.0.1:3080'
const API = `${BASE}/ui-skins`
const ACME = new URL('../examples/workspaces/acme', import.meta.url).pathname.replace(/\/$/, '')

let failures = 0
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail === undefined ? '' : ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`}`)
  if (!ok) failures += 1
}

const json = async (path, init) => {
  const response = await fetch(`${API}${path}`, init)
  const body = response.status === 204 ? null : await response.json().catch(() => null)
  return { status: response.status, body }
}

// 1. state：pack 注册表（default + quartz）与观察器配置
const state = await json('/state')
check('GET /state 200', state.status === 200, state.status)
const packIds = (state.body?.packs ?? []).map((pack) => pack.id).sort()
check('已注册 UI pack = [default, quartz]', packIds.join(',') === 'default,quartz', packIds)
check('describe.defaults.pack = default', state.body?.defaults?.pack === 'default', state.body?.defaults)

// 2. 工作区文件层：examples/workspaces/acme/.dsh/ui.json 声明 quartz/focus
const ws = await json(`/resolve?workspacePath=${encodeURIComponent(ACME)}`)
check('GET /resolve(workspacePath=acme) 200', ws.status === 200, ws.status)
check('工作区层生效 pack=quartz', ws.body?.spec?.packId === 'quartz', ws.body?.spec?.packId)
check('theme=quartz-night（工作区文件）', ws.body?.spec?.themeId === 'quartz-night', ws.body?.spec?.themeId)
check('layout=focus（工作区文件）', ws.body?.spec?.layoutId === 'focus', ws.body?.spec?.layoutId)
check('token 覆盖 --ui-gap=4px', ws.body?.spec?.tokens?.['--ui-gap'] === '4px', ws.body?.spec?.tokens)

// 3. 会话层覆盖（Remote 写入）：会话没配置用工作区 ✓ 已由 2 覆盖；此处验证会话 > 工作区
const sessionId = `smoke-${Date.now()}`
const write = await json('/binding', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    level: 'session',
    id: sessionId,
    config: { pack: 'default', theme: 'dusk', tokens: { '--ui-gap': '1px' } },
  }),
})
check('POST /binding(session) 204', write.status === 204, write.status === 204 ? undefined : write.body)

const sessionResolved = await json(
  `/resolve?sessionId=${encodeURIComponent(sessionId)}&workspacePath=${encodeURIComponent(ACME)}`,
)
check('会话层 pack=default 覆盖工作区 quartz', sessionResolved.body?.spec?.packId === 'default', sessionResolved.body?.spec?.packId)
check('会话层 theme=dusk', sessionResolved.body?.spec?.themeId === 'dusk', sessionResolved.body?.spec?.themeId)
check('会话层 token 覆盖 --ui-gap=1px', sessionResolved.body?.spec?.tokens?.['--ui-gap'] === '1px', sessionResolved.body?.spec?.tokens)
check(
  'provenance 标注会话层来源',
  sessionResolved.body?.spec?.provenance?.theme === 'session',
  sessionResolved.body?.spec?.provenance,
)

// 4. null 清除语义：会话 theme=null → 回到 pack 默认
const cleared = await json('/binding', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ level: 'session', id: sessionId, config: { pack: 'default', theme: null } }),
})
check('POST /binding(session, theme=null) 204', cleared.status === 204, cleared.status === 204 ? undefined : cleared.body)
const clearedResolved = await json(`/resolve?sessionId=${encodeURIComponent(sessionId)}`)
check('theme=null → pack 默认 theme=paper', clearedResolved.body?.spec?.themeId === 'paper', clearedResolved.body?.spec?.themeId)

// 5. 写路径响亮失败：未注册 pack
const bad = await json('/binding', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ level: 'session', id: sessionId, config: { pack: 'ghost' } }),
})
check('无效 pack 被拒绝 400', bad.status === 400, bad.body)

// 6. SSE 变更流：写绑定后应收到新 revision
const revision = await new Promise((resolve, reject) => {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
    reject(new Error('SSE 5s 内无变更帧'))
  }, 5000)
  void fetch(`${API}/events`, { signal: controller.signal })
    .then(async (response) => {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let seenInitial = false
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const frame = JSON.parse(text.replace(/^data: /gm, '').trim())
        if (!seenInitial) {
          seenInitial = true
          // 触发一次写入
          void fetch(`${API}/binding`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ level: 'session', id: `${sessionId}-sse`, config: { pack: 'default' } }),
          })
          continue
        }
        clearTimeout(timer)
        controller.abort()
        resolve(frame.revision)
        return
      }
    })
    .catch((error) => {
      clearTimeout(timer)
      reject(error)
    })
})
check('SSE /events 推送变更 revision', typeof revision === 'number', revision)

console.log(failures === 0 ? '\n全部通过 ✅' : `\n${failures} 项失败 ❌`)
process.exit(failures === 0 ? 0 : 1)
