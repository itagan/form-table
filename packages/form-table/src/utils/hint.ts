import type {
  ComponentProps,
  FormTableHint,
  FormTableHintMode,
  ResolvedFormTableHint
} from '../types'

/** 事件委托使用的内部提示标记，不作为调用方配置入口。 */
export const FORM_TABLE_HINT_ATTRIBUTE = 'data-form-table-hint'

/** 将字符串和对象 Hint 统一为 Slot 与自动展示逻辑共享的稳定结构。 */
export function resolveFormTableHint(
  hint: FormTableHint | null | undefined
): ResolvedFormTableHint | null {
  if (hint === null || hint === undefined) return null
  if (typeof hint === 'string') return { content: hint, auto: true }
  return {
    content: hint.content,
    auto: hint.auto !== false
  }
}

/**
 * 自动托管的显式 Hint 覆盖同层透传 title；自定义托管时保持底层 props 不变。
 */
export function applyHintTargetProps(
  sourceProps: ComponentProps,
  hint: ResolvedFormTableHint | null,
  mode: FormTableHintMode
): ComponentProps {
  // 自定义渲染拥有完整控制权，FormTable 不改变底层 props。
  if (hint?.auto === false) return sourceProps

  const targetProps = { ...sourceProps }
  delete targetProps.title
  delete targetProps[FORM_TABLE_HINT_ATTRIBUTE]

  if (hint === null || hint.content === '') {
    return targetProps
  }

  if (mode === 'tooltip') {
    return {
      ...targetProps,
      [FORM_TABLE_HINT_ATTRIBUTE]: hint.content
    }
  }

  return {
    ...targetProps,
    title: hint.content
  }
}
