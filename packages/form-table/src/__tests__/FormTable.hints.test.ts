import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FormTableColumn from '../FormTableColumn.vue'
import type { FormTableFieldRenderContext } from '../types.public'
import * as hintUtils from '../utils/hint'
import { localVue, mountFormTable } from './test-utils'

describe('FormTable lightweight hint behavior', () => {
  it('skips field hint resolution when neither field nor table default hint is configured', async () => {
    const resolveFieldHint = vi.spyOn(hintUtils, 'resolveFormTableFieldHint')
    const wrapper = mountFormTable({
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          formItemProps: { title: '原生标题' }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.el-form-item').attributes('title')).toBe('原生标题')
    expect(resolveFieldHint).not.toHaveBeenCalled()
    resolveFieldHint.mockRestore()
    wrapper.destroy()
  })

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

  it('shows a dynamic numeric hint for the initial number value', async () => {
    const wrapper = mountFormTable({
      hintOptions: { mode: 'title' },
      tableData: [{ amount: 0 }],
      columns: [{
        label: '金额',
        formItems: [{ fieldKey: 'amount', type: 'number', hint: ({ value }) => value }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.el-form-item').attributes('title')).toBe('0')

    await wrapper.setProps({ tableData: [{ amount: 12 }] })
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('12')
    wrapper.destroy()
  })
})
