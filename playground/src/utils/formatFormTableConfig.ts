import type { ColumnConfig } from '@itagan/form-table'

/** 将演示页正在使用的配置转换成可读代码，避免维护第二份静态示例。 */
export function formatFormTableConfig(columns: ColumnConfig[]) {
  return JSON.stringify(columns, (key, value) => {
    if (key === 'is' && value) {
      return `[Component ${value.name || value.options?.name || 'Anonymous'}]`
    }

    if (typeof value === 'function') {
      return value.toString()
    }

    return value
  }, 2)
}
