/** 表格字段允许承载的任意业务值。 */
export type FormTableValue = any
/** FormTable 使用的通用键值对象。 */
export type FormTableRecord = Record<string, FormTableValue>
/** 透传给 Vue/Element UI 组件的属性集合。 */
export type ComponentProps = Record<string, FormTableValue>

/** FormTable 自身管理 rowKey，Table 透传属性不再接受同名配置。 */
export type FormTableTableProps = ComponentProps & { rowKey?: never }

/** 单条表格行数据。 */
export interface TableRow extends FormTableRecord {}

/** 支持直接值或根据运行时上下文计算的动态值。 */
export type DynamicValue<T, Context> = T | ((context: Context) => T)

/** 由 FormTable 或自定义渲染消费的提示配置。 */
export interface FormTableHintConfig {
  content: string
  /** auto 由 FormTable 处理展示与可访问性；custom 交给调用方。 */
  behavior?: 'auto' | 'custom'
}
/** FormTable 外层提示内容；字符串保持自动托管语义。 */
export type FormTableHint = string | FormTableHintConfig
/** 字段可用 false 关闭默认 Hint，或提供自己的提示内容。 */
export type FormTableFieldHint = false | FormTableHint
/** 动态 Hint 求值后提供给内部渲染与 Slot 的标准结构。 */
export interface ResolvedFormTableHint {
  content: string
  behavior: 'auto' | 'custom'
}
/** 整个 FormTable 统一采用的提示展示方式。 */
export type FormTableHintMode = 'title' | 'tooltip'
