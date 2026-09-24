/**
 * 绑定的持久化：dsh-storage-domain（“持久保存一切不属于会话事件日志的数据”的官方 seam）。
 *
 * 领域 ui_skins：
 *   workspace_bindings —— 工作区级绑定（key: WorkspaceId）
 *   session_bindings   —— 会话级绑定（key: SessionId）
 *
 * DomainSpec 以字面量直构（domainTable 即 { valueSchema }）——避免运行时依赖
 * @deepseek-ai/dsh-storage-domain（树外安装解析不到）；zod 是真实 npm 依赖。
 * 语义校验统一走 resolve.ts 的 normalizeLayerConfig（写路径拒绝、读路径告警）。
 */
import { z } from 'zod'
import type { UiLayerConfig } from './types.ts'

const layerConfigSchema = z.object({
  pack: z.nullable(z.string()).optional(),
  theme: z.nullable(z.string()).optional(),
  layout: z.nullable(z.string()).optional(),
  tokens: z.record(z.string(), z.nullable(z.string())).optional(),
  css: z.nullable(z.string()).optional(),
  components: z.record(z.string(), z.unknown()).optional(),
})

export const UI_SKINS_DOMAIN_NAME = 'ui_skins'

export const uiSkinsDomain = {
  name: UI_SKINS_DOMAIN_NAME,
  version: 1,
  layout: 'single' as const,
  tables: {
    workspace_bindings: { valueSchema: layerConfigSchema },
    session_bindings: { valueSchema: layerConfigSchema },
  },
}
