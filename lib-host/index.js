import { Config } from '../packages/ui-skins/lib-host/index.js';
import * as uiSkins from '../packages/ui-skins/lib-host/index.js';
import * as packDefault from '../packages/ui-pack-default/lib-host/index.js';
import * as packExample from '../packages/ui-pack-example/lib-host/index.js';
import * as packAurora from '../packages/ui-pack-aurora/lib-host/index.js';
import * as packManuscript from '../packages/ui-pack-manuscript/lib-host/index.js';
import * as packTerminal from '../packages/ui-pack-terminal/lib-host/index.js';
export const name = 'ui-chameleon';
export const inject = ['storageDomain', 'webServer'];
export { Config };
export function apply(ctx, config) {
    if (!config.enabled)
        return;
    ctx.plugin(uiSkins, config); // 框架：ctx.uiSkins + /ui-skins/* 传输面
    // UI pack（数据面注册；各模块 inject ['uiSkins'] 等待框架就绪）
    ctx.plugin(packDefault);
    ctx.plugin(packExample);
    ctx.plugin(packAurora);
    ctx.plugin(packManuscript);
    ctx.plugin(packTerminal);
}
