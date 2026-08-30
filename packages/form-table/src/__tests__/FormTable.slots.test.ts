import { createLocalVue, mount } from '@vue/test-utils'
import ElementUILegacy from 'element-ui-legacy'
import { describe, expect, it } from 'vitest'
import FormTable from '../index.vue'
import { mountFormTable } from './test-utils'

describe('FormTable form item slots', () => {
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

})
