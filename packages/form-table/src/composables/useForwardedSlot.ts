import { computed } from 'vue'
import type { FormTableSlots, FormTableValue } from '../types'

/**
 * 保留稳定的 Slot 包装函数，调用时再按名称读取父级最新闭包。
 * Vue 2 会在父级重渲染时原位更新 Slot 集合，因此不能长期持有其中的旧函数。
 */
export function useForwardedSlot<TContext>(
  slots: FormTableSlots,
  getSlotName: () => string | undefined
) {
  const slotFn = computed(() => {
    const slotName = getSlotName()
    if (!slotName) return null
    return (context: TContext): FormTableValue => slots[slotName]?.(context) ?? null
  })

  const hasSlot = () => {
    const slotName = getSlotName()
    return Boolean(slotName && slots[slotName])
  }

  return { slotFn, hasSlot }
}
