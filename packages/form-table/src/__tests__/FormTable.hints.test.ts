import { describe, expect, it, vi } from 'vitest'
import type { Wrapper } from '@vue/test-utils'
import type Vue from 'vue'
import type { FormTableHintTooltipRef } from '../composables/useFormTableHintTooltip'
import type { FormTableFieldRenderContext } from '../types.public'
import { mountFormTable } from './test-utils'

const getHintTooltip = (wrapper: Wrapper<Vue>) => (
  (wrapper.vm.$refs as Record<string, unknown>).hintTooltipRef as FormTableHintTooltipRef & {
    content: string
    placement: string
    popperClass: string
    manual: boolean
    enterable: boolean
    tooltipId: string
  }
)

const dispatchFocusEvent = (
  element: Element,
  type: 'focusin' | 'focusout',
  relatedTarget: EventTarget | null = null
) => {
  element.dispatchEvent(new FocusEvent(type, { bubbles: true, relatedTarget }))
}

const waitForTooltipActivation = async (wrapper: Wrapper<Vue>) => {
  await new Promise(resolve => setTimeout(resolve, 60))
  await wrapper.vm.$nextTick()
}

describe('FormTable hint modes', () => {
  it('keeps title as the default mode without creating a hint tooltip', async () => {
    const wrapper = mountFormTable({
      columns: [{
        label: '姓名',
        headerHint: '姓名表头说明',
        children: [{ children: [{ fieldKey: 'name', type: 'input', hint: '姓名字段说明' }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.form-table-column-header').attributes('title')).toBe('姓名表头说明')
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('姓名字段说明')
    expect(wrapper.find('[data-form-table-hint]').exists()).toBe(false)
    expect((wrapper.vm.$refs as Record<string, unknown>).hintTooltipRef).toBeUndefined()
    wrapper.destroy()
  })

  it('shares one managed tooltip between default headers and form items', async () => {
    const wrapper = mountFormTable({
      hintMode: 'tooltip',
      hintTooltipProps: {
        placement: 'bottom',
        popperClass: 'custom-hint-popper',
        content: '不能覆盖内容',
        manual: true,
        enterable: true
      },
      columns: [{
        label: '姓名',
        headerHint: '姓名表头说明',
        children: [{ children: [{ fieldKey: 'name', type: 'input', hint: '姓名字段说明' }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    const header = wrapper.find('.form-table-column-header')
    const formItem = wrapper.find('.el-form-item')
    expect(header.attributes()).toMatchObject({ 'data-form-table-hint': '姓名表头说明' })
    expect(formItem.attributes()).toMatchObject({ 'data-form-table-hint': '姓名字段说明' })
    expect(header.attributes('title')).toBeUndefined()
    expect(formItem.attributes('title')).toBeUndefined()

    const tooltip = getHintTooltip(wrapper)
    expect(tooltip.placement).toBe('bottom')
    expect(tooltip.popperClass).toBe('form-table-hint-tooltip custom-hint-popper')
    expect(tooltip.manual).toBe(false)
    expect(tooltip.enterable).toBe(false)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    const destroy = vi.spyOn(tooltip, 'doDestroy').mockImplementation(() => undefined)

    await wrapper.find('.el-input__inner').trigger('mouseover')
    await wrapper.vm.$nextTick()
    expect(show).not.toHaveBeenCalled()
    await waitForTooltipActivation(wrapper)
    expect(tooltip.content).toBe('姓名字段说明')
    expect(tooltip.referenceElm).toBe(formItem.element)
    expect(formItem.attributes('aria-describedby')).toContain(tooltip.tooltipId)

    wrapper.find('.el-input__inner').element.dispatchEvent(new MouseEvent('mouseout', {
      bubbles: true,
      relatedTarget: header.element
    }))
    await wrapper.vm.$nextTick()
    expect(tooltip.content).toBe('姓名字段说明')
    expect(formItem.attributes('aria-describedby')).toBeUndefined()

    await header.trigger('mouseover')
    await waitForTooltipActivation(wrapper)
    expect(tooltip.content).toBe('姓名表头说明')
    expect(tooltip.referenceElm).toBe(header.element)
    expect(header.attributes('aria-describedby')).toContain(tooltip.tooltipId)
    expect(show).toHaveBeenCalledTimes(2)
    expect(destroy).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('keeps a field tooltip active across descendants and uses focus as a hover fallback', async () => {
    const wrapper = mountFormTable({
      hintMode: 'tooltip',
      columns: [{
        label: '姓名',
        headerHint: '姓名表头说明',
        children: [{ children: [{ fieldKey: 'name', type: 'input', hint: '姓名字段说明' }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    const tooltip = getHintTooltip(wrapper)
    vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    vi.spyOn(tooltip, 'doDestroy').mockImplementation(() => undefined)
    const close = vi.spyOn(tooltip, 'handleClosePopper').mockImplementation(() => undefined)
    const formItem = wrapper.find('.el-form-item')
    const input = wrapper.find('.el-input__inner')
    const header = wrapper.find('.form-table-column-header')

    await input.trigger('mouseover')
    input.element.dispatchEvent(new MouseEvent('mouseout', {
      bubbles: true,
      relatedTarget: formItem.element
    }))
    await wrapper.vm.$nextTick()
    expect(close).not.toHaveBeenCalled()

    dispatchFocusEvent(input.element, 'focusin')
    await header.trigger('mouseover')
    await wrapper.vm.$nextTick()
    expect(tooltip.content).toBe('姓名表头说明')
    expect(tooltip.referenceElm).toBe(header.element)
    expect(input.attributes('aria-describedby')).toBeUndefined()
    expect(header.attributes('aria-describedby')).toContain(tooltip.tooltipId)

    header.element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(tooltip.content).toBe('姓名字段说明')
    expect(tooltip.referenceElm).toBe(formItem.element)
    expect(input.attributes('aria-describedby')).toContain(tooltip.tooltipId)

    dispatchFocusEvent(input.element, 'focusout')
    await wrapper.vm.$nextTick()
    expect(tooltip.content).toBe('姓名字段说明')
    expect(input.attributes('aria-describedby')).toBeUndefined()
    wrapper.destroy()
  })

  it('updates and closes the active tooltip when a dynamic hint changes', async () => {
    const hint = ({ value }: FormTableFieldRenderContext) => (
      value ? `完整内容：${value}` : ''
    )
    const wrapper = mountFormTable({
      hintMode: 'tooltip',
      tableData: [{ name: 'Alice' }],
      columns: [{
        label: '姓名',
        children: [{ children: [{ fieldKey: 'name', type: 'input', hint }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    const tooltip = getHintTooltip(wrapper)
    vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    vi.spyOn(tooltip, 'doDestroy').mockImplementation(() => undefined)
    const close = vi.spyOn(tooltip, 'handleClosePopper').mockImplementation(() => undefined)
    const update = vi.spyOn(tooltip, 'updatePopper').mockImplementation(() => undefined)
    await wrapper.find('.el-input__inner').trigger('mouseover')
    await wrapper.vm.$nextTick()
    expect(tooltip.content).toBe('完整内容：Alice')

    await wrapper.setProps({ tableData: [{ name: 'Bob' }] })
    await wrapper.vm.$nextTick()
    expect(tooltip.content).toBe('完整内容：Bob')
    expect(update).toHaveBeenCalled()

    await wrapper.setProps({ tableData: [] })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.el-form-item').exists()).toBe(false)
    expect(tooltip.content).toBe('完整内容：Bob')
    expect(close).toHaveBeenCalled()

    await wrapper.setProps({ tableData: [{ name: 'Alice' }] })
    await wrapper.find('.el-input__inner').trigger('mouseover')
    await wrapper.setProps({ tableData: [{ name: '' }] })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.el-form-item').attributes('data-form-table-hint')).toBeUndefined()
    expect(tooltip.content).toBe('完整内容：Alice')
    expect(close).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('switches the whole table between mutually exclusive hint modes', async () => {
    const wrapper = mountFormTable({
      columns: [{
        label: '姓名',
        headerHint: '姓名表头说明',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'input',
          hint: '姓名字段说明',
          formItemProps: { title: '底层字段 title' }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('姓名字段说明')

    await wrapper.setProps({ hintMode: 'tooltip' })
    expect(wrapper.find('.el-form-item').attributes('title')).toBeUndefined()
    expect(wrapper.find('.el-form-item').attributes('data-form-table-hint')).toBe('姓名字段说明')
    expect(getHintTooltip(wrapper)).toBeTruthy()

    await wrapper.setProps({ hintMode: 'title' })
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('姓名字段说明')
    expect(wrapper.find('[data-form-table-hint]').exists()).toBe(false)
    expect((wrapper.vm.$refs as Record<string, unknown>).hintTooltipRef).toBeUndefined()
    wrapper.destroy()
  })

  it('preserves passthrough titles when no semantic hint is declared', async () => {
    const wrapper = mountFormTable({
      hintMode: 'tooltip',
      columns: [{
        label: '姓名',
        headerProps: { title: '底层表头 title' },
        children: [{ children: [{
          fieldKey: 'name',
          type: 'input',
          formItemProps: { title: '底层字段 title' }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.form-table-column-header').attributes('title')).toBe('底层表头 title')
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('底层字段 title')
    expect(wrapper.find('[data-form-table-hint]').exists()).toBe(false)
    wrapper.destroy()
  })

  it('leaves custom header slot hint rendering under caller control', async () => {
    const wrapper = mountFormTable({
      hintMode: 'tooltip',
      columns: [{
        label: '学校',
        headerSlot: 'school-header',
        headerHint: '学校完整说明',
        children: [{ children: [{ fieldKey: 'name', type: 'input' }] }]
      }],
      scopedSlots: {
        'school-header': `
          <span class="school-header" :title="props.header.hint">
            {{ props.label }}
          </span>
        `
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.school-header').attributes('title')).toBe('学校完整说明')
    expect(wrapper.find('.school-header').attributes('data-form-table-hint')).toBeUndefined()
    wrapper.destroy()
  })
})
