import { isReservedFormItemType } from '../configs/defaultComponentConfigs'

export interface FieldTypeDiagnostic {
  key: string
  message: string
}

export type DiagnosticRecord = Record<string, unknown>

export const isDiagnosticRecord = (value: unknown): value is DiagnosticRecord => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
)

const definitionKeys = new Set(['is', 'model', 'props'])

const hasUsableTarget = (value: unknown) => isDiagnosticRecord(value) && (
  (typeof value.is === 'string' && value.is.trim().length > 0)
  || typeof value.is === 'function'
  || isDiagnosticRecord(value.is)
)

const validateDefinition = (name: string, value: unknown): FieldTypeDiagnostic[] => {
  const prefix = `[FormTable] Invalid field type "${name}"`
  if (!isDiagnosticRecord(value)) {
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
    || isDiagnosticRecord(target)
  )) {
    diagnostics.push({
      key: `definition-is:${name}`,
      message: `${prefix}: "is" must be a non-empty component name or a component object.`
    })
  }

  if (value.props !== undefined && typeof value.props !== 'function' && !isDiagnosticRecord(value.props)) {
    diagnostics.push({
      key: `definition-props:${name}`,
      message: `${prefix}: "props" must be an object or a synchronous function.`
    })
  }

  const model = value.model
  if (model !== undefined && model !== false) {
    if (!isDiagnosticRecord(model)) {
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

/** 校验实例级字段类型注册，并返回可用于未知类型提示的有效名称。 */
export function collectFieldTypeDefinitionDiagnostics(fieldTypes: DiagnosticRecord) {
  const diagnostics: FieldTypeDiagnostic[] = []
  const availableTypeNames = Object.keys(fieldTypes).filter(name => (
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

  return { diagnostics, availableTypeNames }
}
