import { createLocalVue, mount } from '@vue/test-utils'
import ElementUILegacy from 'element-ui-legacy'
import { describe, expect, it, vi } from 'vitest'
import FormTable from '../index.vue'
import type {
  FormTableColumnContext,
  FormTableFieldRenderContext
} from '../types.public'
import { localVue, mountFormTable } from './test-utils'

describe('FormTable slot rendering', () => {
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

  it('forwards the native empty slot only when it is provided', async () => {
    const customWrapper = mountFormTable({
      tableData: [],
      tableProps: { emptyText: 'Element 默认空状态' },
      scopedSlots: {
        empty: '<strong class="custom-empty">暂无可编辑数据</strong>'
      }
    })
    await customWrapper.vm.$nextTick()

    expect(customWrapper.find('.custom-empty').text()).toBe('暂无可编辑数据')
    expect(customWrapper.text()).not.toContain('Element 默认空状态')
    customWrapper.destroy()

    const defaultWrapper = mountFormTable({
      tableData: [],
      tableProps: { emptyText: 'Element 默认空状态' }
    })
    await defaultWrapper.vm.$nextTick()

    expect(defaultWrapper.find('.el-table__empty-text').text()).toBe('Element 默认空状态')
    defaultWrapper.destroy()
  })

  it('forwards the native append slot without adding a FormTable wrapper', async () => {
    const renderAppend = async (tableData: Array<{ name: string }>) => {
      const wrapper = mountFormTable({
        tableData,
        scopedSlots: {
          append: '<div class="native-table-append">继续加载</div>'
        }
      })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.el-table__append-wrapper > .native-table-append').text()).toBe('继续加载')
      expect(wrapper.find('.form-table-append').exists()).toBe(false)
      wrapper.destroy()
    }

    await renderAppend([{ name: 'Alice' }])
    await renderAppend([])

    const wrapper = mountFormTable()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.el-table__append-wrapper').exists()).toBe(false)
    wrapper.destroy()
  })

  it('combines an Element expand column prop with cellSlot content', async () => {
    const wrapper = mountFormTable({
      columns: [{ label: '详情', props: { type: 'expand' }, cellSlot: 'row-detail' }],
      scopedSlots: {
        'row-detail': '<div class="expanded-detail">{{ props.row.name }}详情</div>'
      }
    })
    await wrapper.vm.$nextTick()

    const column = wrapper.findComponent({ name: 'ElTableColumn' })
    expect((column.vm as any).type).toBe('expand')
    expect((column.vm as any).$scopedSlots.default).toBeTypeOf('function')
    wrapper.destroy()
  })

  it('renders a named slot and exposes focused update helpers', async () => {
    const componentPropsResolver = vi.fn(({ row }: FormTableFieldRenderContext) => ({
      suffix: row.school === '一中' ? '（当前）' : ''
    }))
    const optionsResolver = vi.fn(() => [{ label: '校区配置', value: 'campus' }])
    const optionPropsResolver = vi.fn(() => ({ label: 'label', value: 'value' }))
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
            options: optionsResolver,
            optionProps: optionPropsResolver,
            listeners: { commit: slotListener }
          }
        }]
      }],
      scopedSlots: {
        school: `<button
          type="button"
          class="slot-setter"
          @click="props.setValue('二中'); props.component.listeners.commit('saved')"
        >{{ props.value }}{{ props.component.props.suffix }}{{ props.component.options[0].label }}{{ props.component.optionProps.label }}{{ props.component.slot }}</button>`
      }
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.slot-setter').text()).toBe('一中（当前）校区配置labelschool')
    expect(componentPropsResolver).toHaveBeenCalledTimes(1)
    expect(optionsResolver).toHaveBeenCalledTimes(1)
    expect(optionPropsResolver).toHaveBeenCalledTimes(1)
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

  it('renders a cellSlot column without field wrappers or a virtual fieldKey', async () => {
    const original = [{ id: 1, name: 'Alice', enabled: true }]
    const wrapper = mountFormTable({
      tableData: original,
      columns: [{
        key: 'actions-column',
        label: '操作',
        cellSlot: 'row-actions',
        props: { width: 120, align: 'center' }
      }],
      scopedSlots: {
        'row-actions': `<button
          type="button"
          class="cell-slot-action"
          :data-index="props.index"
          :data-column-key="props.columnConfig.key"
          @click="props.updateRow({ enabled: !props.row.enabled })"
        >{{ props.row.name }}|{{ props.fieldKey === undefined }}|{{ props.propPath === undefined }}</button>`
      }
    })
    await wrapper.vm.$nextTick()

    const button = wrapper.find('.cell-slot-action')
    expect(button.text()).toBe('Alice|true|true')
    expect(button.attributes('data-index')).toBe('0')
    expect(button.attributes('data-column-key')).toBe('actions-column')
    expect(wrapper.find('.el-form-item').exists()).toBe(false)
    expect(wrapper.find('.el-row').exists()).toBe(false)
    expect(wrapper.find('.el-col').exists()).toBe(false)

    await button.trigger('click')
    expect(original).toEqual([{ id: 1, name: 'Alice', enabled: true }])
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { id: 1, name: 'Alice', enabled: false }
    ])
    expect(wrapper.emitted('field-change')?.[0]?.[0]).toMatchObject({
      fieldKey: 'enabled',
      value: false,
      previousValue: true
    })
    wrapper.destroy()
  })

  it('keeps a cellSlot column empty when its named slot is missing', async () => {
    const wrapper = mountFormTable({
      columns: [{ label: '操作', cellSlot: 'missing-actions' }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('操作')
    expect(wrapper.text()).not.toContain('Alice')
    expect(wrapper.find('.el-form-item').exists()).toBe(false)
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

  it('exposes the resolved dynamic label and raw columnConfig to the header slot', async () => {
    const headerProps = vi.fn(({ tableData }: FormTableColumnContext) => ({
      class: `resolved-header-${tableData.length}`,
      'aria-label': '学校说明'
    }))
    const headerHint = vi.fn(({ columnConfig, tableData }: FormTableColumnContext) => (
      `${columnConfig.label}完整说明（${tableData.length}）`
    ))
    const wrapper = mountFormTable({
      columns: [{
        key: 'school-column',
        label: '学校',
        props: ({ tableData }) => ({ label: `学校（${tableData.length}）` }),
        headerSlot: 'school-header',
        headerHint,
        headerProps,
        formItems: [{ fieldKey: 'name', type: 'input' }]
      }],
      scopedSlots: {
        'school-header': `
          <span class="school-header">
            {{ props.label }}|{{ props.columnConfig.label }}|{{ props.columnConfig.key }}|{{ props.column === undefined }}|{{ props.header === undefined }}
          </span>
        `
      }
    })
    await wrapper.vm.$nextTick()

    const header = wrapper.find('.form-table-column-header')
    expect((wrapper.findComponent({ name: 'ElTableColumn' }).vm as any).label).toBe('学校（1）')
    expect(wrapper.find('.school-header').text()).toBe('学校（1）|学校|school-column|true|true')
    expect(wrapper.find('.school-header').classes()).not.toContain('resolved-header-1')
    expect(wrapper.find('.school-header').attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('.school-header').attributes('title')).toBeUndefined()
    expect(header.classes()).toContain('resolved-header-1')
    expect(header.attributes('aria-label')).toBe('学校说明')
    expect(header.attributes('title')).toBeUndefined()
    expect(headerProps).toHaveBeenCalledTimes(1)
    expect(headerHint).not.toHaveBeenCalled()

    await wrapper.setProps({ tableData: [{ name: 'Alice' }, { name: 'Bob' }] })
    await wrapper.vm.$nextTick()
    expect((wrapper.findComponent({ name: 'ElTableColumn' }).vm as any).label).toBe('学校（2）')
    expect(wrapper.find('.school-header').text()).toBe('学校（2）|学校|school-column|true|true')
    expect(header.attributes('title')).toBeUndefined()
    expect(headerHint).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
