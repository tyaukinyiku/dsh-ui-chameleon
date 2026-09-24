/**
 * dsh-ui-chameleon 浏览器半聚合入口（root dsh.client 的 bundle 来源）。
 * 以子插件挂载框架客户端与全部 UI pack 组件面（各模块自带 inject 等待语义）。
 */
import type { Context } from '@deepseek-ai/cordis'
import * as uiSkinsClient from '../packages/ui-skins/src/client/index.ts'
import * as packDefault from '../packages/ui-pack-default/src/client.ts'
import * as packExample from '../packages/ui-pack-example/src/client.ts'
import * as packAurora from '../packages/ui-pack-aurora/src/client.ts'
import * as packManuscript from '../packages/ui-pack-manuscript/src/client.ts'
import * as packTerminal from '../packages/ui-pack-terminal/src/client.ts'

export const name = 'dsh-ui-chameleon/client'

export function apply(ctx: Context): void {
  ctx.plugin(uiSkinsClient) // 提供 ctx.uiSkinsClient + 皮肤按钮/选择器/观察器
  ctx.plugin(packDefault)
  ctx.plugin(packExample)
  ctx.plugin(packAurora)
  ctx.plugin(packManuscript)
  ctx.plugin(packTerminal)
}
