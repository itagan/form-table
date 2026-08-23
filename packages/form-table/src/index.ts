import FormTable from './index.vue'
import type {
  EmptyFieldTypeRegistry,
  FieldTypeRegistry,
  FormTableComponent,
  TableRow
} from './types.public'
export { defineFormTableColumns } from './defineFormTableColumns'
export { defineFormTableType } from './defineFormTableType'
export { defineFormTableTypes } from './defineFormTableTypes'

export * from './types.public'
export { FormTable }

/** 返回同一运行时组件的业务行泛型视图，不创建包装组件或额外实例。 */
export function createFormTable<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
>(): FormTableComponent<TRow, TFieldTypes> {
  return FormTable as unknown as FormTableComponent<TRow, TFieldTypes>
}

export default FormTable
