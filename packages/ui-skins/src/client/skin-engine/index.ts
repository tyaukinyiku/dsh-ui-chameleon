/**
 * skin-engine 客户端接线 —— 把 vendored 官方皮肤运行时（skin-controller /
 * semantic-adapter / shell-rendering / decoration-layers / effect-ledger）挂进
 * chameleon 的 SkinRuntime：
 *
 *   - 渲染语义与 dsh-web 皮肤中心一致：原子 activation（样式表 <link> → 背景
 *     美术层 → hooks（完整 SkinHooksContext：六层装饰层 + theme 订阅）→ 翻
 *     html[data-dsh-skin] → 回收上一 activation），外加 L2 语义打标与壳层渲染
 *     适配；
 *   - chameleon 只做编排：三级解析决定「哪个目标用哪款皮肤」，选择持久化由
 *     绑定层（session/workspace/dsh）负责，故 engine 的 persist 槽为空操作；
 *   - hooks 模块导入经 <script type="module"> + blob URL（静态 import 字面量，
 *     永不被转译成 require(url)）。
 */
import { createEffectLedger } from './effect-ledger.ts'
import { createSemanticAdapter } from './semantic-adapter.ts'
import type { SemanticAdapter } from './semantic-adapter.ts'
import { installShellRenderingAdapter } from './shell-rendering.ts'
import { createSkinController } from './skin-controller.ts'
import type { ControllerSkinEntry, SkinController, SkinControllerDeps } from './skin-controller.ts'

export type { ControllerSkinEntry, SkinController }

/** 引擎 v2 传输面（host：skin-engine/external-v2.ts）。 */
export const ENGINE_API_BASE = '/ui-skins/external/v2'

interface EngineHandle {
  controller: SkinController
  adapter: SemanticAdapter
  disposeShell: () => void
}

let handle: EngineHandle | null = null

/** hooks.mjs 动态模块导入（blob URL + module script；TS 转译安全）。 */
async function importHooksModule(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`hooks fetch ${url} -> ${res.status}`)
  const text = await res.text()
  const blobUrl = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }))
  try {
    const done = new Promise<void>((resolveDone) => {
      const timer = setTimeout(resolveDone, 8000)
      const onDone = (): void => {
        clearTimeout(timer)
        resolveDone()
      }
      window.addEventListener('uiskins-engine-hooks-ready', onDone, { once: true })
    })
    const holder = window as unknown as { __uiSkinsEngineHooks?: unknown }
    holder.__uiSkinsEngineHooks = undefined
    const el = doc().createElement('script')
    el.type = 'module'
    // 字符串内静态 import —— 不会被任何转译步骤改写。
    el.textContent =
      `import * as m from ${JSON.stringify(blobUrl)};` +
      `window.__uiSkinsEngineHooks = m;` +
      `window.dispatchEvent(new Event('uiskins-engine-hooks-ready'));`
    doc().head.appendChild(el)
    await done
    el.remove()
    return holder.__uiSkinsEngineHooks
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

function doc(): Document {
  return document
}

/** 每文档单例：装饰层/语义打标/壳层适配都是组件级，随文档存活。 */
export function getSkinEngine(): SkinController {
  if (handle) return handle.controller
  const d = doc()
  const deps: SkinControllerDeps = {
    doc: d,
    ledger: createEffectLedger(),
    apiBase: ENGINE_API_BASE,
    importHooks: importHooksModule,
    // 选择持久化归 chameleon 三级绑定层（session/workspace/dsh），引擎只管渲染。
    persist: async () => {},
    onError: (message, error) => {
      console.warn('[skin-engine]', message, error)
    },
  }
  const controller = createSkinController(deps)
  const adapter = createSemanticAdapter(d)
  adapter.start()
  const disposeShell = installShellRenderingAdapter(d)
  handle = { controller, adapter, disposeShell }
  return controller
}

/** 拉取引擎 catalog（skinId → 控制器条目）；host 在收编时已做安全管线验证。 */
export async function fetchEngineCatalog(): Promise<Map<string, ControllerSkinEntry>> {
  const res = await fetch(`${ENGINE_API_BASE}/catalog`)
  if (!res.ok) throw new Error(`engine catalog -> ${res.status}`)
  const rows = (await res.json()) as Array<{ manifest: ControllerSkinEntry['manifest'] }>
  const map = new Map<string, ControllerSkinEntry>()
  for (const row of rows) {
    if (row?.manifest?.id) map.set(row.manifest.id, { manifest: row.manifest })
  }
  return map
}
