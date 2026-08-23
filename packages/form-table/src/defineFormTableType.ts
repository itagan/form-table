import type {
  ComponentProps,
  FieldTypeDefinition,
  FieldTypeEventMap,
  TableRow,
  TypedFieldTypeDefinition
} from './types'

/**
 * 为单个注册 type 声明可选的 Props/事件协议；运行时原样返回定义对象。
 */
export function defineFormTableType<TRow extends TableRow = TableRow>() {
  return <
    TProps extends object = ComponentProps,
    TEvents extends Record<keyof TEvents, unknown[]> = FieldTypeEventMap
  >(
    definition: FieldTypeDefinition<TRow, TProps, TEvents>
  ): TypedFieldTypeDefinition<TRow, TProps, TEvents> => (
    definition as TypedFieldTypeDefinition<TRow, TProps, TEvents>
  )
}
