import { createLocalVue, mount } from '@vue/test-utils'
import ElementUILegacy from 'element-ui-legacy'
import { describe, expect, it, vi } from 'vitest'
import FormTable from '../index.vue'
import type { FormTableFieldRenderContext } from '../types.public'
import { localVue, mountFormTable } from './test-utils'

describe('FormTable form item slot rendering', () => {
  it('supports FormItem label and error slots on the minimum Element UI peer version', async () => {
    const legacyLocalVue = createLocalVue()
    legacyLocalVue.use(ElementUILegacy)
    const wrapper = mount(FormTable as any, {
      localVue: legacyLocalVue,
      propsData: {
        tableData: [{ name: 'Alice' }],
        columns: [{
          label: '姓名',
          formItems: [{
            fieldKey: 'name',
            type: 'input',
            labelSlot: 'legacy-label',
            errorSlot: 'legacy-error',
            formItemProps: { error: '最低版本错误' }
          }]
        }]
      },
      scopedSlots: {
        'legacy-label': '<span class="legacy-item-label">{{ props.fieldKey }}</span>',
        'legacy-error': '<span class="legacy-item-error">{{ props.error }}</span>'
      },
      attachTo: document.body
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.legacy-item-label').text()).toBe('name')
    expect(wrapper.find('.legacy-item-error').text()).toBe('最低版本错误')
    wrapper.destroy()
  })

  it('renders FormItem label and error slots with field update context', async () => {
    const wrapper = mountFormTable({
      tableData: [{ amount: '', currency: 'CNY' }],
      columns: [{
        label: '金额',
        formItems: [{
          fieldKey: 'amount',
          binding: {
            map: [
              { fieldPath: 'amount', valuePath: 'amount' },
              { fieldPath: 'currency', valuePath: 'currency' }
            ]
          },
          type: 'number',
          component: { model: false },
          labelSlot: 'amount-label',
          errorSlot: 'amount-error',
          formItemProps: {
            label: '默认金额',
            rules: [{ required: true, message: '请输入金额' }]
          }
        }]
      }],
      scopedSlots: {
        'amount-label': `<span
          class="custom-item-label"
          :data-value="props.value"
          :data-binding-currency="props.bindingValue.currency"
          :data-prop="props.propPath"
        >{{ props.row.currency }}|{{ props.itemConfig.fieldKey }}</span>`,
        'amount-error': `<button
          type="button"
          class="custom-item-error"
          :data-prop="props.propPath"
          @click="props.setBindingValue({ amount: 10, currency: 'USD' })"
        >{{ props.error }}</button>`
      }
    })
    await wrapper.vm.$nextTick()

    const label = wrapper.find('.custom-item-label')
    expect(label.text()).toBe('CNY|amount')
    expect(label.attributes('data-binding-currency')).toBe('CNY')
    expect(label.attributes('data-prop')).toBe('tableData.0.amount')
    expect(wrapper.find('.el-form-item__label').text()).not.toContain('默认金额')

    expect(await (wrapper.vm as any).validate()).toBe(false)
    await wrapper.vm.$nextTick()
    const error = wrapper.find('.custom-item-error')
    expect(error.text()).toBe('请输入金额')
    expect(error.attributes('data-prop')).toBe('tableData.0.amount')

    await error.trigger('click')
    const nextTableData = wrapper.emitted('update:tableData')?.at(-1)?.[0]
    expect(nextTableData).toEqual([{ amount: 10, currency: 'USD' }])
    await wrapper.setProps({ tableData: nextTableData })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.custom-item-label').attributes('data-value')).toBe('10')
    wrapper.destroy()
  })

  it('falls back to native FormItem label and error content when configured slots are missing', async () => {
    const wrapper = mountFormTable({
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          labelSlot: 'missing-label',
          errorSlot: 'missing-error',
          formItemProps: { label: '默认姓名', error: '服务端错误' }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.el-form-item__label').text()).toBe('默认姓名')
    expect(wrapper.find('.el-form-item__error').text()).toBe('服务端错误')
    wrapper.destroy()
  })

  it('lets multiple FormItems reuse the same label slot', async () => {
    const wrapper = mountFormTable({
      tableData: [{ first: 'A', second: 'B' }],
      columns: [{
        label: '复用 Label',
        formItems: [
          { fieldKey: 'first', type: 'input', labelSlot: 'shared-label' },
          { fieldKey: 'second', type: 'input', labelSlot: 'shared-label' }
        ]
      }],
      scopedSlots: {
        'shared-label': '<span class="shared-item-label">{{ props.fieldKey }}={{ props.value }}</span>'
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.shared-item-label').wrappers.map(node => node.text())).toEqual([
      'first=A',
      'second=B'
    ])
    wrapper.destroy()
  })

  it('renders a named slot and exposes focused update helpers', async () => {
    const componentPropsResolver = vi.fn(({ row }: FormTableFieldRenderContext) => ({
      suffix: row.school === '一中' ? '（当前）' : ''
    }))
    const slotListener = vi.fn()
    const valueToProp = vi.fn(() => '不应传入字段 Slot')
    const wrapper = mountFormTable({
      tableData: [{ school: '一中' }],
      columns: [{
        label: '学校',
        formItems: [{
          fieldKey: 'school',
          type: 'slot',
          component: {
            slot: 'school',
            model: { valueToProp },
            props: componentPropsResolver,
            options: [{ label: '校区配置', value: 'campus' }],
            listeners: { commit: slotListener }
          }
        }]
      }],
      scopedSlots: {
        school: `<button
          type="button"
          class="slot-setter"
          @click="props.setValue('二中'); props.component.listeners.commit('saved')"
        >{{ props.value }}{{ props.component.props.suffix }}{{ props.component.options[0].label }}{{ props.component.slot }}</button>`
      }
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.slot-setter').text()).toBe('一中（当前）校区配置school')
    expect(componentPropsResolver).toHaveBeenCalledTimes(1)
    expect(valueToProp).not.toHaveBeenCalled()
    expect(Object.keys(componentPropsResolver.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'displayIndex',
      'fieldKey',
      'index',
      'itemConfig',
      'row',
      'tableData',
      'value'
    ])
    await wrapper.find('.slot-setter').trigger('click')
    expect(slotListener).toHaveBeenCalledTimes(1)
    expect(slotListener.mock.calls[0][0]).toMatchObject({
      row: { school: '一中' },
      fieldKey: 'school',
      value: '一中'
    })
    expect(slotListener.mock.calls[0][1]).toBe('saved')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ school: '二中' }])
    wrapper.destroy()
  })

  it('exposes composite binding values and atomic updates to field slots', async () => {
    const wrapper = mountFormTable({
      tableData: [{ startTime: '08:00', endTime: '09:00' }],
      columns: [{
        label: '时间范围',
        formItems: [{
          fieldKey: 'startTime',
          binding: {
            map: [
              { fieldPath: 'startTime', valuePath: '[0]', fallbackValue: '' },
              { fieldPath: 'endTime', valuePath: '[1]', fallbackValue: '' }
            ]
          },
          type: 'slot',
          component: { slot: 'period' }
        }]
      }],
      scopedSlots: {
        period: `<button
          type="button"
          class="period-setter"
          :data-primary="props.value"
          @click="props.setBindingValue([])"
        >{{ props.bindingValue.join('—') }}</button>`
      }
    })
    await wrapper.vm.$nextTick()

    const setter = wrapper.find('.period-setter')
    expect(setter.text()).toBe('08:00—09:00')
    expect(setter.attributes('data-primary')).toBe('08:00')
    await setter.trigger('click')

    expect(wrapper.emitted('update:tableData')).toHaveLength(1)
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{
      startTime: '',
      endTime: ''
    }])
    wrapper.destroy()
  })

  it('preserves static item metadata when fields reuse the same slot', async () => {
    const wrapper = mountFormTable({
      tableData: [{ purchasePrice: 10, salePrice: 20, remark: '无' }],
      columns: [{
        label: '复用字段 Slot',
        formItems: [
          {
            fieldKey: 'purchasePrice',
            type: 'slot',
            meta: { role: 'purchase', currency: 'CNY' },
            component: { slot: 'shared-editor' }
          },
          {
            fieldKey: 'salePrice',
            type: 'slot',
            meta: { role: 'sale', currency: 'USD' },
            component: { slot: 'shared-editor' }
          },
          {
            fieldKey: 'remark',
            type: 'slot',
            component: { slot: 'shared-editor' }
          }
        ]
      }],
      scopedSlots: {
        'shared-editor': `<span
          class="meta-field"
          :data-role="props.itemConfig.meta && props.itemConfig.meta.role"
          :data-component-meta="props.component.props.meta"
        >{{ props.itemConfig.meta ? props.itemConfig.meta.currency : 'none' }}:{{ props.value }}</span>`
      }
    })
    await wrapper.vm.$nextTick()

    const fields = wrapper.findAll('.meta-field')
    expect(fields.wrappers.map(field => field.text())).toEqual([
      'CNY:10',
      'USD:20',
      'none:无'
    ])
    expect(fields.at(0).attributes('data-role')).toBe('purchase')
    expect(fields.at(1).attributes('data-role')).toBe('sale')
    expect(fields.at(2).attributes('data-role')).toBeUndefined()
    expect(fields.wrappers.every(field => field.attributes('data-component-meta') === undefined)).toBe(true)
    wrapper.destroy()
  })

  it('renders native, component, multiple-root, and empty slots without wrapper elements', async () => {
    localVue.component('transparent-slot-root', {
      props: ['value'],
      render(this: any, h: any) {
        return h('section', { class: 'transparent-component' }, this.value)
      }
    })
    const wrapper = mountFormTable({
      tableData: [{ native: '文本', component: '组件', empty: '', missing: '' }],
      columns: [{
        label: '透明 Slot',
        formItems: [{
            fieldKey: 'native',
            type: 'slot',
            component: { slot: 'native-slot' }
          },
          {
            fieldKey: 'component',
            type: 'slot',
            component: { slot: 'component-slot' }
          },
          {
            fieldKey: 'empty',
            type: 'slot',
            component: { slot: 'empty-slot' }
          },
          {
            fieldKey: 'missing',
            type: 'slot',
            component: { slot: 'missing-slot' }
          }]
      }],
      scopedSlots: {
        'native-slot': '<span class="transparent-native">{{ props.value }}</span>',
        'component-slot': '<transparent-slot-root :value="props.value" />',
        'empty-slot': () => []
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.transparent-native').text()).toBe('文本')
    expect(wrapper.find('.transparent-component').text()).toBe('组件')
    expect(wrapper.find('.should-not-render').exists()).toBe(false)
    expect(wrapper.findAll('.el-form-item')).toHaveLength(4)
    expect(wrapper.find('.form-table-slot').exists()).toBe(false)
    wrapper.destroy()
  })

  it('renders every root from a template scoped slot without a wrapper element', async () => {
    const Host = localVue.extend({
      components: { FormTable },
      data() {
        return {
          tableData: [{ multiple: '' }],
          columns: [{
            label: '多根 Slot',
            formItems: [{
              fieldKey: 'multiple',
              type: 'slot',
              hint: '多根内容',
              component: { slot: 'multiple-slot' }
            }]
          }]
        }
      },
      template: `
        <FormTable :table-data="tableData" :columns="columns">
          <template #multiple-slot>
            <span class="transparent-first">A</span>
            <span class="transparent-second">B</span>
          </template>
        </FormTable>
      `
    })
    const wrapper = mount(Host, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.transparent-first').exists()).toBe(true)
    expect(wrapper.find('.transparent-second').exists()).toBe(true)
    expect(wrapper.find('.form-table-slot').exists()).toBe(false)
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('多根内容')
    wrapper.destroy()
  })

})
