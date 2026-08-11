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
        headerHint: { content: '姓名表头说明' },
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
      hintOptions: {
        mode: 'tooltip',
        props: {
          placement: 'bottom',
          popperClass: 'custom-hint-popper',
          content: '不能覆盖内容',
          manual: true,
          enterable: true
        }
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
      hintOptions: { mode: 'tooltip' },
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
      hintOptions: { mode: 'tooltip' },
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

    await wrapper.setProps({ hintOptions: { mode: 'tooltip' } })
    expect(wrapper.find('.el-form-item').attributes('title')).toBeUndefined()
    expect(wrapper.find('.el-form-item').attributes('data-form-table-hint')).toBe('姓名字段说明')
    expect(getHintTooltip(wrapper)).toBeTruthy()

    await wrapper.setProps({ hintOptions: { mode: 'title' } })
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('姓名字段说明')
    expect(wrapper.find('[data-form-table-hint]').exists()).toBe(false)
    expect((wrapper.vm.$refs as Record<string, unknown>).hintTooltipRef).toBeUndefined()
    wrapper.destroy()
  })

  it('preserves passthrough titles when no semantic hint is declared', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
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

  it('automatically applies a custom header slot hint to the shared wrapper', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{
        label: '学校',
        headerSlot: 'school-header',
        headerHint: ({ tableData }) => `学校完整说明（${tableData.length}）`,
        headerProps: { 'aria-label': '学校表头' },
        children: [{ children: [{ fieldKey: 'name', type: 'input' }] }]
      }],
      scopedSlots: {
        'school-header': `
          <span class="school-header">
            {{ props.label }}|{{ props.header.hint.content }}|{{ props.header.hint.auto }}
          </span>
        `
      }
    })
    await wrapper.vm.$nextTick()

    const header = wrapper.find('.form-table-column-header')
    const slotContent = wrapper.find('.school-header')
    expect(header.attributes('data-form-table-hint')).toBe('学校完整说明（1）')
    expect(header.attributes('aria-label')).toBe('学校表头')
    expect(header.attributes('title')).toBeUndefined()
    expect(slotContent.text()).toBe('学校|学校完整说明（1）|true')
    expect(slotContent.attributes('data-form-table-hint')).toBeUndefined()
    expect(slotContent.attributes('title')).toBeUndefined()

    const tooltip = getHintTooltip(wrapper)
    vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    vi.spyOn(tooltip, 'doDestroy').mockImplementation(() => undefined)
    await slotContent.trigger('mouseover')
    await waitForTooltipActivation(wrapper)
    expect(tooltip.content).toBe('学校完整说明（1）')
    expect(tooltip.referenceElm).toBe(header.element)

    await wrapper.setProps({ tableData: [{ name: 'Alice' }, { name: 'Bob' }] })
    await wrapper.vm.$nextTick()
    expect(header.attributes('data-form-table-hint')).toBe('学校完整说明（2）')
    expect(tooltip.content).toBe('学校完整说明（2）')
    wrapper.destroy()
  })

  it('automatically applies a field slot hint to its form item', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{
        label: '操作',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          hint: '字段 Slot 说明',
          component: { renderer: 'name-field' }
        }] }]
      }],
      scopedSlots: {
        'name-field': `<button class="slot-field">
          {{ props.value }}|{{ props.hint.content }}|{{ props.hint.auto }}
        </button>`
      }
    })
    await wrapper.vm.$nextTick()

    const formItem = wrapper.find('.el-form-item')
    const slotField = wrapper.find('.slot-field')
    expect(formItem.attributes('data-form-table-hint')).toBe('字段 Slot 说明')
    expect(slotField.text()).toBe('Alice|字段 Slot 说明|true')
    expect(slotField.attributes('data-form-table-hint')).toBeUndefined()

    const tooltip = getHintTooltip(wrapper)
    vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    vi.spyOn(tooltip, 'doDestroy').mockImplementation(() => undefined)
    await slotField.trigger('mouseover')
    await waitForTooltipActivation(wrapper)
    expect(tooltip.content).toBe('字段 Slot 说明')
    expect(tooltip.referenceElm).toBe(formItem.element)
    wrapper.destroy()
  })

  it('exposes auto=false hints to slots without changing target props or triggering singleton', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{
        label: '自定义提示',
        headerSlot: 'custom-header',
        headerHint: { content: '表头自行展示', auto: false },
        headerProps: { title: '底层表头 title' },
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          hint: { content: '字段自行展示', auto: false },
          formItemProps: { title: '底层字段 title' },
          component: { renderer: 'custom-field' }
        }] }]
      }],
      scopedSlots: {
        'custom-header': `<span class="custom-hint-header">
          {{ props.header.hint.content }}|{{ props.header.hint.auto }}
        </span>`,
        'custom-field': `<button class="custom-hint-field">
          {{ props.hint.content }}|{{ props.hint.auto }}
        </button>`
      }
    })
    await wrapper.vm.$nextTick()

    const header = wrapper.find('.form-table-column-header')
    const formItem = wrapper.find('.el-form-item')
    expect(header.attributes('title')).toBe('底层表头 title')
    expect(formItem.attributes('title')).toBe('底层字段 title')
    expect(wrapper.find('[data-form-table-hint]').exists()).toBe(false)
    expect(wrapper.find('.custom-hint-header').text()).toBe('表头自行展示|false')
    expect(wrapper.find('.custom-hint-field').text()).toBe('字段自行展示|false')

    const tooltip = getHintTooltip(wrapper)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    await wrapper.find('.custom-hint-field').trigger('mouseover')
    await waitForTooltipActivation(wrapper)
    expect(show).not.toHaveBeenCalled()
    expect(tooltip.content).toBe('')
    wrapper.destroy()
  })

  it('disables managed hints for builtin and component fields when auto=false', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      tableData: [{ name: 'Alice', age: '18' }],
      columns: [{
        label: '非 Slot 字段',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'input',
          hint: { content: '内置字段配置内容', auto: false },
          formItemProps: { title: '内置字段原生 title' }
        }, {
          fieldKey: 'age',
          type: 'component',
          hint: { content: '自定义组件配置内容', auto: false },
          formItemProps: { title: '组件字段原生 title' },
          component: { renderer: 'el-input' }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    const formItems = wrapper.findAll('.el-form-item')
    expect(formItems).toHaveLength(2)
    expect(formItems.at(0).attributes('title')).toBe('内置字段原生 title')
    expect(formItems.at(1).attributes('title')).toBe('组件字段原生 title')
    expect(wrapper.find('[data-form-table-hint]').exists()).toBe(false)

    const tooltip = getHintTooltip(wrapper)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    await formItems.at(0).trigger('mouseover')
    await formItems.at(1).trigger('mouseover')
    await waitForTooltipActivation(wrapper)
    expect(show).not.toHaveBeenCalled()
    expect(tooltip.content).toBe('')
    wrapper.destroy()
  })

  it('closes an active managed tooltip when a dynamic hint switches to custom ownership', async () => {
    const hint = ({ row, value }: FormTableFieldRenderContext) => ({
      content: `当前内容：${String(value)}`,
      auto: !row.customHint
    })
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      tableData: [{ name: 'Alice', customHint: false }],
      columns: [{
        label: '姓名',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'input',
          hint,
          formItemProps: { title: '底层字段 title' }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    const tooltip = getHintTooltip(wrapper)
    vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    vi.spyOn(tooltip, 'doDestroy').mockImplementation(() => undefined)
    const close = vi.spyOn(tooltip, 'handleClosePopper').mockImplementation(() => undefined)
    await wrapper.find('.el-input__inner').trigger('mouseover')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.el-form-item').attributes('data-form-table-hint')).toBe('当前内容：Alice')
    expect(tooltip.content).toBe('当前内容：Alice')

    await wrapper.setProps({ tableData: [{ name: 'Alice', customHint: true }] })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.el-form-item').attributes('data-form-table-hint')).toBeUndefined()
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('底层字段 title')
    expect(close).toHaveBeenCalled()

    await wrapper.setProps({ hintOptions: { mode: 'title' } })
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('底层字段 title')
    wrapper.destroy()
  })

  it('preserves empty custom hint content for slots while leaving native props untouched', async () => {
    const wrapper = mountFormTable({
      columns: [{
        label: '空提示',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          hint: { content: '', auto: false },
          formItemProps: { title: '底层字段 title' },
          component: { renderer: 'empty-hint-field' }
        }] }]
      }],
      scopedSlots: {
        'empty-hint-field': `<span class="empty-custom-hint">
          {{ props.hint.content === '' }}|{{ props.hint.auto }}
        </span>`
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.empty-custom-hint').text()).toBe('true|false')
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('底层字段 title')
    wrapper.destroy()
  })

  it('normalizes explicit null and undefined hints to null for field slots', async () => {
    const wrapper = mountFormTable({
      columns: [{
        label: '空值提示',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          hint: null,
          formItemProps: { title: '应被清除' },
          component: { renderer: 'null-hint-field' }
        }, {
          fieldKey: 'age',
          type: 'slot',
          hint: () => undefined,
          formItemProps: { title: '也应被清除' },
          component: { renderer: 'undefined-hint-field' }
        }] }]
      }],
      scopedSlots: {
        'null-hint-field': '<span class="null-hint">{{ props.hint === null }}</span>',
        'undefined-hint-field': '<span class="undefined-hint">{{ props.hint === null }}</span>'
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.null-hint').text()).toBe('true')
    expect(wrapper.find('.undefined-hint').text()).toBe('true')
    wrapper.findAll('.el-form-item').wrappers.forEach((formItem) => {
      expect(formItem.attributes('title')).toBeUndefined()
      expect(formItem.attributes('data-form-table-hint')).toBeUndefined()
    })
    wrapper.destroy()
  })
})
