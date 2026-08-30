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

describe('FormTable field type registry', () => {
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
