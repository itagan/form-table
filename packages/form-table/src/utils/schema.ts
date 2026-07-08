import type { ColumnConfig, FormItemConfig, RowConfig } from '../types'
import { componentTypeMap } from '../configs/defaultComponentConfigs'

/**
 * 归一化后的表格 schema。
 *
 * `fieldMap` 用于按字段 key 快速找到配置，`fieldKeys` 用于生成整行校验路径。
 */
export interface NormalizedFormTableSchema {
  columns: NormalizedColumnConfig[]
  fieldMap: Map<string, FormItemConfig>
  fieldKeys: string[]
}

export interface NormalizedColumnConfig extends ColumnConfig {
  children: RowConfig[]
}

const knownFormItemTypes = new Set(Object.keys(componentTypeMap))

/**
 * 开发环境下的字段配置校验。
 *
 * 这里只做非阻塞告警，避免运行时因为局部配置错误导致整张表无法渲染。
 */
function validateFormItemConfig(item: FormItemConfig) {
  if (!knownFormItemTypes.has(item.type)) {
    console.warn(`[FormTable] unknown field type "${item.type}" for field "${item.key}".`)
  }

  if (item.type === 'slot' && !item.component?.slotName) {
    console.warn(`[FormTable] slot field "${item.key}" requires component.slotName.`)
  }

  if (item.type === 'custom' && !item.component?.name) {
    console.warn(`[FormTable] custom field "${item.key}" requires component.name.`)
  }
}

function normalizeColumnRows(column: ColumnConfig): RowConfig[] {
  if (column.children) {
    return column.children
  }

  if (column.fields) {
    return [
      {
        children: column.fields
      }
    ]
  }

  return []
}

/**
 * 将外部 columns 配置归一化为渲染和运行时查询都能复用的 schema。
 *
 * 这里只做列级浅归一化：`fields` 会转换成单行 `children`，字段配置仍保留原始引用。
 * 调用方仍然按 props 驱动更新。
 */
export function normalizeColumns(columns: ColumnConfig[]): NormalizedFormTableSchema {
  const fieldMap = new Map<string, FormItemConfig>()
  const fieldKeys: string[] = []
  const normalizedColumns = columns.map<NormalizedColumnConfig>((column) => ({
    ...column,
    children: normalizeColumnRows(column)
  }))

  normalizedColumns.forEach((column) => {
    column.children.forEach((rowConfig) => {
      rowConfig.children.forEach((item) => {
        if (import.meta.env.DEV && fieldMap.has(item.key)) {
          console.warn(`[FormTable] duplicate field key "${item.key}" detected.`)
        }

        if (import.meta.env.DEV) {
          validateFormItemConfig(item)
        }

        if (!fieldMap.has(item.key)) {
          fieldKeys.push(item.key)
        }

        fieldMap.set(item.key, item)
      })
    })
  })

  return {
    columns: normalizedColumns,
    fieldMap,
    fieldKeys
  }
}

/**
 * 生成指定行的全部字段校验路径。
 *
 * Element UI 的 el-form 校验路径格式为 `tableData.${rowIndex}.${fieldKey}`。
 */
export function getSchemaFieldProps(schema: NormalizedFormTableSchema, rowIndex: number) {
  return schema.fieldKeys.map((fieldKey) => `tableData.${rowIndex}.${fieldKey}`)
}
