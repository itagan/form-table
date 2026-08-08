import type { FieldComponentConfig, FormItemType } from '../types'

export type FieldRenderMode = 'slot' | 'component' | 'type' | 'display'

interface FieldRenderConfig {
  key: string
  slot?: string
  type?: FormItemType
  component?: FieldComponentConfig
}

const warnedConfigs = new WeakSet<object>()

export function resolveFieldRenderMode(config: FieldRenderConfig): FieldRenderMode {
  if (config.slot) return 'slot'
  if (config.component?.is) return 'component'
  if (config.type) return 'type'
  return 'display'
}

/**
 * TypeScript 配置会阻止模式冲突；这里仅为远程 JSON 和普通 JavaScript 提供确定性降级。
 */
export function warnFieldRenderConflict(config: FieldRenderConfig) {
  if (!import.meta.env.DEV || warnedConfigs.has(config)) return

  const sources = [
    config.slot ? 'slot' : '',
    config.component?.is ? 'component' : '',
    config.type ? 'type' : ''
  ].filter(Boolean)

  if (sources.length < 2) return

  warnedConfigs.add(config)
  console.warn(
    `[FormTable] field "${config.key}" has multiple render modes (${sources.join(', ')}); ` +
    `using ${resolveFieldRenderMode(config)} by priority: slot > component > type.`
  )
}
