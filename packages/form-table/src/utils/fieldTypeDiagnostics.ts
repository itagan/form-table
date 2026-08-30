import { isReservedFormItemType } from '../configs/defaultComponentConfigs'
import {
  collectFieldTypeDefinitionDiagnostics,
  isDiagnosticRecord
} from './fieldTypeDefinitionDiagnostics'
import type {
  DiagnosticRecord,
  FieldTypeDiagnostic
} from './fieldTypeDefinitionDiagnostics'

const forbiddenItemComponentKeys = ['is', 'resolveComponent', 'slot', 'options', 'optionProps']

const describeItemLocation = (
  column: DiagnosticRecord,
  columnIndex: number,
  item: DiagnosticRecord,
  itemIndex: number
) => {
  const columnName = column.key || column.label || `#${columnIndex + 1}`
  const itemName = item.key || item.fieldKey || `#${itemIndex + 1}`
  return `column "${String(columnName)}", field "${String(itemName)}"`
}

/** 收集实例级注册和引用问题；调用方负责开发环境门控及按 key 去重。 */
export function collectFieldTypeDiagnostics(
  fieldTypes: DiagnosticRecord,
  columns: unknown[]
): FieldTypeDiagnostic[] {
  const definitionResult = collectFieldTypeDefinitionDiagnostics(fieldTypes)
  const diagnostics = [...definitionResult.diagnostics]

  columns.forEach((columnValue, columnIndex) => {
    if (!isDiagnosticRecord(columnValue) || !Array.isArray(columnValue.formItems)) return
    columnValue.formItems.forEach((itemValue, itemIndex) => {
      if (!isDiagnosticRecord(itemValue) || typeof itemValue.type !== 'string') return
      const { type } = itemValue
      const location = describeItemLocation(columnValue, columnIndex, itemValue, itemIndex)
      const registered = Object.prototype.hasOwnProperty.call(fieldTypes, type)
      if (!isReservedFormItemType(type) && !registered) {
        const available = definitionResult.availableTypeNames.length
          ? ` Available custom types: ${definitionResult.availableTypeNames.map(name => `"${name}"`).join(', ')}.`
          : ' No custom field types are registered on this instance.'
        diagnostics.push({
          key: `unknown:${type}`,
          message: `[FormTable] Unknown field type "${type}" at ${location}.${available} Register it through fieldTypes or use type: "component".`
        })
        return
      }
      if (isReservedFormItemType(type) || !isDiagnosticRecord(itemValue.component)) return
      for (const key of forbiddenItemComponentKeys) {
        if (itemValue.component[key] !== undefined) {
          diagnostics.push({
            key: `item-key:${type}:${key}`,
            message: `[FormTable] Custom field type "${type}" cannot use item component.${key} at ${location}; use type: "component" or "slot" for advanced rendering.`
          })
        }
      }
    })
  })

  return diagnostics
}
