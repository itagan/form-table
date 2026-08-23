import type {
  ComponentProps,
  FormTableHintValue,
  TableRow
} from '../base'
import type { FormTableFieldRenderContext } from '../context'

/** 根据基础字段上下文统一生成快捷 Hint 内容。 */
export type FormTableFieldHintFormatter<TRow extends TableRow = TableRow> = (
  context: FormTableFieldRenderContext<TRow>
) => FormTableHintValue

/** 未显式提供内容的字段所继承的默认 Hint。 */
export type FormTableDefaultFieldHint<TRow extends TableRow = TableRow> =
  | boolean
  | FormTableFieldHintFormatter<TRow>

/** FormTable 自动提示策略；Tooltip 属性仅在对应模式下有效。 */
export interface FormTableHintOptions<TRow extends TableRow = TableRow> {
  mode?: false | 'title' | 'tooltip'
  targets?: 'field' | 'header' | 'all'
  /** false/未配置关闭默认字段内容；true 默认字符串化；函数统一格式化。 */
  field?: FormTableDefaultFieldHint<TRow>
  tooltipProps?: ComponentProps
}
