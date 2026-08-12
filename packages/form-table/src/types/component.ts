import type { Component, DefineComponent } from 'vue'
import type {
  ComponentProps,
  FormTableValue,
  ResolvedFormTableHint,
  TableRow
} from './base'
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

export interface ResolvedHeaderConfig {
  props: ComponentProps
  hint: ResolvedFormTableHint | null
}

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

export interface FormTableElementTableRef {
  [key: string]: FormTableValue
}

export interface FormTableExpose {
  validate: (callback?: (valid: boolean, fields?: FormTableValue) => void) => Promise<boolean>
  clearValidate: (fieldProps?: string | string[]) => void
  getFormRef: () => FormTableElementFormRef | null
  getTableRef: () => FormTableElementTableRef | null
}

export type FormTableComponent<TRow extends TableRow = TableRow> = DefineComponent<
Omit<FormTableProps<TRow>, 'tableData'> & (
  | { value: TRow[], tableData?: TRow[] }
  | { tableData: TRow[], value?: TRow[] }
),
FormTableExpose,
Record<string, never>,
Record<string, never>,
Record<string, never>,
Record<string, never>,
Record<string, never>,
FormTableEmits<TRow>,
keyof FormTableEmits<TRow>
>
