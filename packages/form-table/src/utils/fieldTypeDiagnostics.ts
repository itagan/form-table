import { isReservedFormItemType } from '../configs/defaultComponentConfigs'

interface FieldTypeDiagnostic {
  key: string
  message: string
}

type UnknownRecord = Record<string, unknown>

const definitionKeys = new Set(['is', 'model', 'props'])
const forbiddenItemComponentKeys = ['is', 'resolveComponent', 'slot', 'options', 'optionProps']

const isRecord = (value: unknown): value is UnknownRecord => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
)

const hasUsableTarget = (value: unknown) => isRecord(value) && (
  (typeof value.is === 'string' && value.is.trim().length > 0)
  || typeof value.is === 'function'
  || isRecord(value.is)
)

const describeItemLocation = (
  column: UnknownRecord,
  columnIndex: number,
  item: UnknownRecord,
  itemIndex: number
) => {
  const columnName = column.key || column.label || `#${columnIndex + 1}`
  const itemName = item.key || item.fieldKey || `#${itemIndex + 1}`
  return `column "${String(columnName)}", field "${String(itemName)}"`
}

const validateDefinition = (name: string, value: unknown): FieldTypeDiagnostic[] => {
  const prefix = `[FormTable] Invalid field type "${name}"`
  if (!isRecord(value)) {
    return [{ key: `definition:${name}`, message: `${prefix}: definition must be an object.` }]
  }

  const diagnostics: FieldTypeDiagnostic[] = []
  const unsupportedKeys = Object.keys(value).filter(key => !definitionKeys.has(key))
  if (unsupportedKeys.length) {
    diagnostics.push({
      key: `definition-keys:${name}:${unsupportedKeys.join(',')}`,
      message: `${prefix}: unsupported registration keys ${unsupportedKeys.map(key => `"${key}"`).join(', ')}; only is, model, and props are supported.`
    })
  }

  const target = value.is
  if (!(
    (typeof target === 'string' && target.trim().length > 0)
    || typeof target === 'function'
    || isRecord(target)
  )) {
    diagnostics.push({
      key: `definition-is:${name}`,
      message: `${prefix}: "is" must be a non-empty component name or a component object.`
    })
  }

  if (value.props !== undefined && typeof value.props !== 'function' && !isRecord(value.props)) {
    diagnostics.push({
      key: `definition-props:${name}`,
      message: `${prefix}: "props" must be an object or a synchronous function.`
    })
  }

  const model = value.model
  if (model !== undefined && model !== false) {
    if (!isRecord(model)) {
      diagnostics.push({
        key: `definition-model:${name}`,
        message: `${prefix}: "model" must be false or an object.`
      })
    } else {
      for (const key of ['prop', 'event']) {
        if (model[key] !== undefined && typeof model[key] !== 'string') {
          diagnostics.push({
            key: `definition-model-${key}:${name}`,
            message: `${prefix}: model.${key} must be a string.`
          })
        }
      }
      for (const key of ['valueToProp', 'valueFromEvent']) {
        if (model[key] !== undefined && typeof model[key] !== 'function') {
          diagnostics.push({
            key: `definition-model-${key}:${name}`,
            message: `${prefix}: model.${key} must be a synchronous function.`
          })
        }
      }
    }
  }
  return diagnostics
}

/** 收集实例级注册和引用问题；调用方负责开发环境门控及按 key 去重。 */
export function collectFieldTypeDiagnostics(
  fieldTypes: UnknownRecord,
  columns: unknown[]
): FieldTypeDiagnostic[] {
  const diagnostics: FieldTypeDiagnostic[] = []
  const customNames = Object.keys(fieldTypes).filter(name => (
    !isReservedFormItemType(name) && hasUsableTarget(fieldTypes[name])
  ))

  for (const name of Object.keys(fieldTypes)) {
    if (isReservedFormItemType(name)) {
      diagnostics.push({
        key: `reserved:${name}`,
        message: `[FormTable] Field type "${name}" is reserved; the registered definition is ignored.`
      })
      continue
    }
    diagnostics.push(...validateDefinition(name, fieldTypes[name]))
  }

  columns.forEach((columnValue, columnIndex) => {
    if (!isRecord(columnValue) || !Array.isArray(columnValue.formItems)) return
    columnValue.formItems.forEach((itemValue, itemIndex) => {
      if (!isRecord(itemValue) || typeof itemValue.type !== 'string') return
      const { type } = itemValue
      const location = describeItemLocation(columnValue, columnIndex, itemValue, itemIndex)
      const registered = Object.prototype.hasOwnProperty.call(fieldTypes, type)
      if (!isReservedFormItemType(type) && !registered) {
        const available = customNames.length
          ? ` Available custom types: ${customNames.map(name => `"${name}"`).join(', ')}.`
          : ' No custom field types are registered on this instance.'
        diagnostics.push({
          key: `unknown:${type}`,
          message: `[FormTable] Unknown field type "${type}" at ${location}.${available} Register it through fieldTypes or use type: "component".`
        })
        return
      }
      if (isReservedFormItemType(type) || !isRecord(itemValue.component)) return
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
