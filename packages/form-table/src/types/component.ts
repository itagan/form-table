import type { Component, DefineComponent } from 'vue'
import type { ComponentProps, FormTableValue, TableRow } from './base'
import type {
  FieldModelConfig,
  FormItemOption,
  FormTableEmits,
  FormTableProps,
  OptionPropsConfig
} from './config'
import type {
  FormTableColumnContext,
  FormTableFieldContext
} from './context'

export interface ResolvedComponentConfig {
  renderer?: string | Component
  props: ComponentProps
  listeners: Record<string, (...args: unknown[]) => void>
  options: FormItemOption[]
  optionProps?: OptionPropsConfig
  model?: FieldModelConfig | boolean
}

export interface ResolvedHeaderConfig { props: ComponentProps }

export interface FormTableSlotContext<TRow extends TableRow = TableRow> extends FormTableFieldContext<TRow> {
  propPath: string
  component: ResolvedComponentConfig
}

export interface FormTableHeaderSlotContext<TRow extends TableRow = TableRow> extends FormTableColumnContext<TRow> {
  columnIndex: number
  label: string
  header: ResolvedHeaderConfig
}

export type FormTableSlotFn<T = FormTableValue> = (slotProps: T) => FormTableValue
export type FormTableSlots = Record<string, FormTableSlotFn | undefined>

export interface FormTableElementFormRef {
  validate?: (callback?: (valid: boolean, fields?: FormTableValue) => void) => Promise<boolean> | boolean
  validateField?: (fieldProp: string, callback?: (message: string) => void) => void
  resetFields?: () => void
  clearValidate?: (fieldProps?: string | string[]) => void
}

export interface FormTableElementTableRef<TRow extends TableRow = TableRow> {
  clearSelection?: () => void
  toggleRowSelection?: (row: TRow, selected?: boolean) => void
  toggleAllSelection?: () => void
  setCurrentRow?: (row?: TRow) => void
  toggleRowExpansion?: (row: TRow, expanded?: boolean) => void
  clearSort?: () => void
  clearFilter?: () => void
  doLayout?: () => void
  sort?: (prop: string, order: 'ascending' | 'descending') => void
  [key: string]: FormTableValue
}

export interface FormTableExpose<TRow extends TableRow = TableRow> {
  validate: (callback?: (valid: boolean, fields?: FormTableValue) => void) => Promise<boolean>
  clearValidate: (fieldProps?: string | string[]) => void
  getFormRef: () => FormTableElementFormRef | null
  getTableRef: () => FormTableElementTableRef<TRow> | null
}

export type FormTableComponent<TRow extends TableRow = TableRow> = DefineComponent<
Omit<FormTableProps<TRow>, 'tableData'> & (
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
