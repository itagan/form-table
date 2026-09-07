import { h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { FormTableExpose } from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable field locator API', () => {
  it('tries visible editable candidates after hidden and unavailable controls', async () => {
    const row = { name: '' }
    const wrapper = mountFormTable({
      tableData: [row],
      columns: [{ label: '编辑', formItems: [{ fieldKey: 'name', type: 'slot', component: { slot: 'editor' } }] }],
      scopedSlots: {
        editor: () => h('div', [
          h('input', { attrs: { type: 'hidden' } }),
          h('div', { style: { display: 'none' } }, [h('input')]),
          h('input', { attrs: { disabled: true, tabindex: 0 } }),
          h('input', { attrs: { readonly: true, tabindex: 0 } }),
          h('input', { class: 'actual-editor' })
        ])
      }
    })
    await wrapper.vm.$nextTick()
    const expose = wrapper.vm as unknown as FormTableExpose
    expect(await expose.focusField(row, 'name')).toBe(true)
    expect(document.activeElement).toBe(wrapper.find('.actual-editor').element)
    wrapper.destroy()
  })

  it('aggregates fixed-column FormItem callbacks and focuses a visible copy', async () => {
    const row = { name: '' }
    const completions: Array<(error?: Error) => void> = []
    const wrapper = mountFormTable({
      tableData: [row],
      columns: [{
        label: '固定字段', props: { fixed: 'left' },
        formItems: [{
          fieldKey: 'name', type: 'input',
          formItemProps: { rules: [{ validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => completions.push(callback) }] }
        }]
      }]
    })
    await wrapper.vm.$nextTick()
    const expose = wrapper.vm as unknown as FormTableExpose
    const result = expose.validateField(row, 'name')
    expect(completions.length).toBeGreaterThan(1)
    completions[0]()
    completions.slice(1).forEach(done => done(new Error('副本校验失败')))
    expect(await result).toBe(false)
    // jsdom 不加载 Element 的样式；显式模拟主表固定单元格的隐藏样式。
    wrapper.findAll('td.is-hidden').wrappers.forEach(cell => {
      (cell.element as HTMLElement).style.visibility = 'hidden'
    })
    expect(await expose.focusField(row, 'name')).toBe(true)
    expect(document.activeElement).toBe(wrapper.find('.el-table__fixed input').element)
    wrapper.destroy()
  })

  it('waits for every matching FormItem including delayed failures', async () => {
    const row = { name: '' }
    let finish: ((error?: Error) => void) | undefined
    const wrapper = mountFormTable({
      tableData: [row],
      columns: [{
        label: '重复字段',
        formItems: [
          { key: 'first', fieldKey: 'name', type: 'input' },
          {
            key: 'second', fieldKey: 'name', type: 'input',
            formItemProps: { rules: [{ validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => { finish = callback } }] }
          }
        ]
      }]
    })
    await wrapper.vm.$nextTick()
    const expose = wrapper.vm as unknown as FormTableExpose
    let settled = false
    const result = expose.validateField(row, 'name').then(valid => { settled = true; return valid })
    await Promise.resolve()
    expect(settled).toBe(false)
    expect(finish).toBeTypeOf('function')
    finish!(new Error('延迟失败'))
    expect(await result).toBe(false)
    wrapper.destroy()
  })

  it('locates, validates, clears, and focuses a field by stable row identity', async () => {
    const originalRow = { id: 'row-1', name: '' }
    const wrapper = mountFormTable({
      tableData: [originalRow, { id: 'row-2', name: 'Grace' }],
      rowKey: 'id',
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          formItemProps: { rules: [{ required: true, message: '请输入姓名' }] }
        }]
      }]
    })
    await wrapper.vm.$nextTick()
    const expose = wrapper.vm as unknown as FormTableExpose

    await wrapper.setProps({
      tableData: [{ id: 'row-2', name: 'Grace' }, { id: 'row-1', name: '' }]
    })
    await wrapper.vm.$nextTick()

    expect(expose.getFieldProp(originalRow, 'name')).toBe('tableData.1.name')
    expect(await expose.validateField(originalRow, 'name')).toBe(false)
    expect(wrapper.findAll('.el-form-item.is-error')).toHaveLength(1)
    expose.clearFieldValidate(originalRow, 'name')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.el-form-item.is-error')).toHaveLength(0)
    expect(await expose.focusField(originalRow, 'name')).toBe(true)
    expect(document.activeElement).toBe(wrapper.findAll('input').at(1).element)
    wrapper.destroy()
  })

  it('returns safe field target fallbacks and deduplicates development warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const row = { id: 'row-1', name: 'Ada', hidden: true }
    const wrapper = mountFormTable({
      tableData: [row],
      rowKey: 'id',
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          visible: ({ row }) => !row.hidden
        }]
      }]
    })
    await wrapper.vm.$nextTick()
    const expose = wrapper.vm as unknown as FormTableExpose

    expect(expose.getFieldProp(row, 'name')).toBeUndefined()
    expect(await expose.focusField(row, 'name')).toBe(false)
    expect(await expose.validateField({ id: 'missing' }, 'name')).toBe(false)
    expect(await expose.validateField({ id: 'missing' }, 'name')).toBe(false)
    expect(warn.mock.calls.filter(call => String(call[0]).includes('not currently mounted'))).toHaveLength(1)
    expect(warn.mock.calls.filter(call => String(call[0]).includes('identity is missing'))).toHaveLength(1)

    wrapper.destroy()
    warn.mockRestore()
  })

  it('scrolls to and focuses the first invalid field', async () => {
    const wrapper = mountFormTable({
      tableData: [{ first: '', second: '' }],
      columns: [{
        label: '姓名',
        formItems: [
          {
            fieldKey: 'first',
            type: 'input',
            formItemProps: { rules: [{ required: true, message: '请输入名' }] }
          },
          {
            fieldKey: 'second',
            type: 'input',
            formItemProps: { rules: [{ required: true, message: '请输入姓' }] }
          }
        ]
      }]
    })
    await wrapper.vm.$nextTick()
    const expose = wrapper.vm as unknown as FormTableExpose

    expect(await expose.scrollToFirstError()).toBe(false)
    expect(await expose.validate()).toBe(false)
    expect(await expose.scrollToFirstError()).toBe(true)
    expect(document.activeElement).toBe(wrapper.findAll('input').at(0).element)
    wrapper.destroy()
  })

})
