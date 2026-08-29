import { describe, expect, it, vi } from 'vitest'
import type {
  FormTableFieldBindingContext,
  FormTableFieldRenderContext
} from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable component rendering and model protocols', () => {
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

  it('preserves a component declared Vue 2 model when model config is omitted', async () => {
    const DeclaredModelSwitch = {
      model: { prop: 'checked', event: 'toggle' },
      props: ['checked'],
      render(this: any, h: any) {
        return h('button', {
          class: 'declared-model-switch',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('toggle', !this.checked) }
        }, String(this.checked))
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ enabled: true }],
      columns: [{
        label: '启用',
        formItems: [{
          fieldKey: 'enabled',
          type: 'component',
          component: { is: DeclaredModelSwitch }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.declared-model-switch').text()).toBe('true')
    await wrapper.find('.declared-model-switch').trigger('click')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ enabled: false }])
    wrapper.destroy()
  })

  it('supports a custom model prop, event, value extractor, and same-event listener', async () => {
    const selectionListener = vi.fn()
    const UserSelector = {
      props: ['selectedId'],
      render(this: any, h: any) {
        return h('button', {
          class: 'custom-model-selector',
          attrs: { type: 'button', 'data-selected-id': this.selectedId },
          on: {
            click: () => this.$emit('select', { id: 'user-2', name: 'Bob' }, 'manual')
          }
        }, this.selectedId)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ ownerId: 'user-1' }],
      columns: [{
        label: '负责人',
        formItems: [{
          fieldKey: 'ownerId',
          type: 'component',
          component: {
            is: UserSelector,
            model: {
              prop: 'selectedId',
              event: 'select',
              valueFromEvent: (_context, ...args) => (args[0] as { id: string }).id
            },
            listeners: { select: selectionListener }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.custom-model-selector').attributes('data-selected-id')).toBe('user-1')
    await wrapper.find('.custom-model-selector').trigger('click')

    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ ownerId: 'user-2' }])
    expect(selectionListener).toHaveBeenCalledTimes(1)
    expect(selectionListener.mock.calls[0][0]).toMatchObject({
      fieldKey: 'ownerId',
      value: 'user-1'
    })
    expect(selectionListener.mock.calls[0].slice(1)).toEqual([
      { id: 'user-2', name: 'Bob' },
      'manual'
    ])
    wrapper.destroy()
  })

  it('transforms the binding value before passing it to a component model prop', async () => {
    const amountListener = vi.fn()
    const valueToProp = vi.fn((context: FormTableFieldRenderContext, value: number) => ({
      amount: value / 100,
      currency: context.row.currency
    }))
    const MoneyField = {
      props: ['money'],
      render(this: any, h: any) {
        return h('button', {
          class: 'input-transform-money',
          attrs: { type: 'button', 'data-money': JSON.stringify(this.money) },
          on: {
            click: () => this.$emit('amount-change', { amount: 13.5 }, 'raw-meta')
          }
        })
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ amountInCents: 1250, currency: 'CNY' }],
      columns: [{
        label: '金额',
        formItems: [{
          fieldKey: 'amountInCents',
          type: 'component',
          component: {
            is: MoneyField,
            model: {
              prop: 'money',
              event: 'amount-change',
              valueToProp,
              valueFromEvent: (_context, ...args) => (
                Math.round((args[0] as { amount: number }).amount * 100)
              )
            },
            listeners: { 'amount-change': amountListener }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const field = wrapper.find('.input-transform-money')
    expect(field.attributes('data-money')).toBe(JSON.stringify({ amount: 12.5, currency: 'CNY' }))
    expect(valueToProp).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldKey: 'amountInCents',
        value: 1250,
        row: { amountInCents: 1250, currency: 'CNY' }
      }),
      1250
    )

    await field.trigger('click')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{
      amountInCents: 1350,
      currency: 'CNY'
    }])
    expect(amountListener.mock.calls[0][0].bindingValue).toBe(1250)
    expect(amountListener.mock.calls[0].slice(1)).toEqual([{ amount: 13.5 }, 'raw-meta'])
    wrapper.destroy()
  })

  it('supports input and output transforms on builtin editable types', async () => {
    const wrapper = mountFormTable({
      tableData: [{ code: 7 }],
      columns: [{
        label: '编码',
        formItems: [{
          fieldKey: 'code',
          type: 'input',
          component: {
            model: {
              valueToProp: (_context, value) => `CODE-${String(value)}`,
              valueFromEvent: (_context, value) => Number(String(value).replace('CODE-', ''))
            }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const input = wrapper.findComponent({ name: 'ElInput' })
    expect((input.vm as any).value).toBe('CODE-7')
    input.vm.$emit('input', 'CODE-9')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ code: 9 }])
    wrapper.destroy()
  })

  it('passes nullish input transform results to the model prop without fallback', async () => {
    const NullishField = {
      props: ['converted'],
      render(this: any, h: any) {
        return h('span', {
          class: 'nullish-model-field',
          attrs: {
            'data-is-null': String(this.converted === null),
            'data-is-undefined': String(this.converted === undefined)
          }
        })
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ source: 'first' }, { source: 'second' }],
      columns: [{
        label: '空值',
        formItems: [{
          fieldKey: 'source',
          type: 'component',
          component: {
            is: NullishField,
            model: {
              prop: 'converted',
              valueToProp: ({ index }, _value) => index === 0 ? null : undefined
            }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const fields = wrapper.findAll('.nullish-model-field')
    expect(fields.at(0).attributes()).toMatchObject({
      'data-is-null': 'true',
      'data-is-undefined': 'false'
    })
    expect(fields.at(1).attributes()).toMatchObject({
      'data-is-null': 'false',
      'data-is-undefined': 'true'
    })
    wrapper.destroy()
  })

  it('maps one component model value to multiple row fields in one update', async () => {
    const selectionListener = vi.fn()
    const UserSelector = {
      props: ['selectedUser'],
      render(this: any, h: any) {
        return h('button', {
          class: 'composite-model-selector',
          attrs: {
            type: 'button',
            'data-selected-user': JSON.stringify(this.selectedUser)
          },
          on: {
            click: () => this.$emit('select', {
              payload: { id: 'user-2' }
            })
          }
        })
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ ownerId: 'user-1', ownerName: 'Alice' }],
      columns: [{
        label: '负责人',
        formItems: [{
          fieldKey: 'ownerId',
          binding: {
            map: [
              { fieldPath: 'ownerId', valuePath: 'id' },
              { fieldPath: 'ownerName', valuePath: 'profile.name', fallbackValue: '未命名' }
            ]
          },
          type: 'component',
          component: {
            is: UserSelector,
            model: {
              prop: 'selectedUser',
              event: 'select',
              valueFromEvent: (_context, ...args) => (args[0] as any).payload
            },
            listeners: { select: selectionListener }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const selector = wrapper.find('.composite-model-selector')
    expect((wrapper.findComponent({ name: 'ElFormItem' }).vm as any).prop).toBe('tableData.0.ownerId')
    expect(selector.attributes('data-selected-user')).toBe(JSON.stringify({
      id: 'user-1',
      profile: { name: 'Alice' }
    }))
    await selector.trigger('click')

    expect(wrapper.emitted('update:tableData')).toHaveLength(1)
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{
      ownerId: 'user-2',
      ownerName: '未命名'
    }])
    expect(wrapper.emitted('field-change')?.map(event => event[0])).toEqual([
      expect.objectContaining({ fieldKey: 'ownerId', value: 'user-2' }),
      expect.objectContaining({ fieldKey: 'ownerName', value: '未命名' })
    ])
    expect(selectionListener).toHaveBeenCalledTimes(1)
    expect(selectionListener.mock.calls[0][0].bindingValue).toEqual({
      id: 'user-1',
      profile: { name: 'Alice' }
    })
    wrapper.destroy()
  })

  it('does not inject model props or listeners when model is false', async () => {
    const DisplayOnlyField = {
      inheritAttrs: false,
      props: ['status'],
      render(this: any, h: any) {
        return h('span', {
          class: 'display-only-field',
          attrs: {
            'data-status': this.status,
            'data-has-value': String(Object.prototype.hasOwnProperty.call(this.$attrs, 'value')),
            'data-has-input': String(Boolean(this.$listeners.input))
          }
        }, this.status)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ status: 'approved' }],
      columns: [{
        label: '状态',
        formItems: [{
          fieldKey: 'status',
          type: 'component',
          component: {
            is: DisplayOnlyField,
            model: false,
            props: ({ value }) => ({ status: value })
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const field = wrapper.find('.display-only-field')
    expect(field.attributes('data-status')).toBe('approved')
    expect(field.attributes('data-has-value')).toBe('false')
    expect(field.attributes('data-has-input')).toBe('false')
    expect(wrapper.emitted('update:tableData')).toBeUndefined()
    wrapper.destroy()
  })

  it('reads and manually writes a mapped binding when model is false', async () => {
    const propsResolver = vi.fn((context: FormTableFieldBindingContext) => ({
      selection: context.bindingValue
    }))
    const confirmListener = vi.fn((context, employee) => {
      context.setBindingValue(employee)
    })
    const EmployeePicker = {
      props: ['selection'],
      render(this: any, h: any) {
        return h('button', {
          class: 'manual-composite-picker',
          attrs: {
            type: 'button',
            'data-selection': JSON.stringify(this.selection)
          },
          on: {
            click: () => this.$emit('confirm', { id: 'user-2', name: 'Bob' })
          }
        })
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ employeeId: 'user-1', employeeName: 'Alice' }],
      columns: [{
        label: '员工',
        formItems: [{
          fieldKey: 'employeeId',
          type: 'component',
          binding: {
            map: [
              { fieldPath: 'employeeId', valuePath: 'id' },
              { fieldPath: 'employeeName', valuePath: 'name' }
            ]
          },
          component: {
            is: EmployeePicker,
            model: false,
            props: propsResolver,
            listeners: { confirm: confirmListener }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const picker = wrapper.find('.manual-composite-picker')
    expect(picker.attributes('data-selection')).toBe(JSON.stringify({
      id: 'user-1',
      name: 'Alice'
    }))
    expect(Object.keys(propsResolver.mock.calls[0][0])).not.toContain('setBindingValue')

    await picker.trigger('click')

    expect(wrapper.emitted('update:tableData')).toHaveLength(1)
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{
      employeeId: 'user-2',
      employeeName: 'Bob'
    }])
    expect(wrapper.emitted('field-change')?.map(event => event[0])).toEqual([
      expect.objectContaining({ fieldKey: 'employeeId', value: 'user-2' }),
      expect.objectContaining({ fieldKey: 'employeeName', value: 'Bob' })
    ])
    expect(confirmListener).toHaveBeenCalledTimes(1)

    await wrapper.setProps({
      tableData: [{ employeeId: 'user-3', employeeName: 'Carol' }]
    })
    expect(wrapper.find('.manual-composite-picker').attributes('data-selection')).toBe(JSON.stringify({
      id: 'user-3',
      name: 'Carol'
    }))
    wrapper.destroy()
  })
})
