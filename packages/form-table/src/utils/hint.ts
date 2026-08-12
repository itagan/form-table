import type {
  ComponentProps,
  FormTableFieldHint,
  FormTableHint,
  FormTableHintMode,
  ResolvedFormTableHint,
  TableRow
} from '../types/base'
import type { FormTableDefaultFieldHint } from '../types/config'
import type { FormTableFieldRenderContext } from '../types/context'

/** 事件委托使用的内部提示标记，不作为调用方配置入口。 */
export const FORM_TABLE_HINT_ATTRIBUTE = 'data-form-table-hint'
/** 标识事件委托所属的 FormTable 根实例，隔离嵌套表格。 */
export const FORM_TABLE_HINT_ROOT_ATTRIBUTE = 'data-form-table-hint-root'

/** 将字符串和对象 Hint 统一为 Slot 与自动展示逻辑共享的稳定结构。 */
export function resolveFormTableHint(
  hint: FormTableHint | null | undefined
): ResolvedFormTableHint | null {
  if (hint === null || hint === undefined || hint === '') return null
  if (typeof hint === 'string') return { content: hint, behavior: 'auto' }
  if (hint.content === '') return null
  return {
    content: hint.content,
    behavior: hint.behavior || 'auto'
  }
}

/** 字段非空内容覆盖默认值；false 关闭；未声明或空内容回退表级默认值。 */
export function resolveFormTableFieldHint<TRow extends TableRow = TableRow>(
  hint: FormTableFieldHint | null | undefined,
  context: FormTableFieldRenderContext<TRow>,
  defaultHint?: FormTableDefaultFieldHint<TRow>
): ResolvedFormTableHint | null {
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
}

/**
 * 有效的自动 Hint 在渲染属性中取代同层 title；其他情况保持底层 props 不变。
 */
export function applyHintTargetProps(
  sourceProps: ComponentProps,
  hint: ResolvedFormTableHint | null,
  mode: FormTableHintMode,
  options: ApplyHintTargetOptions = {}
): ComponentProps {
  if (hint === null || hint.behavior === 'custom') return sourceProps

  const targetProps = { ...sourceProps }
  delete targetProps.title
  delete targetProps[FORM_TABLE_HINT_ATTRIBUTE]

  if (mode === 'tooltip') {
    const tooltipProps: ComponentProps = {
      ...targetProps,
      [FORM_TABLE_HINT_ATTRIBUTE]: hint.content
    }
    if (options.focusable && !Object.prototype.hasOwnProperty.call(sourceProps, 'tabindex')) {
      tooltipProps.tabindex = 0
    }
    return tooltipProps
  }

  return {
    ...targetProps,
    title: hint.content
  }
}
