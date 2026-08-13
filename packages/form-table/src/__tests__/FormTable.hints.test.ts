import { describe, expect, it, vi } from 'vitest'
import type { Wrapper } from '@vue/test-utils'
import type Vue from 'vue'
import type { FormTableHintTooltipRef } from '../composables/useFormTableHintTooltip'
import type { FormTableFieldRenderContext } from '../types.public'
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

describe('FormTable lightweight hint behavior', () => {
  it('defaults to field-only native titles without creating a tooltip controller', async () => {
    const headerHint = vi.fn(() => '表头说明')
    const wrapper = mountFormTable({
      columns: [{
        label: '姓名',
        headerHint,
        children: [{ children: [{ fieldKey: 'name', type: 'input', hint: '字段说明' }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.el-form-item').attributes('title')).toBe('字段说明')
    expect(wrapper.find('.form-table-column-header').exists()).toBe(false)
    expect(headerHint).not.toHaveBeenCalled()
    expect(wrapper.findComponent({ name: 'FormTableHintTooltip' }).exists()).toBe(false)
    wrapper.destroy()
  })

  it.each([
    ['field', true, false],
    ['header', false, true],
    ['all', true, true]
  ] as const)('applies the %s target without evaluating excluded hints', async (targets, fieldEnabled, headerEnabled) => {
    const fieldHint = vi.fn(() => '字段说明')
    const headerHint = vi.fn(() => '表头说明')
    const wrapper = mountFormTable({
      hintOptions: { mode: 'title', targets },
      columns: [{
        label: '姓名',
        headerHint,
        children: [{ children: [{ fieldKey: 'name', type: 'input', hint: fieldHint }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.el-form-item').attributes('title')).toBe(fieldEnabled ? '字段说明' : undefined)
    const header = wrapper.find('.form-table-column-header')
    expect(headerEnabled ? header.attributes('title') : undefined).toBe(headerEnabled ? '表头说明' : undefined)
    expect(fieldHint).toHaveBeenCalledTimes(fieldEnabled ? 1 : 0)
    expect(headerHint).toHaveBeenCalledTimes(headerEnabled ? 1 : 0)
    wrapper.destroy()
  })

  it('fully disables hint evaluation, markers, and tooltip lifecycle', async () => {
    const formatter = vi.fn(() => '默认说明')
    const fieldHint = vi.fn(() => '字段说明')
    const headerHint = vi.fn(() => '表头说明')
    const wrapper = mountFormTable({
      hintOptions: { mode: false, targets: 'all', field: formatter },
      columns: [{
        label: '姓名',
        headerHint,
        headerProps: { title: '原生表头' },
        children: [{ children: [{
          fieldKey: 'name', type: 'input', hint: fieldHint, formItemProps: { title: '原生字段' }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(fieldHint).not.toHaveBeenCalled()
    expect(headerHint).not.toHaveBeenCalled()
    expect(formatter).not.toHaveBeenCalled()
    expect(wrapper.find('[data-form-table-hint]').exists()).toBe(false)
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('原生字段')
    expect(wrapper.find('.form-table-column-header').attributes('title')).toBe('原生表头')
    expect(wrapper.findComponent({ name: 'FormTableHintTooltip' }).exists()).toBe(false)
    wrapper.destroy()
  })

  it('uses explicit strings, false opt-out, and empty fallback consistently', async () => {
    const formatter = vi.fn(({ fieldKey, value }: FormTableFieldRenderContext) => `${fieldKey}:${String(value)}`)
    const wrapper = mountFormTable({
      hintOptions: { mode: 'title', field: formatter },
      tableData: [{ inherited: 'A', empty: 'B', explicit: 'C', disabled: 'D' }],
      columns: [{ label: '字段', children: [{ children: [
        { fieldKey: 'inherited', type: 'input' },
        { fieldKey: 'empty', type: 'input', hint: '' },
        { fieldKey: 'explicit', type: 'input', hint: '显式说明' },
        { fieldKey: 'disabled', type: 'input', hint: false }
      ] }] }]
    })
    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('.el-form-item')
    expect(items.at(0).attributes('title')).toBe('inherited:A')
    expect(items.at(1).attributes('title')).toBe('empty:B')
    expect(items.at(2).attributes('title')).toBe('显式说明')
    expect(items.at(3).attributes('title')).toBeUndefined()
    expect(formatter).toHaveBeenCalledTimes(2)
    wrapper.destroy()
  })

  it('mounts one tooltip controller and protects managed Element props', async () => {
    const wrapper = mountFormTable({
      hintOptions: {
        mode: 'tooltip',
        targets: 'all',
        tooltipProps: {
          placement: 'right', popperClass: 'business-hint', content: 'ignored', manual: true, enterable: true
        }
      },
      columns: [{
        label: '姓名', headerHint: '表头说明',
        children: [{ children: [{ fieldKey: 'name', type: 'input', hint: '字段说明' }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect((wrapper.vm.$refs as Record<string, unknown>).hintTooltipControllerRef).toBeTruthy()
    const tooltip = getHintTooltip(wrapper)
    expect(tooltip.placement).toBe('right')
    expect(tooltip.popperClass).toBe('form-table-hint-tooltip business-hint')
    expect(tooltip.openDelay).toBe(100)
    expect(tooltip.manual).toBe(false)
    expect(tooltip.enterable).toBe(false)
    expect(wrapper.findAll('[data-form-table-hint]')).toHaveLength(2)
    wrapper.destroy()
  })

  it('supports pointer, keyboard, Escape, ARIA tokens, and nested root isolation', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{ label: '字段', children: [{ children: [{
        fieldKey: 'name', type: 'slot', hint: '字段说明', component: { renderer: 'content' }
      }] }] }],
      scopedSlots: { content: '<button class="target">字段</button>' }
    })
    await wrapper.vm.$nextTick()
    const tooltip = getHintTooltip(wrapper)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    const close = vi.spyOn(tooltip, 'handleClosePopper').mockImplementation(() => undefined)
    const target = wrapper.find('.target')
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

  it('keeps the next tooltip open when the pointer moves directly between fields', async () => {
    vi.useFakeTimers()
    let wrapper: Wrapper<Vue> | null = null
    try {
      wrapper = mountFormTable({
        hintOptions: { mode: 'tooltip', tooltipProps: { openDelay: 100 } },
        tableData: [{ name: 'Alice', amount: 128.5 }],
        columns: [
          { label: '姓名', children: [{ children: [{ fieldKey: 'name', type: 'input', hint: '姓名说明' }] }] },
          { label: '金额', children: [{ children: [{ fieldKey: 'amount', type: 'number', hint: '金额说明' }] }] }
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
      columns: [{ label: '姓名', children: [{ children: [{
        fieldKey: 'name', type: 'input', hint: ({ value }) => value ? `内容:${value}` : ''
      }] }] }]
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
      columns: [{ label: '姓名', children: [{ children: [{ fieldKey: 'name', type: 'input', hint: '说明' }] }] }]
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
