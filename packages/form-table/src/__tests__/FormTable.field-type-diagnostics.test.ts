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

describe('FormTable field type diagnostics', () => {
  it('warns once per unknown name and leaves field content empty', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountFormTable({
      tableData: [{ first: '', second: '' }],
      fieldTypes: { employee: { is: createButtonField('unused-employee') } },
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
    expect(messages[0]).toContain('column "未知字段", field "first"')
    expect(messages[0]).toContain('Available custom types: "employee"')
    expect(wrapper.findAllComponents({ name: 'FormTableDynamicFieldRenderer' })).toHaveLength(0)
    warn.mockRestore()
    wrapper.destroy()
  })

  it('diagnoses invalid registrations and forbidden item overrides once per issue', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountFormTable({
      tableData: [{ employeeId: '' }, { employeeId: '' }],
      fieldTypes: ({
        employee: {
          is: '',
          listeners: {},
          model: { event: 1 }
        }
      } as unknown as FieldTypeRegistry),
      columns: [{
        key: 'owners',
        label: '负责人',
        formItems: [{
          fieldKey: 'employeeId',
          type: 'employee',
          component: { resolveComponent: (() => undefined) as never }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const messages = warn.mock.calls.map(args => String(args[0]))
    expect(messages.filter(message => message.includes('unsupported registration keys "listeners"')))
      .toHaveLength(1)
    expect(messages.filter(message => message.includes('"is" must be a non-empty')))
      .toHaveLength(1)
    expect(messages.filter(message => message.includes('model.event must be a string')))
      .toHaveLength(1)
    expect(messages.filter(message => message.includes('cannot use item component.resolveComponent')))
      .toHaveLength(1)
    expect(messages.some(message => message.includes('column "owners", field "employeeId"')))
      .toBe(true)
    warn.mockRestore()
    wrapper.destroy()
  })

})
