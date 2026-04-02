import type {
  ColumnConfig,
  DynamicValue,
  FormTableBaseContext,
  FormTableRuntimeContext,
  TableRow
} from '../types'

export function createRuntimeContext(
  baseContext: FormTableBaseContext,
  overrides: Partial<FormTableRuntimeContext> = {}
): FormTableRuntimeContext {
  return {
    formData: baseContext.formData,
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
  if (typeof value === 'function') {
    return (value as (context: FormTableRuntimeContext) => T)(context)
  }

  return value
}

export function resolveVisible(
  value: DynamicValue<boolean> | undefined,
  context: FormTableRuntimeContext
): boolean {
  return resolveDynamicValue(value, context) !== false
}

export function buildDefaultRow(
  columns: ColumnConfig[],
  baseContext: FormTableBaseContext,
  rowIndex: number,
  seed: Partial<TableRow> = {}
): TableRow {
  const draftRow: TableRow = { ...seed }

  columns.forEach((column) => {
    const columnContext = createRuntimeContext(baseContext, {
      row: draftRow,
      index: rowIndex
    })

    if (!resolveVisible(column.visible, columnContext)) {
      return
    }

    column.children.forEach((rowConfig) => {
      const rowContext = createRuntimeContext(baseContext, {
        row: draftRow,
        index: rowIndex
      })

      if (!resolveVisible(rowConfig.visible, rowContext)) {
        return
      }

      rowConfig.children.forEach((item) => {
        const itemContext = createRuntimeContext(baseContext, {
          row: draftRow,
          index: rowIndex,
          fieldKey: item.key
        })

        if (!resolveVisible(item.visible, itemContext)) {
          return
        }

        if (draftRow[item.key] !== undefined) {
          return
        }

        const defaultValue = resolveDynamicValue(item.defaultValue, itemContext)
        if (defaultValue !== undefined) {
          draftRow[item.key] = defaultValue
        }
      })
    })
  })

  return draftRow
}
