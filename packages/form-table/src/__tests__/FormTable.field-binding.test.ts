import { describe, expect, it, vi } from 'vitest'
import type { FormTableFieldBindingContext } from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable composite field binding', () => {
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
