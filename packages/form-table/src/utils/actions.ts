import type { FormTableActions } from '../types'

/**
 * 创建 FormTableActions 的空实现。
 *
 * 正常情况下子组件一定由 FormTable provide actions；这里的 fallback 只用于
 * 单独挂载子组件、测试或异常注入缺失时，避免运行期访问 undefined。
 */
export function createFallbackFormTableActions(): FormTableActions {
  return {
    addRow: () => undefined,
    insertRow: () => undefined,
    copyRow: () => undefined,
    updateRow: () => undefined,
    removeRow: () => undefined,
    moveRow: () => undefined,
    getRow: () => undefined,
    getRowFieldProps: () => [],
    validateField: async () => true,
    validateRow: async () => true,
    clearValidate: () => undefined,
    clearRowValidate: () => undefined
  }
}
