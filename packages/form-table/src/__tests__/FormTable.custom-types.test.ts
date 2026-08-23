import { describe, expect, it, vi } from 'vitest'
import type { FieldTypeRegistry } from '../types.public'
import { mountFormTable } from './test-utils'

const createButtonField = (
  className: string,
  prop = 'value',
  event = 'input',
  nextValue: unknown = 'next'
) => ({
  inheritAttrs: false,
  props: [prop],
  render(this: any, h: any) {
    return h('button', {
      class: className,
      attrs: {
        type: 'button',
        'data-value': JSON.stringify(this[prop]),
        'data-size': this.$attrs.size,
        'data-marker': this.$attrs.marker
      },
      on: { click: () => this.$emit(event, nextValue, 'raw-extra') }
    })
  }
})

describe('FormTable custom field types', () => {
  it('renders a registered standard-model component without changing the field workflow', async () => {
    const StandardField = createButtonField('registered-standard')
    const wrapper = mountFormTable({
      tableData: [{ name: 'Alice' }],
      fieldTypes: { employee: { is: StandardField } },
      columns: [{
        label: '员工',
        formItems: [{ fieldKey: 'name', type: 'employee' }]
      }]
    })
    await wrapper.vm.$nextTick()

    const field = wrapper.find('.registered-standard')
    expect(field.attributes('data-value')).toBe(JSON.stringify('Alice'))
    await field.trigger('click')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ name: 'next' }])
    wrapper.destroy()
  })

  it('merges default and item props, adapts a custom model, and preserves raw listener args', async () => {
    const selectionListener = vi.fn()
    const valueToProp = vi.fn((value: string) => ({ id: value, source: 'row' }))
    const EmployeeField = createButtonField(
      'registered-employee',
      'selectedId',
      'user-confirm',
      { id: 'user-2', name: 'Bob' }
    )
    const defaultProps = vi.fn(() => ({ size: 'small', marker: 'default' }))
    const itemProps = vi.fn(() => ({ marker: 'item' }))
    const wrapper = mountFormTable({
      tableData: [{ employeeId: 'user-1' }],
      fieldTypes: {
        employee: {
          is: EmployeeField,
          model: {
            prop: 'selectedId',
            event: 'user-confirm',
            valueToProp,
            valueFromEvent: (...args) => (args[0] as { id: string }).id
          },
          props: defaultProps
        }
      },
      columns: [{
        label: '员工',
        formItems: [{
          fieldKey: 'employeeId',
          type: 'employee',
          component: {
            props: itemProps,
            listeners: { 'user-confirm': selectionListener }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const field = wrapper.find('.registered-employee')
    expect(field.attributes('data-value')).toBe(JSON.stringify({ id: 'user-1', source: 'row' }))
    expect(field.attributes('data-size')).toBe('small')
    expect(field.attributes('data-marker')).toBe('item')
    await field.trigger('click')

    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ employeeId: 'user-2' }])
    expect(selectionListener.mock.calls[0].slice(1)).toEqual([
      { id: 'user-2', name: 'Bob' },
      'raw-extra'
    ])
    expect(defaultProps).toHaveBeenCalledTimes(1)
    expect(itemProps).toHaveBeenCalledTimes(1)
    expect(valueToProp).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ fieldKey: 'employeeId', value: 'user-1' })
    )
    wrapper.destroy()
  })

  it('lets an item replace the registered model as one complete protocol', async () => {
    const registeredValueToProp = vi.fn((value: boolean) => !value)
    const itemValueToProp = vi.fn((value: boolean) => value)
    const OverrideField = createButtonField('registered-override', 'checked', 'toggle', false)
    const wrapper = mountFormTable({
      tableData: [{ enabled: true }],
      fieldTypes: {
        businessSwitch: {
          is: OverrideField,
          model: {
            prop: 'wrongProp',
            event: 'wrong-event',
            valueToProp: registeredValueToProp
          }
        }
      },
      columns: [{
        label: '启用',
        formItems: [{
          fieldKey: 'enabled',
          type: 'businessSwitch',
          component: {
            model: { prop: 'checked', event: 'toggle', valueToProp: itemValueToProp }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const field = wrapper.find('.registered-override')
    expect(field.attributes('data-value')).toBe('true')
    expect(registeredValueToProp).not.toHaveBeenCalled()
    expect(itemValueToProp).toHaveBeenCalled()
    await field.trigger('click')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ enabled: false }])
    wrapper.destroy()
  })

  it('supports model false for a registered display component', async () => {
    const valueToProp = vi.fn(() => 'transformed')
    const DisplayField = {
      inheritAttrs: false,
      render(this: any, h: any) {
        return h('span', {
          class: 'registered-display',
          attrs: {
            'data-status': this.$attrs.status,
            'data-has-value': String(Object.prototype.hasOwnProperty.call(this.$attrs, 'value')),
            'data-has-input': String(Boolean(this.$listeners.input))
          }
        })
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ status: 'approved' }],
      fieldTypes: {
        status: {
          is: DisplayField,
          model: { valueToProp },
          props: ({ value }) => ({ status: value })
        }
      },
      columns: [{
        label: '状态',
        formItems: [{
          fieldKey: 'status',
          type: 'status',
          component: { model: false }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const field = wrapper.find('.registered-display')
    expect(field.attributes()).toMatchObject({
      'data-status': 'approved',
      'data-has-value': 'false',
      'data-has-input': 'false'
    })
    expect(valueToProp).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('combines binding.map with a registered composite model in one row update', async () => {
    const selectionListener = vi.fn()
    const valueToProp = vi.fn((value: unknown) => ({ payload: value }))
    const EmployeeField = createButtonField(
      'registered-composite',
      'selection',
      'user-confirm',
      { payload: { id: 'user-2' } }
    )
    const wrapper = mountFormTable({
      tableData: [{ employeeId: 'user-1', employeeName: 'Alice' }],
      fieldTypes: {
        employee: {
          is: EmployeeField,
          model: {
            prop: 'selection',
            event: 'user-confirm',
            valueToProp,
            valueFromEvent: (...args) => (args[0] as { payload: unknown }).payload
          }
        }
      },
      columns: [{
        label: '员工',
        formItems: [{
          fieldKey: 'employeeId',
          type: 'employee',
          binding: {
            map: [
              { fieldPath: 'employeeId', valuePath: 'id', fallbackValue: '' },
              { fieldPath: 'employeeName', valuePath: 'name', fallbackValue: '未命名' }
            ]
          },
          component: { listeners: { 'user-confirm': selectionListener } }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const field = wrapper.find('.registered-composite')
    expect(field.attributes('data-value')).toBe(JSON.stringify({
      payload: { id: 'user-1', name: 'Alice' }
    }))
    await field.trigger('click')
    expect(wrapper.emitted('update:tableData')).toHaveLength(1)
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{
      employeeId: 'user-2',
      employeeName: '未命名'
    }])
    expect(wrapper.emitted('field-change')?.map(event => event[0])).toEqual([
      expect.objectContaining({ fieldKey: 'employeeId', value: 'user-2' }),
      expect.objectContaining({ fieldKey: 'employeeName', value: '未命名' })
    ])
    expect(valueToProp).toHaveBeenCalledWith(
      { id: 'user-1', name: 'Alice' },
      expect.objectContaining({ fieldKey: 'employeeId', value: 'user-1' })
    )
    expect(selectionListener.mock.calls[0][0].bindingValue).toEqual({
      id: 'user-1',
      name: 'Alice'
    })
    wrapper.destroy()
  })

  it('reacts to registry replacement and keeps registries isolated by instance', async () => {
    const FirstField = createButtonField('registered-first')
    const SecondField = createButtonField('registered-second')
    const columns = [{ label: '字段', formItems: [{ fieldKey: 'name', type: 'business' }] }]
    const firstRegistry: FieldTypeRegistry = { business: { is: FirstField } }
    const secondRegistry: FieldTypeRegistry = { business: { is: SecondField } }
    const first = mountFormTable({ tableData: [{ name: 'A' }], columns, fieldTypes: firstRegistry })
    const second = mountFormTable({ tableData: [{ name: 'B' }], columns, fieldTypes: secondRegistry })
    await first.vm.$nextTick()

    expect(first.find('.registered-first').exists()).toBe(true)
    expect(second.find('.registered-second').exists()).toBe(true)

    await first.setProps({ fieldTypes: secondRegistry })
    expect(first.find('.registered-second').exists()).toBe(true)
    expect(second.find('.registered-second').exists()).toBe(true)
    first.destroy()
    second.destroy()
  })

  it('warns once per unknown name and leaves field content empty', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountFormTable({
      tableData: [{ first: '', second: '' }],
      columns: [{
        label: '未知字段',
        formItems: [
          { fieldKey: 'first', type: 'missing-type' },
          { fieldKey: 'second', type: 'missing-type' }
        ]
      }]
    })
    await wrapper.vm.$nextTick()

    const messages = warn.mock.calls
      .map(args => String(args[0]))
      .filter(message => message.includes('Unknown field type "missing-type"'))
    expect(messages).toHaveLength(1)
    expect(wrapper.findAllComponents({ name: 'FormTableDynamicFieldRenderer' })).toHaveLength(0)
    warn.mockRestore()
    wrapper.destroy()
  })

  it('keeps builtin targets ahead of registry entries that bypass the helper', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const FakeInput = createButtonField('reserved-fake-input')
    const wrapper = mountFormTable({
      tableData: [{ name: 'Alice' }],
      fieldTypes: { input: { is: FakeInput } },
      columns: [{ label: '姓名', formItems: [{ fieldKey: 'name', type: 'input' }] }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.el-input').exists()).toBe(true)
    expect(wrapper.find('.reserved-fake-input').exists()).toBe(false)
    expect(warn.mock.calls.some(args => String(args[0]).includes('Field type "input" is reserved')))
      .toBe(true)
    warn.mockRestore()
    wrapper.destroy()
  })
})
