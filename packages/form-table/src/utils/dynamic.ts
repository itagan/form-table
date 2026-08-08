import type {
  DynamicValue,
  FormTableState,
  FormTableRuntimeContext
} from '../types'

export function createRuntimeContext(
  baseContext: FormTableState,
  overrides: Partial<FormTableRuntimeContext> = {}
): FormTableRuntimeContext {
  return {
    tableData: baseContext.tableData,
    row: overrides.row || {},
    index: overrides.index ?? -1,
    fieldKey: overrides.fieldKey
  }
}

export function resolveDynamicValue<T>(
  value: DynamicValue<T> | undefined,
  context: FormTableRuntimeContext
): T | undefined {
  return typeof value === 'function'
    ? (value as (context: FormTableRuntimeContext) => T)(context)
    : value
}

export function resolveVisible(
  value: DynamicValue<boolean> | undefined,
  context: FormTableRuntimeContext
) {
  return resolveDynamicValue(value, context) !== false
}
