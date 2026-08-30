import { reactive, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import type { FormTableSlots } from '../../types'
import { useForwardedSlot } from '../useForwardedSlot'

describe('useForwardedSlot', () => {
  it('tracks slot names and reports missing slots', () => {
    const slotName = ref<string | undefined>('first')
    const slots = reactive<FormTableSlots>({
      first: context => `first:${context}`
    })
    const forwarded = useForwardedSlot<string>(slots, () => slotName.value)

    expect(forwarded.hasSlot()).toBe(true)
    expect(forwarded.slotFn.value?.('value')).toBe('first:value')

    slotName.value = 'missing'
    expect(forwarded.hasSlot()).toBe(false)
    expect(forwarded.slotFn.value?.('value')).toBeNull()

    slotName.value = undefined
    expect(forwarded.slotFn.value).toBeNull()
  })

  it('uses the latest function from a Vue 2 style slot collection', () => {
    const slots = reactive<FormTableSlots>({
      field: context => `old:${context}`
    })
    const forwarded = useForwardedSlot<string>(slots, () => 'field')
    const stableWrapper = forwarded.slotFn.value

    slots.field = context => `new:${context}`

    expect(forwarded.slotFn.value).toBe(stableWrapper)
    expect(stableWrapper?.('value')).toBe('new:value')
  })
})
