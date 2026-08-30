import { describe, expect, it, vi } from 'vitest'
import type { FormTableFieldRenderContext } from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable component model protocols', () => {
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

})
