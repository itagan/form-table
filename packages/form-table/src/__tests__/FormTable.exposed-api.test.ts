import { describe, expect, it, vi } from 'vitest'
import type { FormTableExpose } from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable exposed native API', () => {
  it('forwards native table events once with their original arguments and exposes native refs', async () => {
    const rowClick = vi.fn()
    const sortChange = vi.fn()
    const filterChange = vi.fn()
    const headerClick = vi.fn()
    const cellClick = vi.fn()
    const selectionChange = vi.fn()
    const fieldChange = vi.fn()
    const formValidate = vi.fn()
    const updateTableData = vi.fn()
    const wrapper = mountFormTable({
      listeners: {
        'row-click': rowClick,
        'sort-change': sortChange,
        'filter-change': filterChange,
        'header-click': headerClick,
        'cell-click': cellClick,
        'selection-change': selectionChange,
        'field-change': fieldChange,
        'form-validate': formValidate,
        'update:tableData': updateTableData
      }
    })
    await wrapper.vm.$nextTick()
    const table = wrapper.findComponent({ name: 'ElTable' }).vm as any
    const form = wrapper.findComponent({ name: 'ElForm' }).vm as any
    expect(Object.keys(table.$listeners)).toContain('row-click')
    expect(Object.keys(table.$listeners)).not.toContain('field-change')
    expect(Object.keys(table.$listeners)).not.toContain('form-validate')
    expect(Object.keys(table.$listeners)).not.toContain('update:tableData')
    const row = { name: 'Alice' }
    const column = { id: 'el-table_1_column_1', property: 'name' }
    const cell = document.createElement('td')
    const event = new MouseEvent('click')
    const sortPayload = { column, prop: 'name', order: 'ascending' }
    const filterPayload = { status: ['enabled'] }
    const selection = [row]

    table.$emit('row-click', row)
    table.$emit('sort-change', sortPayload)
    table.$emit('filter-change', filterPayload)
    table.$emit('header-click', column, event)
    table.$emit('cell-click', row, column, cell, event)
    table.$emit('selection-change', selection)
    form.$emit('validate', 'tableData.0.name', false, '请输入姓名')

    expect(rowClick).toHaveBeenCalledOnce()
    expect(rowClick).toHaveBeenCalledWith(row)
    expect(sortChange).toHaveBeenCalledOnce()
    expect(sortChange).toHaveBeenCalledWith(sortPayload)
    expect(filterChange).toHaveBeenCalledOnce()
    expect(filterChange).toHaveBeenCalledWith(filterPayload)
    expect(headerClick).toHaveBeenCalledOnce()
    expect(headerClick).toHaveBeenCalledWith(column, event)
    expect(cellClick).toHaveBeenCalledOnce()
    expect(cellClick).toHaveBeenCalledWith(row, column, cell, event)
    expect(selectionChange).toHaveBeenCalledOnce()
    expect(selectionChange).toHaveBeenCalledWith(selection)
    expect(formValidate).toHaveBeenCalledOnce()
    expect(formValidate).toHaveBeenCalledWith('tableData.0.name', false, '请输入姓名')

    const expose = wrapper.vm as unknown as FormTableExpose
    expect(expose.getFormRef()).toBeTruthy()
    expect(expose.getTableRef()).toBeTruthy()
    expect((expose as any).resetFields).toBeUndefined()
    expose.clearValidate()
    wrapper.destroy()
  })

})
