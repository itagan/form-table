import type { Component, DefineComponent } from 'vue'
import type { ElForm } from 'element-ui/types/form'
import type { ElTable } from 'element-ui/types/table'
import type { ComponentProps, FormTableRowUpdate, FormTableValue, TableRow } from './base'
import type {
  FieldModelConfig,
  EmptyFieldTypeRegistry,
  FieldTypeRegistry,
  FormItemOption,
  OptionPropsConfig
} from './config/field'
import type { FormTableEmits } from './config/events'
import type { FormTableProps, FormTableRowKey } from './config/form-table'
import type {
  FormTableColumnContext,
  FormTableFieldContext
} from './context'

/** 字段配置经动态求值后交给渲染器的组件描述。 */
export interface ResolvedComponentConfig<TRow extends TableRow = TableRow> {
  /** 最终 Vue 组件或已注册的组件名称。 */
  is?: string | Component
  /** slot 字段解析后的具名 Slot 名称。 */
  slot?: string
  /** 已合并自定义类型默认值和字段级配置的组件属性。 */
  props: ComponentProps
  /** 已注入字段更新上下文的组件监听器。 */
  listeners: Record<string, (...args: unknown[]) => void>
  /** 已解析的选项型组件数据。 */
  options: FormItemOption[]
  /** 选项对象字段映射。 */
  optionProps?: OptionPropsConfig
  /** 最终采用的受控值协议。 */
  model?: FieldModelConfig<TRow> | false
}

/** FormItem label/error Slot 共用的字段上下文，并附带当前校验路径。 */
export interface FormTableFormItemSlotContext<TRow extends TableRow = TableRow> extends FormTableFieldContext<TRow> {
  /** Element Form 使用的完整 prop 路径；无法定位数据源行时为 undefined。 */
  propPath: string | undefined
}

/** FormItem error Slot 上下文。 */
export interface FormTableFormItemErrorSlotContext<TRow extends TableRow = TableRow> extends FormTableFormItemSlotContext<TRow> {
  /** Element Form 当前校验错误文本。 */
  error: string
}

/** 字段内容 Slot 上下文，并暴露同字段配置一致的已解析组件描述。 */
export interface FormTableSlotContext<TRow extends TableRow = TableRow> extends FormTableFormItemSlotContext<TRow> {
  component: ResolvedComponentConfig<TRow>
}

/** 表头具名 Slot 上下文。 */
export interface FormTableHeaderSlotContext<TRow extends TableRow = TableRow> extends FormTableColumnContext<TRow> {
  /** 当前列在可见列集合中的下标。 */
  columnIndex: number
  /** 合并列配置与 Element Column props 后的表头文本。 */
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
  /** 校验整个表单；失败时返回 false，并将错误字段传给可选回调。 */
  validate: (callback?: (valid: boolean, fields?: FormTableValue) => void) => Promise<boolean>
  /** 清除全部或指定字段路径的校验状态。 */
  clearValidate: (fieldProps?: string | string[]) => void
  /** 获取当前已挂载字段的 Element Form 完整 prop 路径。 */
  getFieldProp: (row: TRow, fieldKey: string) => string | undefined
  /** 通过业务行与字段路径校验当前已挂载字段。 */
  validateField: (row: TRow, fieldKey: string) => Promise<boolean>
  /** 通过业务行与字段路径清除当前已挂载字段的校验状态。 */
  clearFieldValidate: (row: TRow, fieldKey: string) => void
  /** 聚焦当前已挂载字段内的首个可交互元素。 */
  focusField: (row: TRow, fieldKey: string) => Promise<boolean>
  /** 滚动到首个错误 FormItem，并尽可能聚焦其中的可交互元素。 */
  scrollToFirstError: () => Promise<boolean>
  /** 原子更新多行；成功时只发出一次受控数组更新。 */
  updateRows: (updates: FormTableRowUpdate<TRow>[]) => boolean
  /** 获取底层 Element Form 实例；挂载完成前返回 null。 */
  getFormRef: () => FormTableElementFormRef | null
  /** 获取底层 Element Table 实例；挂载完成前返回 null。 */
  getTableRef: () => FormTableElementTableRef<TRow> | null
}

/** vue-tsc 的 Vue 3 target 会把无参数 v-model 暂时表示为 modelValue。 */
type FormTableTemplateProps<
  TRow extends TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow>
> = Omit<FormTableProps<TRow, TFieldTypes>, 'tableData'> & (
  | { tableData: TRow[], modelValue?: never }
  | { modelValue: TRow[], tableData?: TRow[] }
)

/**
 * 带业务行和自定义字段注册表泛型的 FormTable 组件类型。
 *
 * modelValue 分支只适配 vue-tsc 的模板中间表示，不对应运行时 Prop 或事件。
 * 对外运行时 Props 以 FormTableProps 的 tableData 为唯一数据源。
 */
export type FormTableComponent<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
> = DefineComponent<
FormTableTemplateProps<TRow, TFieldTypes>,
FormTableExpose<TRow>,
Record<string, never>,
Record<string, never>,
Record<string, never>,
Record<string, never>,
Record<string, never>,
FormTableEmits<TRow>,
keyof FormTableEmits<TRow>
> & {
  model: {
    prop: 'tableData'
    event: 'update:tableData'
  }
}
