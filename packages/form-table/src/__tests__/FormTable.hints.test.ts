import { describe, expect, it, vi } from 'vitest'
import type { Wrapper } from '@vue/test-utils'
import type Vue from 'vue'
import type { FormTableHintTooltipRef } from '../composables/useFormTableHintTooltip'
import type {
  FormTableFieldRenderContext,
  FormTableResolvedFieldContext
} from '../types.public'
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
    expect(wrapper.find('.form-table-column-header').attributes('tabindex')).toBeUndefined()
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('姓名字段说明')
    expect(wrapper.find('[data-form-table-hint]').exists()).toBe(false)
    expect((wrapper.vm.$refs as Record<string, unknown>).hintTooltipRef).toBeUndefined()
    wrapper.destroy()
  })

  it('formats inherited fields, lets empty results fall back, and keeps explicit hints authoritative', async () => {
    const formatter = vi.fn(({ fieldKey, value }: FormTableFieldRenderContext) => (
      fieldKey === 'empty' ? null : `${fieldKey}：${String(value)}`
    ))
    const componentProps = vi.fn(({ hint }: FormTableResolvedFieldContext) => ({
      'data-resolved-hint': hint?.content
    }))
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip', field: formatter },
      tableData: [{ inherited: 'global', name: 'Alice', dynamic: 'A', explicit: 'raw', disabled: 'secret', empty: '' }],
      columns: [{
        label: '格式化字段',
        children: [{ children: [{
          fieldKey: 'inherited',
          type: 'input',
          formItemProps: { title: '全局 Hint 应覆盖此 title' }
        }, {
          fieldKey: 'name',
          type: 'input',
          hint: undefined,
          component: { props: componentProps }
        }, {
          fieldKey: 'dynamic',
          type: 'input',
          hint: () => ''
        }, {
          fieldKey: 'explicit',
          type: 'input',
          hint: '显式说明'
        }, {
          fieldKey: 'disabled',
          type: 'input',
          hint: false,
          formItemProps: { title: 'false 保留底层 title' }
        }, {
          fieldKey: 'empty',
          type: 'input',
          hint: undefined,
          formItemProps: { title: '空格式化结果保留的 title' }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    const formItems = wrapper.findAll('.el-form-item')
    expect(formItems.at(0).attributes('data-form-table-hint')).toBe('inherited：global')
    expect(formItems.at(0).attributes('title')).toBeUndefined()
    expect(formItems.at(1).attributes('data-form-table-hint')).toBe('name：Alice')
    expect(formItems.at(2).attributes('data-form-table-hint')).toBe('dynamic：A')
    expect(formItems.at(3).attributes('data-form-table-hint')).toBe('显式说明')
    expect(formItems.at(4).attributes('data-form-table-hint')).toBeUndefined()
    expect(formItems.at(4).attributes('title')).toBe('false 保留底层 title')
    expect(formItems.at(5).attributes('data-form-table-hint')).toBeUndefined()
    expect(formItems.at(5).attributes('title')).toBe('空格式化结果保留的 title')
    expect(componentProps.mock.calls[0][0].hint).toEqual({
      content: 'name：Alice',
      behavior: 'auto'
    })
    expect(formatter).toHaveBeenCalledTimes(4)

    await wrapper.setProps({
      tableData: [{ inherited: 'next', name: 'Bob', dynamic: 'B', explicit: 'changed', disabled: 'changed', empty: '' }]
    })
    expect(formItems.at(0).attributes('data-form-table-hint')).toBe('inherited：next')
    expect(formItems.at(1).attributes('data-form-table-hint')).toBe('name：Bob')
    expect(formItems.at(2).attributes('data-form-table-hint')).toBe('dynamic：B')
    expect(formItems.at(3).attributes('data-form-table-hint')).toBe('显式说明')
    expect(formatter).toHaveBeenCalledTimes(8)
    wrapper.destroy()
  })

  it('reacts to the global field default without changing explicit field overrides', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'title', field: true },
      tableData: [{ inherited: '全局值', emptyFallback: '空值回退', disabled: '关闭值' }],
      columns: [{
        label: '全局开关',
        children: [{ children: [{
          fieldKey: 'inherited',
          type: 'input',
          formItemProps: { title: '继承字段底层 title' }
        }, {
          fieldKey: 'emptyFallback',
          type: 'input',
          hint: () => undefined
        }, {
          fieldKey: 'disabled',
          type: 'input',
          hint: false,
          formItemProps: { title: '关闭字段底层 title' }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    const formItems = wrapper.findAll('.el-form-item')
    expect(formItems.at(0).attributes('title')).toBe('全局值')
    expect(formItems.at(1).attributes('title')).toBe('空值回退')
    expect(formItems.at(2).attributes('title')).toBe('关闭字段底层 title')

    await wrapper.setProps({
      hintOptions: {
        mode: 'title',
        field: ({ value }: FormTableFieldRenderContext) => `替换：${String(value)}`
      }
    })
    expect(formItems.at(0).attributes('title')).toBe('替换：全局值')
    expect(formItems.at(1).attributes('title')).toBe('替换：空值回退')
    expect(formItems.at(2).attributes('title')).toBe('关闭字段底层 title')

    await wrapper.setProps({ hintOptions: { mode: 'title' } })
    expect(formItems.at(0).attributes('title')).toBe('继承字段底层 title')
    expect(formItems.at(1).attributes('title')).toBeUndefined()
    expect(formItems.at(2).attributes('title')).toBe('关闭字段底层 title')
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
    expect(show).toHaveBeenCalledTimes(1)
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
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    vi.spyOn(tooltip, 'doDestroy').mockImplementation(() => undefined)
    const close = vi.spyOn(tooltip, 'handleClosePopper').mockImplementation(() => undefined)
    const formItem = wrapper.find('.el-form-item')
    const input = wrapper.find('.el-input__inner')
    const header = wrapper.find('.form-table-column-header')

    await input.trigger('mouseover')
    await formItem.trigger('mouseover')
    await wrapper.vm.$nextTick()
    expect(show).toHaveBeenCalledTimes(1)
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

  it('makes managed tooltip headers keyboard reachable while respecting explicit tabindex', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{
        label: '默认表头',
        headerHint: '默认说明',
        children: [{ children: [{ fieldKey: 'name', type: 'input' }] }]
      }, {
        label: '自定义表头',
        headerHint: '自定义说明',
        headerProps: { tabindex: -1 },
        children: [{ children: [{ fieldKey: 'name', type: 'input' }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    const headers = wrapper.findAll('.form-table-column-header')
    expect(headers.at(0).attributes('tabindex')).toBe('0')
    expect(headers.at(1).attributes('tabindex')).toBe('-1')

    const tooltip = getHintTooltip(wrapper)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    dispatchFocusEvent(headers.at(0).element, 'focusin')
    await wrapper.vm.$nextTick()
    expect(show).toHaveBeenCalledTimes(1)
    expect(headers.at(0).attributes('aria-describedby')).toContain(tooltip.tooltipId)
    wrapper.destroy()
  })

  it('closes on Escape and reopens only after a new pointer or focus transition', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{
        label: '姓名',
        children: [{ children: [{ fieldKey: 'name', type: 'input', hint: '字段说明' }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    const tooltip = getHintTooltip(wrapper)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    const close = vi.spyOn(tooltip, 'handleClosePopper').mockImplementation(() => undefined)
    const input = wrapper.find('.el-input__inner')
    dispatchFocusEvent(input.element, 'focusin')
    await wrapper.vm.$nextTick()
    expect(show).toHaveBeenCalledTimes(1)

    input.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(close).toHaveBeenCalled()
    expect(input.attributes('aria-describedby')).toBeUndefined()

    await wrapper.setProps({ tableData: [{ name: 'Bob' }] })
    expect(show).toHaveBeenCalledTimes(1)
    await input.trigger('mouseover')
    await wrapper.vm.$nextTick()
    expect(show).toHaveBeenCalledTimes(2)
    wrapper.destroy()
  })

  it('removes only its own aria-describedby token after concurrent updates', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{
        label: '姓名',
        children: [{ children: [{ fieldKey: 'name', type: 'input', hint: '字段说明' }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    const tooltip = getHintTooltip(wrapper)
    vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    const input = wrapper.find('.el-input__inner')
    input.element.setAttribute('aria-describedby', 'existing-description')
    dispatchFocusEvent(input.element, 'focusin')
    await wrapper.vm.$nextTick()
    input.element.setAttribute(
      'aria-describedby',
      `${input.attributes('aria-describedby')} validation-error`
    )
    dispatchFocusEvent(input.element, 'focusout')
    await wrapper.vm.$nextTick()
    expect(input.attributes('aria-describedby')).toBe('existing-description validation-error')
    wrapper.destroy()
  })

  it('ignores hint targets owned by a nested FormTable root', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{
        label: '嵌套内容',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          component: { renderer: 'nested-content' }
        }] }]
      }],
      scopedSlots: {
        'nested-content': `<div data-form-table-hint-root :data-field="props.fieldKey">
          <button class="nested-hint" data-form-table-hint="内层说明">内层</button>
        </div>`
      }
    })
    await wrapper.vm.$nextTick()

    const tooltip = getHintTooltip(wrapper)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    await wrapper.find('.nested-hint').trigger('mouseover')
    await wrapper.vm.$nextTick()
    expect(show).not.toHaveBeenCalled()
    expect(tooltip.content).toBe('')
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
            {{ props.label }}|{{ props.header.hint.content }}|{{ props.header.hint.behavior }}
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
    expect(slotContent.text()).toBe('学校|学校完整说明（1）|auto')
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
          {{ props.value }}|{{ props.hint.content }}|{{ props.hint.behavior }}
        </button>`
      }
    })
    await wrapper.vm.$nextTick()

    const formItem = wrapper.find('.el-form-item')
    const slotField = wrapper.find('.slot-field')
    expect(formItem.attributes('data-form-table-hint')).toBe('字段 Slot 说明')
    expect(slotField.text()).toBe('Alice|字段 Slot 说明|auto')
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

  it('exposes behavior=custom hints to slots without changing target props or triggering singleton', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      columns: [{
        label: '自定义提示',
        headerSlot: 'custom-header',
        headerHint: { content: '表头自行展示', behavior: 'custom' },
        headerProps: { title: '底层表头 title' },
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          hint: { content: '字段自行展示', behavior: 'custom' },
          formItemProps: { title: '底层字段 title' },
          component: { renderer: 'custom-field' }
        }] }]
      }],
      scopedSlots: {
        'custom-header': `<span class="custom-hint-header">
          {{ props.header.hint.content }}|{{ props.header.hint.behavior }}
        </span>`,
        'custom-field': `<button class="custom-hint-field">
          {{ props.hint.content }}|{{ props.hint.behavior }}
        </button>`
      }
    })
    await wrapper.vm.$nextTick()

    const header = wrapper.find('.form-table-column-header')
    const formItem = wrapper.find('.el-form-item')
    expect(header.attributes('title')).toBe('底层表头 title')
    expect(formItem.attributes('title')).toBe('底层字段 title')
    expect(wrapper.find('[data-form-table-hint]').exists()).toBe(false)
    expect(wrapper.find('.custom-hint-header').text()).toBe('表头自行展示|custom')
    expect(wrapper.find('.custom-hint-field').text()).toBe('字段自行展示|custom')

    const tooltip = getHintTooltip(wrapper)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    await wrapper.find('.custom-hint-field').trigger('mouseover')
    await waitForTooltipActivation(wrapper)
    expect(show).not.toHaveBeenCalled()
    expect(tooltip.content).toBe('')
    wrapper.destroy()
  })

  it('disables managed hints for builtin and component fields when behavior=custom', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      tableData: [{ name: 'Alice', age: '18' }],
      columns: [{
        label: '非 Slot 字段',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'input',
          hint: { content: '内置字段配置内容', behavior: 'custom' },
          formItemProps: { title: '内置字段原生 title' }
        }, {
          fieldKey: 'age',
          type: 'component',
          hint: { content: '自定义组件配置内容', behavior: 'custom' },
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

  it('closes an active managed tooltip when a dynamic hint switches to custom behavior', async () => {
    const hint = ({ row, value }: FormTableFieldRenderContext) => ({
      content: `当前内容：${String(value)}`,
      behavior: row.customHint ? 'custom' as const : 'auto' as const
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

  it('treats empty custom hint content as no hint and leaves native props untouched', async () => {
    const wrapper = mountFormTable({
      columns: [{
        label: '空提示',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          hint: { content: '', behavior: 'custom' },
          formItemProps: { title: '底层字段 title' },
          component: { renderer: 'empty-hint-field' }
        }] }]
      }],
      scopedSlots: {
        'empty-hint-field': '<span class="empty-custom-hint">{{ props.hint === null }}</span>'
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.empty-custom-hint').text()).toBe('true')
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
    wrapper.findAll('.el-form-item').wrappers.forEach((formItem, index) => {
      expect(formItem.attributes('title')).toBe(index === 0 ? '应被清除' : '也应被清除')
      expect(formItem.attributes('data-form-table-hint')).toBeUndefined()
    })
    wrapper.destroy()
  })
})
