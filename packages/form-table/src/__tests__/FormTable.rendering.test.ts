import { describe, expect, it, vi } from 'vitest'
import type { FormTableRowContext } from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable table and column rendering', () => {
  it('uses top-level rowKey for Element Table and filters the legacy passthrough key', async () => {
    const wrapper = mountFormTable({ rowKey: 'id', tableProps: { rowKey: 'legacy-id' } })
    await wrapper.vm.$nextTick()

    const table = wrapper.findComponent({ name: 'ElTable' })
    expect((table.vm as any).rowKey).toBe('id')
    wrapper.destroy()
  })

  it('renders plain Element selection and index columns from props', async () => {
    const wrapper = mountFormTable({
      columns: [
        { props: { type: 'selection', width: 48 } },
        { label: '序号', visible: ({ tableData }) => tableData.length > 0, props: { type: 'index', width: 64 } },
        { props: { label: '姓名', prop: 'name', width: 120 } }
      ]
    })
    await wrapper.vm.$nextTick()

    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    expect(columns).toHaveLength(3)
    expect((columns.at(0).vm as any).type).toBe('selection')
    expect((columns.at(1).vm as any).type).toBe('index')
    expect((columns.at(1).vm as any).label).toBe('序号')
    expect((columns.at(2).vm as any).label).toBe('姓名')
    expect((columns.at(2).vm as any).prop).toBe('name')
    expect(wrapper.find('.el-form-item').exists()).toBe(false)
    wrapper.destroy()
  })

  it('lets column props override the default label and preserves an explicit empty label', async () => {
    const overridingProps = Object.freeze({ label: '员工姓名', minWidth: 160 })
    const wrapper = mountFormTable({
      columns: [
        { label: '姓名', props: overridingProps, formItems: [] },
        { label: '操作', props: { label: '' }, formItems: [] }
      ]
    })
    await wrapper.vm.$nextTick()

    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    expect((columns.at(0).vm as any).label).toBe('员工姓名')
    expect((columns.at(0).vm as any).minWidth).toBe(160)
    expect((columns.at(1).vm as any).label).toBe('')
    expect(overridingProps).toEqual({ label: '员工姓名', minWidth: 160 })
    wrapper.destroy()
  })

  it('renders one wrapping Flex row per field cell by default and applies rowProps', async () => {
    const rowProps = vi.fn((_context: FormTableRowContext) => ({
      gutter: 12,
      justify: 'space-between',
      align: 'middle',
      class: 'custom-field-layout',
      style: { minHeight: '40px' }
    }))
    const wrapper = mountFormTable({
      tableData: [{ first: '', second: '', third: '', fourth: '', defaultSpan: '' }],
      columns: [{
        label: '分组字段',
        rowProps,
        formItems: [
          { fieldKey: 'first', type: 'input', colProps: { span: 8 } },
          { fieldKey: 'second', type: 'input', colProps: { span: 16 } },
          { fieldKey: 'third', type: 'input', colProps: { span: 12 } },
          { fieldKey: 'fourth', type: 'input', colProps: { span: 12 } },
          { fieldKey: 'defaultSpan', type: 'input', colProps: {} }
        ]
      }]
    })
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAllComponents({ name: 'ElRow' })
    expect(rows).toHaveLength(1)
    expect(rowProps).toHaveBeenCalledTimes(1)
    expect((rows.at(0).vm as any).type).toBe('flex')
    expect((rows.at(0).vm as any).gutter).toBe(12)
    expect((rows.at(0).vm as any).justify).toBe('space-between')
    expect((rows.at(0).vm as any).align).toBe('middle')
    expect(rows.at(0).classes()).toEqual(expect.arrayContaining([
      'form-table-field-layout',
      'custom-field-layout',
      'el-row--flex'
    ]))
    expect(rows.at(0).attributes('style')).toContain('min-height: 40px')
    expect(rows.at(0).findAllComponents({ name: 'ElCol' }).wrappers.map(col => (col.vm as any).span))
      .toEqual([8, 16, 12, 12, 24])
    wrapper.destroy()
  })

  it('lets rowProps override the default Flex row without mutating the source object', async () => {
    const rowProps = Object.freeze({ type: undefined, gutter: 6 })
    const wrapper = mountFormTable({
      tableData: [{ name: '' }],
      columns: [{
        label: '姓名',
        rowProps,
        formItems: [{ fieldKey: 'name', type: 'input' }]
      }]
    })
    await wrapper.vm.$nextTick()

    const row = wrapper.findComponent({ name: 'ElRow' })
    expect((row.vm as any).type).toBeUndefined()
    expect((row.vm as any).gutter).toBe(6)
    expect(row.classes()).not.toContain('el-row--flex')
    expect(rowProps).toEqual({ type: undefined, gutter: 6 })
    wrapper.destroy()
  })

})
