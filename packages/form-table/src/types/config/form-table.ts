import type {
  FormTableFormProps,
  FormTableTableProps,
  FormTableValue,
  TableRow
} from '../base'
import type { ColumnConfig } from './column'
import type {
  EmptyFieldTypeRegistry,
  FieldTypeRegistry
} from './field'
import type { FormTableHintOptions } from './hint'

export type FormTableRowKey<TRow extends TableRow = TableRow> =
  | string
  | ((row: TRow) => FormTableValue)

interface BaseFormTableProps<
  TRow extends TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow>
> {
  tableData: TRow[]
  columns: ColumnConfig<TRow, TFieldTypes>[]
  rowKey?: FormTableRowKey<TRow>
  formProps?: FormTableFormProps
  tableProps?: FormTableTableProps
  hintOptions?: FormTableHintOptions<TRow>
  loading?: boolean
}

type FormTableFieldTypesProp<TFieldTypes> = keyof TFieldTypes extends never
  ? { fieldTypes?: never }
  : { fieldTypes: TFieldTypes }

export type FormTableProps<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
> = BaseFormTableProps<TRow, TFieldTypes> & FormTableFieldTypesProp<TFieldTypes>
