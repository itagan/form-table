import type { Component, DefineComponent } from 'vue'
import type { ElForm } from 'element-ui/types/form'
import type { ElTable } from 'element-ui/types/table'
import type { ComponentProps, FormTableValue, TableRow } from './base'
import type {
  FieldModelConfig,
  EmptyFieldTypeRegistry,
  FieldTypeRegistry,
  FormItemOption,
  FormTableEmits,
  FormTableProps,
  FormTableRowKey,
  OptionPropsConfig
} from './config'
import type {
  FormTableColumnContext,
  FormTableFieldContext
} from './context'

export interface ResolvedComponentConfig<TRow extends TableRow = TableRow> {
  is?: string | Component
  slot?: string
  props: ComponentProps
  listeners: Record<string, (...args: unknown[]) => void>
  options: FormItemOption[]
  optionProps?: OptionPropsConfig
  model?: FieldModelConfig<TRow> | false
}

export interface FormTableFormItemSlotContext<TRow extends TableRow = TableRow> extends FormTableFieldContext<TRow> {
  propPath: string
}

export interface FormTableFormItemErrorSlotContext<TRow extends TableRow = TableRow> extends FormTableFormItemSlotContext<TRow> {
  error: string
}

export interface FormTableSlotContext<TRow extends TableRow = TableRow> extends FormTableFormItemSlotContext<TRow> {
  component: ResolvedComponentConfig<TRow>
}

export interface FormTableHeaderSlotContext<TRow extends TableRow = TableRow> extends FormTableColumnContext<TRow> {
  columnIndex: number
  label: string
}

export type FormTableSlotFn<T = FormTableValue> = (slotProps: T) => FormTableValue
export type FormTableSlots = Record<string, FormTableSlotFn | undefined>

/** FormTable 返回当前项目安装的 Element UI Form 原生实例。 */
export type FormTableElementFormRef = ElForm

/** Element Table 原生实例，并为数据与行方法补充业务行泛型。 */
export type FormTableElementTableRef<TRow extends TableRow = TableRow> = Omit<
  ElTable,
  'data' | 'rowKey' | 'toggleRowSelection' | 'setCurrentRow' | 'toggleRowExpansion' | 'sort'
> & {
  data: TRow[]
  rowKey?: FormTableRowKey<TRow>
  toggleRowSelection: (row: TRow, selected?: boolean) => void
  setCurrentRow: (row?: TRow) => void
  toggleRowExpansion: (row: TRow, expanded?: boolean) => void
  sort: (prop: string, order: 'ascending' | 'descending') => void
}

export interface FormTableExpose<TRow extends TableRow = TableRow> {
  validate: (callback?: (valid: boolean, fields?: FormTableValue) => void) => Promise<boolean>
  clearValidate: (fieldProps?: string | string[]) => void
  getFormRef: () => FormTableElementFormRef | null
  getTableRef: () => FormTableElementTableRef<TRow> | null
}

export type FormTableComponent<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
> = DefineComponent<
Omit<FormTableProps<TRow, TFieldTypes>, 'tableData'> & (
  | { value: TRow[], tableData?: TRow[] }
  | { tableData: TRow[], value?: TRow[] }
),
FormTableExpose<TRow>,
Record<string, never>,
Record<string, never>,
Record<string, never>,
Record<string, never>,
Record<string, never>,
FormTableEmits<TRow>,
keyof FormTableEmits<TRow>
>
