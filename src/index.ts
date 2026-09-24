/**
 * dsh-ui-chameleon 组合包聚合入口（安装态的插件面）。
 *
 * 安装态的 loader 行只能是裸包名（client 模块扫描按 manifest.name 归属），
 * 因此本聚合器作为唯一点火入口，内部以 ctx.plugin 挂载框架与全部 UI pack
 * （各子模块自带 inject 依赖声明，等待语义照常生效）。
 *
 * 开发态（--patch 绝对路径直载各子包 src）不经此入口，两模式并存。
 */
import type { Context } from '@deepseek-ai/cordis'
import { Config, type Config as UiSkinsConfig } from '../packages/ui-skins/lib-host/index.js'
import * as uiSkins from '../packages/ui-skins/lib-host/index.js'
import * as packDefault from '../packages/ui-pack-default/lib-host/index.js'
import * as packExample from '../packages/ui-pack-example/lib-host/index.js'
import * as packAurora from '../packages/ui-pack-aurora/lib-host/index.js'
import * as packManuscript from '../packages/ui-pack-manuscript/lib-host/index.js'
import * as packTerminal from '../packages/ui-pack-terminal/lib-host/index.js'

export const name = 'ui-chameleon'
export const inject = ['storageDomain', 'webServer']
export { Config }

export function apply(ctx: Context, config: UiSkinsConfig): void {
  if (!config.enabled) return
  ctx.plugin(uiSkins, config) // 框架：ctx.uiSkins + /ui-skins/* 传输面
  // UI pack（数据面注册；各模块 inject ['uiSkins'] 等待框架就绪）
  ctx.plugin(packDefault)
  ctx.plugin(packExample)
  ctx.plugin(packAurora)
  ctx.plugin(packManuscript)
  ctx.plugin(packTerminal)
}
