import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Wrapper } from '@vue/test-utils'
import type Vue from 'vue'
import FormTableColumn from '../FormTableColumn.vue'
import FormTable from '../index.vue'
import type { FormTableHintTooltipRef } from '../composables/useFormTableHintTooltip'
import type { FormTableFieldRenderContext } from '../types.public'
import { localVue, mountFormTable } from './test-utils'

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

describe('FormTable lightweight hint behavior', () => {
  it('keeps field-only title defaults when column and item render without a root provider', async () => {
    const headerHint = vi.fn(() => '表头说明')
    const Host = localVue.extend({
      components: { FormTableColumn },
      data: () => ({
        rows: [{ name: 'Alice' }],
        column: {
          label: '姓名',
          headerHint,
          formItems: [{ fieldKey: 'name', type: 'input', hint: '字段说明' }]
        }
      }),
      template: `
        <el-form :model="{ tableData: rows }">
          <el-table :data="rows">
            <FormTableColumn :column="column" :column-index="0" />
          </el-table>
        </el-form>
      `
    })
    const wrapper = mount(Host, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.el-form-item').attributes('title')).toBe('字段说明')
    expect(wrapper.find('.form-table-column-header').exists()).toBe(false)
    expect(headerHint).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('defaults to field-only native titles without creating a tooltip controller', async () => {
    const headerHint = vi.fn(() => '表头说明')
    const wrapper = mountFormTable({
      columns: [{
        label: '姓名',
        headerHint,
        formItems: [{ fieldKey: 'name', type: 'input', hint: '字段说明' }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.el-form-item').attributes('title')).toBe('字段说明')
    expect(wrapper.find('.form-table-column-header').exists()).toBe(false)
    expect(headerHint).not.toHaveBeenCalled()
    expect(wrapper.findComponent({ name: 'FormTableHintTooltip' }).exists()).toBe(false)
    wrapper.destroy()
  })

  it('passes content-triggered native titles to component props without overriding explicit titles', async () => {
    const hint = vi.fn(() => '开关说明')
    const CustomTitle = localVue.extend({
      inheritAttrs: false,
      render(createElement) {
        return createElement('button', {
          class: 'content-title-custom',
          attrs: this.$attrs
        }, ['Custom'])
      }
    })
    const wrapper = mountFormTable({
      tableData: [{ enabled: true, amount: 1, summary: 'Text', custom: 'C', slot: 'S' }],
      columns: [{
        label: '内容区域 title',
        formItems: [
          { fieldKey: 'enabled', type: 'switch', hint, hintTrigger: 'content' },
          {
            fieldKey: 'amount', type: 'number', hint: '自动金额说明', hintTrigger: 'content',
            component: { props: { title: '组件自有说明' } }
          },
          { fieldKey: 'summary', type: 'text', hint: '文本说明', hintTrigger: 'content' },
          {
            fieldKey: 'custom', type: 'component', hint: '自定义组件说明', hintTrigger: 'content',
            component: { is: CustomTitle }
          },
          {
            fieldKey: 'slot', type: 'slot', hint: 'Slot 说明', hintTrigger: 'content',
            component: { slot: 'content-title' }
          }
        ]
      }],
      scopedSlots: {
        'content-title': '<button class="content-title-slot" v-bind="props.component.props">Slot</button>'
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.el-form-item').wrappers.every(item => item.attributes('title') === undefined)).toBe(true)
    expect(wrapper.find('.el-switch').attributes('title')).toBe('开关说明')
    expect(wrapper.find('.el-input-number').attributes('title')).toBe('组件自有说明')
    expect(wrapper.find('.el-form-item__content > span').attributes('title')).toBe('文本说明')
    expect(wrapper.find('.content-title-custom').attributes('title')).toBe('自定义组件说明')
    expect(wrapper.find('.content-title-slot').attributes('title')).toBe('Slot 说明')
    expect(hint).toHaveBeenCalledTimes(1)
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
        formItems: [{ fieldKey: 'name', type: 'input', hint: fieldHint }]
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
        formItems: [{
          fieldKey: 'name', type: 'input', hint: fieldHint, formItemProps: { title: '原生字段' }
        }]
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
      columns: [{ label: '字段', formItems: [{ fieldKey: 'inherited', type: 'input' },
        { fieldKey: 'empty', type: 'input', hint: '' },
        { fieldKey: 'explicit', type: 'input', hint: '显式说明' },
        { fieldKey: 'disabled', type: 'input', hint: false }] }]
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
        formItems: [{ fieldKey: 'name', type: 'input', hint: '字段说明' }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect((wrapper.vm.$refs as Record<string, unknown>).hintTooltipControllerRef).toBeTruthy()
    const controller = (wrapper.vm.$refs as Record<string, any>).hintTooltipControllerRef
    expect(controller.$props.container).toBe(wrapper.find('.form-table-container').element)
    const tooltip = getHintTooltip(wrapper)
    expect(tooltip.placement).toBe('right')
    expect(tooltip.popperClass).toBe('form-table-hint-tooltip business-hint')
    expect(tooltip.openDelay).toBe(100)
    expect(tooltip.manual).toBe(false)
    expect(tooltip.enterable).toBe(false)
    expect(wrapper.findAll('[data-form-table-hint]')).toHaveLength(2)
    wrapper.destroy()
  })

  it('anchors built-in fields and a single-root slot to their actual component roots', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      tableData: [{ input: 'A', number: 1, switch: true, rate: 3, slot: 'S' }],
      columns: [
        { label: 'Input', formItems: [{ fieldKey: 'input', type: 'input', hint: 'Input hint', hintTrigger: 'content' }] },
        { label: 'Number', formItems: [{ fieldKey: 'number', type: 'number', hint: 'Number hint', hintTrigger: 'content' }] },
        { label: 'Switch', formItems: [{ fieldKey: 'switch', type: 'switch', hint: 'Switch hint', hintTrigger: 'content' }] },
        { label: 'Rate', formItems: [{ fieldKey: 'rate', type: 'rate', hint: 'Rate hint', hintTrigger: 'content' }] },
        { label: 'Slot', formItems: [{
          fieldKey: 'slot', type: 'slot', hint: 'Slot hint', hintTrigger: 'content', component: { slot: 'single' }
        }] }
      ],
      scopedSlots: { single: '<button class="single-slot">Slot</button>' }
    })
    await wrapper.vm.$nextTick()
    const tooltip = getHintTooltip(wrapper)
    vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)

    for (const selector of ['.el-input', '.el-input-number', '.el-switch', '.el-rate', '.single-slot']) {
      const root = wrapper.find(selector)
      setElementRect(root.element)
      await root.trigger('mouseover')
      await flushTooltip(wrapper)
      expect(tooltip.referenceElm).toBe(root.element)
    }
    wrapper.destroy()
  })

  it('does not trigger a content hint from FormItem padding', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      tableData: [{ enabled: true }],
      columns: [{ label: 'Switch', formItems: [{
        fieldKey: 'enabled', type: 'switch', hint: 'Switch hint', hintTrigger: 'content'
      }] }]
    })
    await wrapper.vm.$nextTick()
    const tooltip = getHintTooltip(wrapper)
    const show = vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    const item = wrapper.find('.el-form-item')
    const content = wrapper.find('.el-switch')
    setElementRect(content.element)

    await item.trigger('mouseover')
    await flushTooltip(wrapper)
    expect(show).not.toHaveBeenCalled()

    await content.trigger('mouseover')
    await flushTooltip(wrapper)
    expect(show).toHaveBeenCalledTimes(1)
    expect(tooltip.referenceElm).toBe(content.element)
    wrapper.destroy()
  })

  it('falls back for multi-root or zero-size fields and ignores validation errors', async () => {
    const Host = localVue.extend({
      components: { FormTable },
      data: () => ({
        rows: [{ multiple: 'M', empty: '', single: 'S' }],
        columns: [
          { label: 'Multiple', formItems: [{
            fieldKey: 'multiple', type: 'slot', hint: 'Multiple hint', hintTrigger: 'content', component: { slot: 'multiple' }
          }] },
          { label: 'Empty', formItems: [{ fieldKey: 'empty', type: 'input', hint: 'Empty hint', hintTrigger: 'content' }] },
          { label: 'Single', formItems: [{
            fieldKey: 'single', type: 'slot', hint: 'Single hint', hintTrigger: 'content', component: { slot: 'single' }
          }] }
        ]
      }),
      template: `
        <FormTable ref="formTable" :table-data="rows" :columns="columns" :hint-options="{ mode: 'tooltip' }">
          <template #multiple>
            <span class="first-root">One</span>
            <span class="second-root">Two</span>
          </template>
          <template #single><button class="valid-root">Single</button></template>
        </FormTable>
      `
    })
    const wrapper = mount(Host, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()
    const formTable = wrapper.findComponent(FormTable as any) as Wrapper<Vue>
    const tooltip = getHintTooltip(formTable)
    vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const items = wrapper.findAll('.el-form-item')
    const firstRoot = wrapper.find('.first-root')
    const secondRoot = wrapper.find('.second-root')
    setElementRect(firstRoot.element)
    setElementRect(secondRoot.element)

    await firstRoot.trigger('mouseover')
    await flushTooltip(wrapper)
    expect(tooltip.referenceElm).toBe(items.at(0).element)

    const zeroSizeInput = items.at(1).find('.el-input')
    await zeroSizeInput.trigger('mouseover')
    await flushTooltip(wrapper)
    expect(tooltip.referenceElm).toBe(items.at(1).element)

    const validRoot = wrapper.find('.valid-root')
    const error = document.createElement('div')
    error.className = 'el-form-item__error'
    items.at(2).find('.el-form-item__content').element.appendChild(error)
    setElementRect(validRoot.element)
    setElementRect(error)
    await validRoot.trigger('mouseover')
    await flushTooltip(wrapper)
    expect(tooltip.referenceElm).toBe(validRoot.element)
    await firstRoot.trigger('mouseover')
    await zeroSizeInput.trigger('mouseover')
    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn.mock.calls[0][0]).toContain('Field "multiple"')
    expect(warn.mock.calls[1][0]).toContain('Field "empty"')
    warn.mockRestore()
    wrapper.destroy()
  })

  it('retargets an active field hint when its component root changes', async () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        return this.matches('.el-input, .el-input-number') ? createRect() : createRect(0, 0)
      })
    const createColumns = (type: 'input' | 'number') => [{
      key: 'value-column',
      label: 'Value',
      formItems: [{
        key: 'value-field', fieldKey: 'value', type, hint: 'Value hint', hintTrigger: 'content' as const
      }]
    }]
    const wrapper = mountFormTable({
      hintOptions: { mode: 'tooltip' },
      tableData: [{ value: 1 }],
      columns: createColumns('input')
    })
    try {
      await wrapper.vm.$nextTick()
      const tooltip = getHintTooltip(wrapper)
      vi.spyOn(tooltip, 'handleShowPopper').mockImplementation(() => undefined)
      const update = vi.spyOn(tooltip, 'updatePopper').mockImplementation(() => undefined)
      const inputRoot = wrapper.find('.el-input')

      await inputRoot.trigger('mouseover')
      await flushTooltip(wrapper)
      expect(tooltip.referenceElm).toBe(inputRoot.element)

      await wrapper.setProps({ columns: createColumns('number') })
      await flushTooltip(wrapper)
      const numberRoot = wrapper.find('.el-input-number')
      expect(tooltip.referenceElm).toBe(numberRoot.element)
      expect(update).toHaveBeenCalled()
    } finally {
      wrapper.destroy()
      rectSpy.mockRestore()
    }
  })

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
