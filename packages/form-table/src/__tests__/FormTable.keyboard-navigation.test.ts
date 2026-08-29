import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import type { TableRow } from '../types.public'
import { mountFormTable } from './test-utils'

const CustomEditor = defineComponent({
  render() {
    return h('input', { class: 'custom-editor' })
  }
})

const dispatchEnter = (
  element: Element,
  init: KeyboardEventInit = {}
) => {
  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
    ...init
  })
  element.dispatchEvent(event)
  return event
}

describe('FormTable keyboard navigation', () => {
  it('does not change native Enter behavior unless navigation is enabled', async () => {
    const wrapper = mountFormTable({
      tableData: [{ first: '', second: '' }],
      columns: [{
        label: '字段',
        formItems: [
          { fieldKey: 'first', type: 'input' },
          { fieldKey: 'second', type: 'input' }
        ]
      }]
    })
    await wrapper.vm.$nextTick()
    const inputs = wrapper.findAll('input')
    ;(inputs.at(0).element as HTMLInputElement).focus()

    const event = dispatchEnter(inputs.at(0).element)
    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(inputs.at(0).element)
    wrapper.destroy()
  })

  it('moves forward and backward without wrapping at boundaries', async () => {
    const wrapper = mountFormTable({
      navigationOptions: {},
      tableData: [{ first: '', second: '', third: '' }],
      columns: [{
        label: '字段',
        formItems: [
          { fieldKey: 'first', type: 'input' },
          { fieldKey: 'second', type: 'input' },
          {
            fieldKey: 'third',
            type: 'component',
            component: {
              is: CustomEditor
            }
          }
        ]
      }]
    })
    await wrapper.vm.$nextTick()
    const inputs = wrapper.findAll('input')
    ;(inputs.at(0).element as HTMLInputElement).focus()

    expect(dispatchEnter(inputs.at(0).element).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(inputs.at(1).element)
    expect(dispatchEnter(inputs.at(1).element, { shiftKey: true }).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(inputs.at(0).element)
    expect(dispatchEnter(inputs.at(0).element, { shiftKey: true }).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(inputs.at(0).element)

    ;(inputs.at(2).element as HTMLInputElement).focus()
    expect(dispatchEnter(inputs.at(2).element).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(inputs.at(2).element)
    wrapper.destroy()
  })

  it('skips hidden, disabled, and readonly fields', async () => {
    const wrapper = mountFormTable({
      navigationOptions: {},
      tableData: [{ first: '', hidden: '', disabled: '', readonly: '', last: '', showHidden: false }],
      columns: [{
        label: '字段',
        formItems: [
          { fieldKey: 'first', type: 'input' },
          { fieldKey: 'hidden', type: 'input', visible: ({ row }) => Boolean(row.showHidden) },
          { fieldKey: 'disabled', type: 'input', component: { props: { disabled: true } } },
          { fieldKey: 'readonly', type: 'input', component: { props: { readonly: true } } },
          { fieldKey: 'last', type: 'input' }
        ]
      }]
    })
    await wrapper.vm.$nextTick()
    const inputs = wrapper.findAll('input')
    ;(inputs.at(0).element as HTMLInputElement).focus()

    dispatchEnter(inputs.at(0).element)
    expect(document.activeElement).toBe(inputs.at(inputs.length - 1).element)

    await wrapper.setProps({
      tableData: [{ first: '', hidden: '', disabled: '', readonly: '', last: '', showHidden: true }]
    })
    await wrapper.vm.$nextTick()
    const visibleInputs = wrapper.findAll('input')
    ;(visibleInputs.at(0).element as HTMLInputElement).focus()
    dispatchEnter(visibleInputs.at(0).element)
    expect(document.activeElement).toBe(visibleInputs.at(1).element)
    wrapper.destroy()
  })

  it('keeps textarea, button, modifiers, and composition Enter untouched', async () => {
    const wrapper = mountFormTable({
      navigationOptions: {},
      tableData: [{ notes: '', action: '', next: '' }],
      columns: [{
        label: '字段',
        formItems: [
          {
            fieldKey: 'notes',
            type: 'input',
            component: { props: { type: 'textarea' } }
          },
          {
            fieldKey: 'action',
            type: 'slot',
            component: { slot: 'action' }
          },
          { fieldKey: 'next', type: 'input' }
        ]
      }],
      scopedSlots: {
        action: '<button type="button" class="action-button">执行</button>'
      }
    })
    await wrapper.vm.$nextTick()
    const textarea = wrapper.find('textarea').element
    const button = wrapper.find('.action-button').element
    const input = wrapper.find('input').element

    expect(dispatchEnter(textarea).defaultPrevented).toBe(false)
    expect(dispatchEnter(button).defaultPrevented).toBe(false)
    expect(dispatchEnter(input, { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(dispatchEnter(input, { metaKey: true }).defaultPrevented).toBe(false)
    expect(dispatchEnter(input, { isComposing: true }).defaultPrevented).toBe(false)
    wrapper.destroy()
  })

  it('uses the current sorted display order', async () => {
    const wrapper = mountFormTable({
      navigationOptions: {},
      tableData: [{ name: 'Beta' }, { name: 'Alpha' }],
      columns: [{
        label: '姓名',
        props: { prop: 'name', sortable: true },
        formItems: [{ fieldKey: 'name', type: 'input' }]
      }]
    })
    await wrapper.vm.$nextTick()
    const table = wrapper.findComponent({ name: 'ElTable' }).vm as any
    table.sort('name', 'ascending')
    await wrapper.vm.$nextTick()
    const inputs = wrapper.findAll('input')
    expect(inputs.wrappers.map(input => (input.element as HTMLInputElement).value)).toEqual(['Alpha', 'Beta'])

    ;(inputs.at(0).element as HTMLInputElement).focus()
    dispatchEnter(inputs.at(0).element)
    expect(document.activeElement).toBe(inputs.at(1).element)
    wrapper.destroy()
  })

  it('can be disabled reactively without unmounting fields', async () => {
    const rows: TableRow[] = [{ first: '', second: '' }]
    const columns = [{
      label: '字段',
      formItems: [
        { fieldKey: 'first', type: 'input' as const },
        { fieldKey: 'second', type: 'input' as const }
      ]
    }]
    const wrapper = mountFormTable({ navigationOptions: {}, tableData: rows, columns })
    await wrapper.vm.$nextTick()
    await wrapper.setProps({ navigationOptions: { enabled: false } })
    const inputs = wrapper.findAll('input')
    ;(inputs.at(0).element as HTMLInputElement).focus()

    expect(dispatchEnter(inputs.at(0).element).defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(inputs.at(0).element)
    wrapper.destroy()
  })
})
