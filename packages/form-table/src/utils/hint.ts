import type {
  ComponentProps,
  FormTableHintMode,
  FormTableHintTrigger,
  FormTableHintValue,
  TableRow
} from '../types/base'
import type { FormTableDefaultFieldHint } from '../types/config/hint'
import type { FormTableFieldRenderContext } from '../types/context'

/** 事件委托使用的内部提示标记，不作为调用方配置入口。 */
export const FORM_TABLE_HINT_ATTRIBUTE = 'data-form-table-hint'
/** 标识事件委托所属的 FormTable 根实例，隔离嵌套表格。 */
export const FORM_TABLE_HINT_ROOT_ATTRIBUTE = 'data-form-table-hint-root'
/** 标识字段 Hint 是否仅由内容根节点触发。 */
export const FORM_TABLE_HINT_TRIGGER_ATTRIBUTE = 'data-form-table-hint-trigger'
/** 为内容根节点回退警告提供稳定的字段标识。 */
export const FORM_TABLE_HINT_FIELD_ATTRIBUTE = 'data-form-table-hint-field'

/** 将公开 Hint 值归一化为自动展示使用的字符串。 */
export function resolveFormTableHint(hint: FormTableHintValue): string | null {
  if (typeof hint === 'number') return String(hint)
  return typeof hint === 'string' && hint !== '' ? hint : null
}

/** 字段非空内容覆盖默认值；false 关闭；未声明或空内容回退表级默认值。 */
export function resolveFormTableFieldHint<TRow extends TableRow = TableRow>(
  hint: FormTableHintValue,
  context: FormTableFieldRenderContext<TRow>,
  defaultHint?: FormTableDefaultFieldHint<TRow>
): string | null {
  if (hint === false) return null
  const explicitHint = resolveFormTableHint(hint)
  if (explicitHint) return explicitHint
  if (!defaultHint) return null
  const content = typeof defaultHint === 'function'
    ? defaultHint(context)
    : context.value == null || context.value === '' ? null : String(context.value)
  return resolveFormTableHint(content)
}

interface ApplyHintTargetOptions {
  /** Tooltip 模式下是否让托管目标默认进入 Tab 顺序。 */
  focusable?: boolean
  /** 字段 Tooltip 的触发区域。 */
  trigger?: FormTableHintTrigger
  /** 内容触发模式回退时用于诊断的字段路径。 */
  fieldKey?: string
}

/**
 * 有效的自动 Hint 在渲染属性中取代同层 title；其他情况保持底层 props 不变。
 */
export function applyHintTargetProps(
  sourceProps: ComponentProps,
  hint: string | null,
  mode: FormTableHintMode,
  options: ApplyHintTargetOptions = {}
): ComponentProps {
  if (hint === null || mode === false) return sourceProps

  const targetProps = { ...sourceProps }
  delete targetProps.title
  delete targetProps[FORM_TABLE_HINT_ATTRIBUTE]
  delete targetProps[FORM_TABLE_HINT_TRIGGER_ATTRIBUTE]
  delete targetProps[FORM_TABLE_HINT_FIELD_ATTRIBUTE]

  if (mode === 'tooltip') {
    const tooltipProps: ComponentProps = {
      ...targetProps,
      [FORM_TABLE_HINT_ATTRIBUTE]: hint
    }
    if (options.trigger === 'content') {
      tooltipProps[FORM_TABLE_HINT_TRIGGER_ATTRIBUTE] = 'content'
      tooltipProps[FORM_TABLE_HINT_FIELD_ATTRIBUTE] = options.fieldKey || ''
    }
    if (options.focusable && !Object.prototype.hasOwnProperty.call(sourceProps, 'tabindex')) {
      tooltipProps.tabindex = 0
    }
    return tooltipProps
  }

  if (options.trigger === 'content') return targetProps

  return {
    ...targetProps,
    title: hint
  }
}

/** content + title 将自动 Hint 下沉到组件 Props，显式组件 title 始终优先。 */
export function applyHintComponentProps(
  sourceProps: ComponentProps,
  hint: string | null,
  mode: FormTableHintMode,
  trigger: FormTableHintTrigger
): ComponentProps {
  if (
    hint === null
    || mode !== 'title'
    || trigger !== 'content'
    || Object.prototype.hasOwnProperty.call(sourceProps, 'title')
  ) return sourceProps

  return { ...sourceProps, title: hint }
}
