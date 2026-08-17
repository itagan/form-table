/** 表格字段允许承载的任意业务值。 */
export type FormTableValue = any
/** FormTable 使用的通用键值对象。 */
export type FormTableRecord = Record<string, FormTableValue>
/** 透传给 Vue/Element UI 组件的属性集合。 */
export type ComponentProps = Record<string, FormTableValue>

/** FormTable 自身管理 data/rowKey，Table 透传属性不再接受同名配置。 */
export type FormTableTableProps = ComponentProps & {
  data?: never
  rowKey?: never
}

/** FormTable 固定使用 { tableData } 作为 Form model。 */
export type FormTableFormProps = ComponentProps & { model?: never }

/** FormTable 根据行下标和 fieldKey 自动生成 FormItem prop。 */
export type FormTableFormItemProps = ComponentProps & { prop?: never }

/** 单条表格行数据。 */
export interface TableRow extends FormTableRecord {}

/**
 * 当前行的不可变更新内容。
 * 已声明的顶层字段保留原类型，同时允许运行时支持的点路径和数组下标路径。
 */
export type FormTableRowPatch<TRow extends TableRow = TableRow> = Partial<TRow> & Partial<Record<
  `${string}.${string}` | `${string}[${number}]${string}`,
  FormTableValue
>>

/** 支持直接值或根据运行时上下文计算的动态值。 */
export type DynamicValue<T, Context> = T | ((context: Context) => T)

/** 字段和表头 Hint 的唯一内容协议；false 显式关闭当前目标。 */
export type FormTableHintValue = string | false | null | undefined
/** 整个 FormTable 采用的提示展示方式；false 完全关闭 Hint。 */
export type FormTableHintMode = false | 'title' | 'tooltip'
/** 自动提示作用范围；默认仅处理字段。 */
export type FormTableHintTargets = 'field' | 'header' | 'all'
/** 字段 Hint 的触发区域；默认使用整个 FormItem。 */
export type FormTableHintTrigger = 'item' | 'content'
