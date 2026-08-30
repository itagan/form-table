import type { Wrapper } from '@vue/test-utils'
import type Vue from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { FormTableHintTooltipRef } from '../composables/useFormTableHintTooltip'
import { mountFormTable } from './test-utils'

const getHintTooltip = (wrapper: Wrapper<Vue>) => {
  const controller = (wrapper.vm.$refs as Record<string, any>).hintTooltipControllerRef
  return controller.$refs.tooltipRef as FormTableHintTooltipRef & {
    content: string
    placement: string
    popperClass: string
    openDelay: number
    manual: boolean
    enterable: boolean
    tooltipId: string
  }
}

const dispatchFocusEvent = (
  element: Element,
  type: 'focusin' | 'focusout',
  relatedTarget: EventTarget | null = null
) => element.dispatchEvent(new FocusEvent(type, { bubbles: true, relatedTarget }))

const flushTooltip = async (wrapper: Wrapper<Vue>) => {
  await new Promise(resolve => setTimeout(resolve, 0))
  await wrapper.vm.$nextTick()
}

const createRect = (width = 120, height = 32): DOMRect => ({
  x: 0,
  y: 0,
  width,
  height,
  top: 0,
  right: width,
  bottom: height,
  left: 0,
  toJSON: () => ({})
})

const setElementRect = (element: Element, width = 120, height = 32) => (
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(createRect(width, height))
)

