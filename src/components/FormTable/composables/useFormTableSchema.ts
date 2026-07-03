import { computed, type ComputedRef } from 'vue'
import type {
  ColumnConfig,
  FormItemConfig,
  FormTableBaseContext,
  RowConfig,
  TableRow
} from '../types'
import { createRuntimeContext, resolveDynamicValue, resolveVisible } from '../utils/dynamic'
import { resolveFormItemVisible } from '../utils/fieldConfig'
import { getSchemaFieldProps, normalizeColumns } from '../utils/schema'

interface FormTableSchemaProps {
  columns: ColumnConfig[]
  tableData: TableRow[]
}

interface UseFormTableSchemaOptions {
  props: FormTableSchemaProps
  formTableContext: ComputedRef<FormTableBaseContext>
  createTableBaseContext: (tableData: TableRow[]) => FormTableBaseContext
}

/**
 * Normalizes column configuration and centralizes field visibility/path rules.
 *
 * Path-style field keys such as `profile.city` are preserved here and reused by
 * validation, row initialization and field lookup so those capabilities stay in
 * one schema contract.
 */
export function useFormTableSchema(options: UseFormTableSchemaOptions) {
  const { props, formTableContext, createTableBaseContext } = options

  const schema = computed(() => normalizeColumns(props.columns))
  const visibleColumns = computed(() => {
    const context = createRuntimeContext(formTableContext.value)
    return schema.value.columns.filter((column) => resolveVisible(column.visible, context))
  })

  const getColumnKey = (column: ColumnConfig, index: number) => {
    const columnProps = resolveDynamicValue(
      column.props,
      createRuntimeContext(formTableContext.value)
    ) || {}
    return column.key || columnProps.columnKey || column.name || index
  }

  const getVisibleRowItemsByContext = (
    rowConfig: RowConfig,
    row: TableRow,
    rowIndex: number,
    baseContext: FormTableBaseContext
  ) => {
    const rowContext = createRuntimeContext(baseContext, {
      row,
      index: rowIndex
    })

    if (!resolveVisible(rowConfig.visible, rowContext)) {
      return [] as FormItemConfig[]
    }

    return rowConfig.children.filter((item) => {
      return resolveFormItemVisible(item, createRuntimeContext(baseContext, {
        row,
        index: rowIndex,
        fieldKey: item.key
      }))
    })
  }

  const getFieldConfigByKey = (fieldKey: string) => {
    return schema.value.fieldMap.get(fieldKey)
  }

  const getConfiguredFieldKeys = () => {
    return schema.value.fieldKeys
  }

  const getAllRowFieldProps = (rowIndex: number, tableData: TableRow[] = props.tableData) => {
    if (!tableData[rowIndex]) {
      return []
    }

    return getSchemaFieldProps(schema.value, rowIndex)
  }

  const getVisibleRowFieldProps = (rowIndex: number, tableData: TableRow[]) => {
    const row = tableData[rowIndex]
    if (!row) {
      return []
    }

    const fieldProps: string[] = []
    const baseContext = createTableBaseContext(tableData)
    const visibleColumnsForTable = schema.value.columns.filter((column) => {
      return resolveVisible(column.visible, createRuntimeContext(baseContext))
    })

    visibleColumnsForTable.forEach((column) => {
      column.children.forEach((rowConfig) => {
        getVisibleRowItemsByContext(rowConfig, row, rowIndex, baseContext).forEach((item) => {
          fieldProps.push(`tableData.${rowIndex}.${item.key}`)
        })
      })
    })

    return fieldProps
  }

  return {
    schema,
    visibleColumns,
    getColumnKey,
    getFieldConfigByKey,
    getConfiguredFieldKeys,
    getAllRowFieldProps,
    getVisibleRowFieldProps
  }
}
