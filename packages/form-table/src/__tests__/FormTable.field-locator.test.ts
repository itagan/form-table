import { describe, expect, it, vi } from 'vitest'
import type { FormTableExpose } from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable field locator API', () => {
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
