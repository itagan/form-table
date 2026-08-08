import type { FormItemType } from '../types'

export type FieldRenderMode = 'slot' | 'component' | 'type' | 'display'

interface FieldRenderConfig {
  type?: FormItemType
}

export function resolveFieldRenderMode(config: FieldRenderConfig): FieldRenderMode {
  if (config.type === 'slot') return 'slot'
  if (config.type === 'component') return 'component'
  if (config.type) return 'type'
  return 'display'
}
