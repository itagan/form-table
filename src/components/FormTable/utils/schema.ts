import type { ColumnConfig, FormItemConfig } from '../types'
import { componentTypeMap } from '../configs/defaultComponentConfigs'

export interface NormalizedFormTableSchema {
  columns: ColumnConfig[]
  fieldMap: Map<string, FormItemConfig>
  fieldKeys: string[]
}

const knownFormItemTypes = new Set(Object.keys(componentTypeMap))

function validateFormItemConfig(item: FormItemConfig) {
  if (!knownFormItemTypes.has(item.type)) {
    console.warn(`[FormTable] unknown field type "${item.type}" for field "${item.key}".`)
  }

  if (item.type === 'slot' && !item.component?.slotName) {
    console.warn(`[FormTable] slot field "${item.key}" requires component.slotName.`)
  }

  if (item.type === 'custom' && !item.component?.customComponent) {
    console.warn(`[FormTable] custom field "${item.key}" requires component.customComponent.`)
  }
}

export function normalizeColumns(columns: ColumnConfig[]): NormalizedFormTableSchema {
  const fieldMap = new Map<string, FormItemConfig>()
  const fieldKeys: string[] = []

  columns.forEach((column) => {
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
    columns,
    fieldMap,
    fieldKeys
  }
}

export function getSchemaFieldProps(schema: NormalizedFormTableSchema, rowIndex: number) {
  return schema.fieldKeys.map((fieldKey) => `tableData.${rowIndex}.${fieldKey}`)
}
