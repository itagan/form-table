import type { ComponentProps, FormTableHint, FormTableHintMode } from '../types'

/** 事件委托使用的内部提示标记，不作为调用方配置入口。 */
export const FORM_TABLE_HINT_ATTRIBUTE = 'data-form-table-hint'

/**
 * 显式 hint 始终覆盖同层透传 title；展示模式只决定最终使用哪个 DOM 属性。
 */
export function applyHintTargetProps(
  sourceProps: ComponentProps,
  hint: FormTableHint | null | undefined,
  mode: FormTableHintMode
): ComponentProps {
  const targetProps = { ...sourceProps }
  delete targetProps.title
  delete targetProps[FORM_TABLE_HINT_ATTRIBUTE]

  if (hint === undefined || hint === null) {
    return targetProps
  }

  if (mode === 'tooltip') {
    if (hint === '') return targetProps
    return {
      ...targetProps,
      [FORM_TABLE_HINT_ATTRIBUTE]: hint
    }
  }

  return {
    ...targetProps,
    title: hint
  }
}
