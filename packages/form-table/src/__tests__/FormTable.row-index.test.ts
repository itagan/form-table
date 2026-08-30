import { describe, expect, it, vi } from 'vitest'
import type { TableRow } from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable source row indexes', () => {
  it('keeps source and display indexes distinct after Element Table local sorting', async () => {
    const wrapper = mountFormTable({
      tableData: [{ name: 'Beta' }, { name: 'Alpha' }],
      columns: [{
        label: '姓名',
        props: {
          prop: 'name',
          sortable: true,
          filters: [{ text: 'Alpha', value: 'Alpha' }],
          filterMethod: (value: string, row: TableRow) => row.name === value
        },
        formItems: [{
          fieldKey: 'name',
          type: 'slot',
          formItemProps: { rules: [{ required: true, message: '请输入姓名' }] },
          component: { slot: 'field-index' }
        }]
      }, {
        label: '下标',
        cellSlot: 'cell-index'
      }],
      scopedSlots: {
        'field-index': `<span
          class="field-index"
          :data-name="props.row.name"
          :data-index="props.index"
          :data-display-index="props.displayIndex"
          :data-prop="props.propPath"
        />`,
        'cell-index': `<span
          class="cell-index"
          :data-name="props.row.name"
          :data-index="props.index"
          :data-display-index="props.displayIndex"
        />`
      }
    })
    await wrapper.vm.$nextTick()

    const table = wrapper.findComponent({ name: 'ElTable' }).vm as any
    table.sort('name', 'ascending')
    await wrapper.vm.$nextTick()

    const fieldIndexes = wrapper.findAll('.field-index').wrappers.map(node => node.attributes())
    expect(fieldIndexes).toEqual([
      expect.objectContaining({
        'data-name': 'Alpha',
        'data-index': '1',
        'data-display-index': '0',
        'data-prop': 'tableData.1.name'
      }),
      expect.objectContaining({
        'data-name': 'Beta',
        'data-index': '0',
        'data-display-index': '1',
        'data-prop': 'tableData.0.name'
      })
    ])
    const cellIndexes = wrapper.findAll('.cell-index').wrappers.map(node => node.attributes())
    expect(cellIndexes).toEqual([
      expect.objectContaining({ 'data-name': 'Alpha', 'data-index': '1', 'data-display-index': '0' }),
      expect.objectContaining({ 'data-name': 'Beta', 'data-index': '0', 'data-display-index': '1' })
    ])

    table.store.commit('filterChange', {
      column: table.store.states.columns[0],
      values: ['Alpha'],
      silent: true
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.field-index')).toHaveLength(1)
    expect(wrapper.find('.field-index').attributes()).toEqual(expect.objectContaining({
      'data-name': 'Alpha',
      'data-index': '1',
      'data-display-index': '0',
      'data-prop': 'tableData.1.name'
    }))
    wrapper.destroy()
  })

  it('disables validation for a duplicate row reference that cannot be mapped safely', async () => {
    const duplicate = { name: 'Beta' }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountFormTable({
      tableData: [duplicate, { name: 'Alpha' }, duplicate],
      columns: [{
        label: '姓名',
        props: { prop: 'name', sortable: true },
        formItems: [{
          fieldKey: 'name',
          type: 'slot',
          formItemProps: { rules: [{ required: true }] },
          component: { slot: 'duplicate-index' }
        }]
      }],
      scopedSlots: {
        'duplicate-index': `<span
          class="duplicate-index"
          :data-name="props.row.name"
          :data-index="props.index"
          :data-prop="props.propPath"
        />`
      }
    })
    await wrapper.vm.$nextTick()

    const table = wrapper.findComponent({ name: 'ElTable' }).vm as any
    table.sort('name', 'ascending')
    await wrapper.vm.$nextTick()

    const duplicateFields = wrapper.findAll('.duplicate-index').wrappers
      .filter(node => node.attributes('data-name') === 'Beta')
    expect(duplicateFields).toHaveLength(2)
    expect(duplicateFields.map(node => node.attributes('data-prop'))).toEqual([
      undefined,
      'tableData.2.name'
    ])
    expect(warn).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('same row object'))

    wrapper.destroy()
    warn.mockRestore()
  })

})
