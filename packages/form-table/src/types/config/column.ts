import type {
  ComponentProps,
  DynamicValue,
  FormTableHintValue,
  FormTableRowPatch,
  TableRow
} from '../base'
import type {
  FormTableColumnContext,
  FormTableRowContext
} from '../context'
import type {
  EmptyFieldTypeRegistry,
  FieldTypeRegistry,
  FormItemConfig
} from './field'

interface BaseColumnConfig<TRow extends TableRow = TableRow> {
  key?: string
  label: string
  headerSlot?: string
  headerProps?: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
  headerHint?: DynamicValue<FormTableHintValue, FormTableColumnContext<TRow>>
  visible?: DynamicValue<boolean, FormTableColumnContext<TRow>>
  props?: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
}

export interface LayoutColumnConfig<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
> extends BaseColumnConfig<TRow> {
  rowProps?: DynamicValue<ComponentProps, FormTableRowContext<TRow>>
  formItems: FormItemConfig<TRow, TFieldTypes>[]
  cellSlot?: never
}

export interface NativeColumnConfig<TRow extends TableRow = TableRow> {
  key?: string
  label?: string
  visible?: DynamicValue<boolean, FormTableColumnContext<TRow>>
  props: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
  formItems?: never
  cellSlot?: never
  headerSlot?: never
  headerProps?: never
  headerHint?: never
  rowProps?: never
}

export interface CellSlotColumnConfig<TRow extends TableRow = TableRow> extends BaseColumnConfig<TRow> {
  cellSlot: string
  formItems?: never
  rowProps?: never
}

export interface FormTableCellSlotContext<TRow extends TableRow = TableRow> {
  row: Readonly<TRow>
  /** 当前行在受控 tableData 中的数据源下标。 */
  index: number
  /** 当前行经过 Element Table 排序或筛选后的显示下标。 */
  displayIndex: number
  columnConfig: Readonly<CellSlotColumnConfig<TRow>>
  updateRow: (patch: FormTableRowPatch<TRow>) => void
}

export type ColumnConfig<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
> =
  | LayoutColumnConfig<TRow, TFieldTypes>
  | CellSlotColumnConfig<TRow>
  | NativeColumnConfig<TRow>
