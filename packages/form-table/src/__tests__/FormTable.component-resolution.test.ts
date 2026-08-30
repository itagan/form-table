import { describe, expect, it, vi } from 'vitest'
import type {
  FormTableFieldBindingContext,
  FormTableFieldRenderContext
} from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable component resolution', () => {
  it('renders a directly supplied component and wraps its listeners', async () => {
    const listener = vi.fn((context) => context.setValue('disabled'))
    const componentProps = vi.fn((context: FormTableFieldBindingContext) => ({
      marker: context.fieldKey,
      bindingValue: context.bindingValue
    }))
    const StatusInput = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'status-input',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('commit', 'saved', { source: 'button' }) }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ status: 'enabled' }],
      columns: [{
        label: '状态',
        formItems: [{
            fieldKey: 'status',
            type: 'component',
            hint: '状态字段说明',
            component: {
              is: StatusInput,
              props: componentProps,
              listeners: { commit: listener }
            }
          }]
      }]
    })
    await wrapper.vm.$nextTick()
    expect(componentProps).toHaveBeenCalledTimes(1)
    expect(componentProps.mock.calls[0][0].bindingValue).toBe('enabled')
    expect(Object.keys(componentProps.mock.calls[0][0])).not.toContain('setBindingValue')
    expect(Object.keys(componentProps.mock.calls[0][0])).not.toContain('hint')
    await wrapper.find('.status-input').trigger('click')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0]).toMatchObject({
      row: { status: 'enabled' },
      index: 0,
      fieldKey: 'status',
      value: 'enabled',
      columnConfig: { label: '状态' },
      itemConfig: { fieldKey: 'status', type: 'component' }
    })
    expect(Object.keys(listener.mock.calls[0][0]).sort()).toEqual([
      'bindingValue',
      'columnConfig',
      'displayIndex',
      'fieldKey',
      'index',
      'itemConfig',
      'row',
      'setBindingValue',
      'setValue',
      'tableData',
      'updateRow',
      'value'
    ])
    expect(listener.mock.calls[0].slice(1)).toEqual(['saved', { source: 'button' }])
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ status: 'disabled' }])
    wrapper.destroy()
  })

  it('resolves the component from the current row and keeps model updates working', async () => {
    const createEditor = (name: string, className: string) => ({
      name,
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: className,
          attrs: { type: 'button' },
          on: { click: () => this.$emit('input', `${this.value}-updated`) }
        }, this.value)
      }
    })
    const VenueEditor = createEditor('VenueEditor', 'venue-editor')
    const HotelEditor = {
      name: 'HotelEditor',
      model: { prop: 'selected', event: 'change' },
      props: ['selected'],
      render(this: any, h: any) {
        return h('button', {
          class: 'hotel-editor',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('change', `${this.selected}-updated`) }
        }, this.selected)
      }
    }
    const resolveComponent = vi.fn((context: FormTableFieldRenderContext) => (
      context.row.type === 'hotel' ? HotelEditor : VenueEditor
    ))
    const wrapper = mountFormTable({
      tableData: [
        { type: 'venue', detail: '会场需求' },
        { type: 'hotel', detail: '酒店需求' }
      ],
      columns: [{
        label: '需求说明',
        formItems: [{
          fieldKey: 'detail',
          type: 'component',
          component: { resolveComponent }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.venue-editor').text()).toBe('会场需求')
    expect(wrapper.find('.hotel-editor').text()).toBe('酒店需求')
    expect(resolveComponent).toHaveBeenCalledTimes(2)
    expect(resolveComponent.mock.calls[1][0]).toMatchObject({
      row: { type: 'hotel', detail: '酒店需求' },
      index: 1,
      fieldKey: 'detail',
      value: '酒店需求'
    })

    await wrapper.find('.hotel-editor').trigger('click')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { type: 'venue', detail: '会场需求' },
      { type: 'hotel', detail: '酒店需求-updated' }
    ])
    wrapper.destroy()
  })

  it('falls back to the static component target when resolveComponent returns undefined', async () => {
    const DefaultEditor = {
      props: ['value'],
      render(this: any, h: any) {
        return h('span', { class: 'default-editor' }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ detail: '默认需求' }],
      columns: [{
        label: '需求说明',
        formItems: [{
          fieldKey: 'detail',
          type: 'component',
          component: {
            is: DefaultEditor,
            resolveComponent: () => undefined
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.default-editor').text()).toBe('默认需求')
    wrapper.destroy()
  })

  it('renders an empty field when no component can be resolved', async () => {
    const wrapper = mountFormTable({
      tableData: [{ detail: '未支持的需求' }],
      columns: [{
        label: '需求说明',
        formItems: [{
          fieldKey: 'detail',
          type: 'component',
          component: { resolveComponent: () => undefined }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('未支持的需求')
    expect(wrapper.find('input').exists()).toBe(false)
    wrapper.destroy()
  })

})
