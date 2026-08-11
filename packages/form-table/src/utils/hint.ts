import type {
  ComponentProps,
  FormTableHint,
  FormTableHintMode,
  ResolvedFormTableHint
} from '../types'

/** 事件委托使用的内部提示标记，不作为调用方配置入口。 */
export const FORM_TABLE_HINT_ATTRIBUTE = 'data-form-table-hint'
/** 标识事件委托所属的 FormTable 根实例，隔离嵌套表格。 */
export const FORM_TABLE_HINT_ROOT_ATTRIBUTE = 'data-form-table-hint-root'

/** 将字符串和对象 Hint 统一为 Slot 与自动展示逻辑共享的稳定结构。 */
export function resolveFormTableHint(
  hint: FormTableHint | null | undefined
): ResolvedFormTableHint | null {
  if (hint === null || hint === undefined) return null
  if (typeof hint === 'string') return { content: hint, ownership: 'table' }
  return {
    content: hint.content,
    ownership: hint.ownership || 'table'
  }
}

interface ApplyHintTargetOptions {
  /** Tooltip 模式下是否让托管目标默认进入 Tab 顺序。 */
  focusable?: boolean
}

/**
 * 自动托管的显式 Hint 覆盖同层透传 title；自定义托管时保持底层 props 不变。
 */
export function applyHintTargetProps(
  sourceProps: ComponentProps,
  hint: ResolvedFormTableHint | null,
  mode: FormTableHintMode,
  options: ApplyHintTargetOptions = {}
): ComponentProps {
  // 自定义渲染拥有完整控制权，FormTable 不改变底层 props。
  if (hint?.ownership === 'custom') return sourceProps

  const targetProps = { ...sourceProps }
  delete targetProps.title
  delete targetProps[FORM_TABLE_HINT_ATTRIBUTE]

  if (hint === null || hint.content === '') {
    return targetProps
  }

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
