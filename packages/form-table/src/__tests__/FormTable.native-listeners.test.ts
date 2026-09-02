import { describe, expect, it, vi } from 'vitest'
import { mountFormTable } from './test-utils'

describe('FormTable component native listeners', () => {
  it('listens to a readonly Element Input root DOM event with the current field context', async () => {
    const click = vi.fn()
    const wrapper = mountFormTable({
      tableData: [{ id: 1, name: 'Alice' }],
      rowKey: 'id',
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          component: {
            props: { readonly: true },
            nativeListeners: { click }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.setProps({ tableData: [{ id: 1, name: 'Alicia' }] })
    await wrapper.vm.$nextTick()

    await wrapper.find('.el-input__inner').trigger('click')

    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.calls[0][0]).toMatchObject({
      row: { id: 1, name: 'Alicia' },
      fieldKey: 'name',
      value: 'Alicia'
    })
    expect(click.mock.calls[0][1]).toBeInstanceOf(MouseEvent)
    wrapper.destroy()
  })

  it('keeps component and native events independent on a direct component', async () => {
    const componentClick = vi.fn()
    const nativeClick = vi.fn()
    const ClickableField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'clickable-field',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('click', 'component-event') }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ name: 'Alice' }],
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            is: ClickableField,
            listeners: { click: componentClick },
            nativeListeners: { click: nativeClick }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    await wrapper.find('.clickable-field').trigger('click')

    expect(componentClick).toHaveBeenCalledTimes(1)
    expect(componentClick.mock.calls[0].slice(1)).toEqual(['component-event'])
    expect(nativeClick).toHaveBeenCalledTimes(1)
    expect(nativeClick.mock.calls[0][1]).toBeInstanceOf(MouseEvent)
    wrapper.destroy()
  })

  it('merges text listeners before native listeners for the same DOM event', async () => {
    const calls: string[] = []
    const wrapper = mountFormTable({
      tableData: [{ summary: '只读摘要' }],
      columns: [{
        label: '摘要',
        formItems: [{
          fieldKey: 'summary',
          type: 'text',
          component: {
            props: { class: 'clickable-summary' },
            listeners: { click: () => calls.push('listener') },
            nativeListeners: { click: () => calls.push('native-listener') }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    await wrapper.find('.clickable-summary').trigger('click')

    expect(calls).toEqual(['listener', 'native-listener'])
    wrapper.destroy()
  })

  it('supports native listeners on registered field types', async () => {
    const click = vi.fn()
    const RegisteredField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('span', { class: 'registered-field' }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ status: 'enabled' }],
      fieldTypes: { status: { is: RegisteredField } },
      columns: [{
        label: '状态',
        formItems: [{
          fieldKey: 'status',
          type: 'status',
          component: { nativeListeners: { click } }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    await wrapper.find('.registered-field').trigger('click')

    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.calls[0][0]).toMatchObject({ fieldKey: 'status', value: 'enabled' })
    expect(click.mock.calls[0][1]).toBeInstanceOf(MouseEvent)
    wrapper.destroy()
  })
})
