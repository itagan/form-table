import { describe, expect, it } from 'vitest'
import type { ColumnConfig } from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable stale field context safety', () => {
  it('keeps an event context bound to its original field after configs are replaced', async () => {
    let savedContext: any
    const CaptureField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'capture-original-config',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('capture') }
        }, this.value)
      }
    }
    const createColumns = (key: string, fieldKey: string): ColumnConfig[] => [{
      key: 'identity-column',
      label: '身份',
      formItems: [{
        key,
        fieldKey,
        type: 'component',
        component: {
          is: CaptureField,
          listeners: { capture: context => { savedContext = context } }
        }
      }]
    }]
    const row = { name: 'Alice', alias: 'A' }
    const wrapper = mountFormTable({ tableData: [row], columns: createColumns('name-field', 'name') })
    await wrapper.vm.$nextTick()
    await wrapper.find('.capture-original-config').trigger('click')
    await wrapper.setProps({ columns: createColumns('alias-field', 'alias') })
    await wrapper.vm.$nextTick()

    expect(savedContext.itemConfig.key).toBe('name-field')
    savedContext.setValue('Alicia')

    const updates = wrapper.emitted('update:tableData') || []
    expect(updates[updates.length - 1]?.[0]).toEqual([{ name: 'Alicia', alias: 'A' }])
    wrapper.destroy()
  })

  it('does not update another row when the bound rowKey no longer exists', async () => {
    let savedContext: any
    const CaptureField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'capture-deleted-row',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('capture') }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      rowKey: 'id',
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            is: CaptureField,
            listeners: { capture: context => { savedContext = context } }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.findAll('.capture-deleted-row').at(0).trigger('click')
    await wrapper.setProps({ tableData: [{ id: 2, name: 'Bob' }] })
    await wrapper.vm.$nextTick()

    savedContext.updateRow({ name: 'Wrong row' })

    expect(wrapper.emitted('update:tableData')).toBeUndefined()
    expect(wrapper.emitted('field-change')).toBeUndefined()
    wrapper.destroy()
  })
})