describe('FormTable tooltip hint interaction', () => {
  it('supports pointer, keyboard, Escape, ARIA tokens, and nested root isolation', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{ label: '字段', formItems: [{
        fieldKey: 'name', type: 'slot', hint: '字段说明', hintTrigger: 'content', component: { slot: 'content' }
      }] }],
      scopedSlots: { content: '<button class="target">字段</button>' }
    })
    await wrapper.vm.$nextTick()
    const tooltip = getHintTooltip(wrapper)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    const close = vi.spyOn(tooltip, 'handleClosePopper').mockImplementation(() => undefined)
    const target = wrapper.find('.target')
    setElementRect(target.element)
    target.element.setAttribute('aria-describedby', 'existing')

    await target.trigger('mouseover')
    await flushTooltip(wrapper)
    expect(show).toHaveBeenCalledTimes(1)
    expect(tooltip.content).toBe('字段说明')

    dispatchFocusEvent(target.element, 'focusin')
    target.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushTooltip(wrapper)
    expect(close).toHaveBeenCalled()
    expect(target.attributes('aria-describedby')).toBe('existing')
    dispatchFocusEvent(target.element, 'focusout')

    const callsBeforeNested = show.mock.calls.length
    const nestedRoot = document.createElement('div')
    nestedRoot.setAttribute('data-form-table-hint-root', '')
    const nested = document.createElement('button')
    nested.setAttribute('data-form-table-hint', '内层说明')
    nestedRoot.appendChild(nested)
    wrapper.find('.form-table-container').element.appendChild(nestedRoot)
    nested.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    await flushTooltip(wrapper)
    expect(show).toHaveBeenCalledTimes(callsBeforeNested)
    wrapper.destroy()
  })

  it('keeps pointer suppression until focus moves to another hint target', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      tableData: [{ first: 'A', second: 'B' }],
      columns: [{
        label: '字段',
        formItems: [
          { fieldKey: 'first', type: 'input', hint: '第一个说明' },
          { fieldKey: 'second', type: 'input', hint: '第二个说明' }
        ]
      }]
    })
    await wrapper.vm.$nextTick()
    const tooltip = getHintTooltip(wrapper)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    const close = vi.spyOn(tooltip, 'handleClosePopper').mockImplementation(() => undefined)
    const inputs = wrapper.findAll('input')
    const firstInput = inputs.at(0).element
    const secondInput = inputs.at(1).element

    dispatchFocusEvent(firstInput, 'focusin')
    firstInput.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    await flushTooltip(wrapper)
    expect(tooltip.content).toBe('第一个说明')

    firstInput.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    await flushTooltip(wrapper)
    expect(close).toHaveBeenCalled()
    const showCallsAfterPointerLeave = show.mock.calls.length

    firstInput.setAttribute('class', 'changed-while-focused')
    await flushTooltip(wrapper)
    expect(show).toHaveBeenCalledTimes(showCallsAfterPointerLeave)

    dispatchFocusEvent(firstInput, 'focusout', secondInput)
    dispatchFocusEvent(secondInput, 'focusin', firstInput)
    await flushTooltip(wrapper)
    expect(tooltip.content).toBe('第二个说明')
    expect(show.mock.calls.length).toBeGreaterThan(showCallsAfterPointerLeave)
    wrapper.destroy()
  })

  it('keeps the next tooltip open when the pointer moves directly between fields', async () => {
    vi.useFakeTimers()
    let wrapper: Wrapper<Vue> | null = null
    try {
      wrapper = mountFormTable({
        hintOptions: { mode: 'tooltip', tooltipProps: { openDelay: 100 } },
        tableData: [{ name: 'Alice', amount: 128.5 }],
        columns: [
          { label: '姓名', formItems: [{ fieldKey: 'name', type: 'input', hint: '姓名说明' }] },
          { label: '金额', formItems: [{ fieldKey: 'amount', type: 'number', hint: '金额说明' }] }
        ]
      })
      await wrapper.vm.$nextTick()
      const tooltip = getHintTooltip(wrapper) as FormTableHintTooltipRef & {
        content: string
        showPopper: boolean
      }
      const close = vi.spyOn(tooltip, 'handleClosePopper')
      const fields = wrapper.findAll('.el-form-item')
      const firstInput = fields.at(0).find('input').element
      const secondInput = fields.at(1).find('input').element

      firstInput.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      await wrapper.vm.$nextTick()
      vi.advanceTimersByTime(100)
      await wrapper.vm.$nextTick()
      expect(tooltip.showPopper).toBe(true)

      firstInput.dispatchEvent(new MouseEvent('mouseout', {
        bubbles: true,
        relatedTarget: secondInput
      }))
      secondInput.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true,
        relatedTarget: firstInput
      }))
      await wrapper.vm.$nextTick()
      vi.advanceTimersByTime(400)
      await wrapper.vm.$nextTick()

      expect(tooltip.content).toBe('金额说明')
      expect(tooltip.showPopper).toBe(true)
      expect(close).not.toHaveBeenCalled()
    } finally {
      wrapper?.destroy()
      vi.useRealTimers()
    }
  })

  it('updates or closes the active tooltip when dynamic content or targets change', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      tableData: [{ name: 'Alice' }],
      columns: [{ label: '姓名', formItems: [{
        fieldKey: 'name', type: 'input', hint: ({ value }) => value ? `内容:${value}` : ''
      }] }]
    })
    await wrapper.vm.$nextTick()
    const tooltip = getHintTooltip(wrapper)
    vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    const close = vi.spyOn(tooltip, 'handleClosePopper').mockImplementation(() => undefined)
    const update = vi.spyOn(tooltip, 'updatePopper').mockImplementation(() => undefined)

    await wrapper.find('.el-input__inner').trigger('mouseover')
    await flushTooltip(wrapper)
    expect(tooltip.content).toBe('内容:Alice')

    await wrapper.setProps({ tableData: [{ name: 'Bob' }] })
    await flushTooltip(wrapper)
    expect(tooltip.content).toBe('内容:Bob')
    expect(update).toHaveBeenCalled()

    await wrapper.setProps({ hintOptions: { mode: 'tooltip', targets: 'header' } })
    await flushTooltip(wrapper)
    expect(wrapper.find('[data-form-table-hint]').exists()).toBe(false)
    expect(close).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('removes the controller when switching from tooltip to title or false', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{ label: '姓名', formItems: [{ fieldKey: 'name', type: 'input', hint: '说明' }] }]
    })
    await wrapper.vm.$nextTick()
    expect((wrapper.vm.$refs as Record<string, unknown>).hintTooltipControllerRef).toBeTruthy()

    await wrapper.setProps({ hintOptions: { mode: 'title' } })
    expect((wrapper.vm.$refs as Record<string, unknown>).hintTooltipControllerRef).toBeUndefined()
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('说明')

    await wrapper.setProps({ hintOptions: { mode: false } })
    expect(wrapper.find('.el-form-item').attributes('title')).toBeUndefined()
    wrapper.destroy()
  })
})
