import { isReservedFormItemType } from './configs/defaultComponentConfigs'
import type {
  FieldTypeRegistry,
  ReservedFormItemType,
  TableRow
} from './types'

type WithoutReservedNames = Partial<Record<ReservedFormItemType, never>>

/**
 * 为实例级业务字段类型保留名称字面量和行上下文类型；运行时原样返回注册表。
 */
export function defineFormTableTypes<TRow extends TableRow = TableRow>() {
  return <TFieldTypes extends FieldTypeRegistry<TRow>>(
    fieldTypes: TFieldTypes & WithoutReservedNames
  ): TFieldTypes => {
    const reservedName = Object.keys(fieldTypes).find(isReservedFormItemType)
    if (reservedName) {
      throw new Error(`[FormTable] Field type "${reservedName}" is reserved and cannot be registered.`)
    }
    return fieldTypes
  }
}
