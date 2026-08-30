import { describe, expect, it, vi } from 'vitest'
import type { FormTableFieldRenderContext } from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable field slots', () => {
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
      'bindingValue',
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

})
