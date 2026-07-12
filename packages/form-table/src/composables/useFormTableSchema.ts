import { computed, type ComputedRef } from 'vue'
import type {
  ColumnConfig,
  FormItemConfig,
  FormTableBaseContext,
  FormTableProps,
  RowConfig,
  TableRow
} from '../types'
import { createRuntimeContext, resolveDynamicValue, resolveVisible } from '../utils/dynamic'
import { resolveFormItemVisible } from '../utils/fieldConfig'
import { getSchemaFieldProps, normalizeColumns, validateRulePaths } from '../utils/schema'

type FormTableSchemaProps = Pick<FormTableProps, 'columns' | 'rules' | 'tableData'>

interface UseFormTableSchemaOptions {
  props: FormTableSchemaProps
  formTableContext: ComputedRef<FormTableBaseContext>
  createTableBaseContext: (tableData: TableRow[]) => FormTableBaseContext
}

/**
 * 归一化 columns，并集中维护字段显隐与校验路径规则。
 *
 * `profile.city` 这类路径字段不会在这里被拍平或改写；字段查找、默认值、
 * 联动 patch 和 Element UI 校验路径都复用同一份 schema 结果。
 */
export function useFormTableSchema(options: UseFormTableSchemaOptions) {
  const { props, formTableContext, createTableBaseContext } = options

  // schema 建立字段索引和字段顺序，并把 fields 简写归一化为单行 children。
  const schema = computed(() => {
    const normalizedSchema = normalizeColumns(props.columns)
    validateRulePaths(normalizedSchema, props.rules)
    return normalizedSchema
  })

  // 列级 visible 只能拿到表格级上下文，此处不包含具体 row。
  const visibleColumns = computed(() => {
    const context = createRuntimeContext(formTableContext.value)
    return schema.value.columns.filter((column) => resolveVisible(column.visible, context))
  })

  // key 优先级保持稳定，避免列显隐或动态 props 更新时造成不必要的整列重建。
  const getColumnKey = (column: ColumnConfig, index: number) => {
    const columnProps = resolveDynamicValue(
      column.props,
      createRuntimeContext(formTableContext.value)
    ) || {}
    return column.key || columnProps.columnKey || column.name || index
  }

  // 允许传入临时 baseContext，用于行增删改移后、props 更新前计算新的可见字段。
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

  // 只返回当前可见字段的校验路径；和全量路径做差后即可清理隐藏字段错误。
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
