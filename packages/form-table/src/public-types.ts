import type {
  EmptyFieldTypeRegistry,
  FieldTypeRegistry,
  FormTableComponent,
  TableRow
} from './types.public'

export * from './types.public'
export { defineFormTableColumns } from './defineFormTableColumns'
export { defineFormTableType } from './defineFormTableType'
export { defineFormTableTypes } from './defineFormTableTypes'

export declare function createFormTable<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
>(): FormTableComponent<TRow, TFieldTypes>

export declare const FormTable: FormTableComponent<TableRow>
declare const _default: FormTableComponent<TableRow>
export default _default
