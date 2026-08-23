import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FormTable from '../index.vue'
import type {
  ColumnConfig,
  FormTableFieldRenderContext,
  FormTableRowContext,
  TableRow
} from '../types.public'
import { inputColumns, localVue, mountFormTable } from './test-utils'

describe('FormTable data updates', () => {
  it('supports Vue 2 v-model through the tableData update contract', async () => {
    const wrapper = mount({
      components: { FormTable },
      data: () => ({
        tableData: [{ name: 'Alice' }],
        columns: inputColumns
      }),
      template: '<FormTable v-model="tableData" :columns="columns" />'
    }, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    await wrapper.find('input').setValue('Bob')

    expect((wrapper.vm as any).tableData).toEqual([{ name: 'Bob' }])
    const formTable = wrapper.findComponent(FormTable as any)
    expect(formTable.emitted('update:tableData')?.[0]?.[0]).toEqual([{ name: 'Bob' }])
    expect(formTable.emitted('input')).toBeUndefined()
    wrapper.destroy()
  })

  it('keeps tableData.sync as a compatible binding syntax', async () => {
    const wrapper = mount({
      components: { FormTable },
      data: () => ({
        tableData: [{ name: 'Alice' }],
        columns: inputColumns
      }),
      template: '<FormTable :table-data.sync="tableData" :columns="columns" />'
    }, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    await wrapper.find('input').setValue('Bob')

    expect((wrapper.vm as any).tableData).toEqual([{ name: 'Bob' }])
    wrapper.destroy()
  })

  it('renders a type field and emits immutable field updates', async () => {
    const original = [{ name: 'Alice' }]
    const wrapper = mountFormTable({ tableData: original })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('姓名')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Alice')
    await wrapper.find('input').setValue('Bob')

    expect(original).toEqual([{ name: 'Alice' }])
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ name: 'Bob' }])
    expect(wrapper.emitted('field-change')?.[0]?.[0]).toEqual({
      row: { name: 'Bob' },
      index: 0,
      fieldKey: 'name',
      value: 'Bob',
      previousValue: 'Alice'
    })
    wrapper.destroy()
  })

  it('keeps unrelated row references when editing a large data set', async () => {
    const rowCount = 300
    const targetIndex = 150
    const original = Array.from({ length: rowCount }, (_, index) => ({
      id: index + 1,
      name: `User ${index + 1}`
    }))
    const wrapper = mountFormTable({ tableData: original })
    await wrapper.vm.$nextTick()

    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBe(rowCount)
    await inputs.at(targetIndex).setValue('Updated User')

    const nextTableData = wrapper.emitted('update:tableData')?.[0]?.[0] as TableRow[]
    expect(nextTableData).toHaveLength(rowCount)
    expect(nextTableData[targetIndex]).toEqual({ id: targetIndex + 1, name: 'Updated User' })
    expect(nextTableData[targetIndex]).not.toBe(original[targetIndex])
    expect(nextTableData[targetIndex - 1]).toBe(original[targetIndex - 1])
    expect(nextTableData[targetIndex + 1]).toBe(original[targetIndex + 1])
    expect(original[targetIndex].name).toBe(`User ${targetIndex + 1}`)
    wrapper.destroy()
  })

  it('only invalidates dynamic callbacks that read changed reactive data', async () => {
    const rowCount = 300
    const targetIndex = 150
    const rowPropsResolver = vi.fn(({ row }: FormTableRowContext) => ({
      gutter: row.id === 1 ? 0 : 2
    }))
    const componentPropsResolver = vi.fn(({ row, tableData }: FormTableFieldRenderContext) => ({
      placeholder: `${row.name}-${tableData[0]?.name}`
    }))
    const wrapper = mount({
      components: { FormTable },
      data: () => ({
        tableData: Array.from({ length: rowCount }, (_, index) => ({
          id: index + 1,
          name: `User ${index + 1}`
        })),
        columns: [{
          key: 'name-column',
          label: '姓名',
          rowProps: rowPropsResolver,
          formItems: [{
            key: 'name-item',
            fieldKey: 'name',
            type: 'input',
            component: { props: componentPropsResolver }
          }]
        }] as ColumnConfig[]
      }),
      template: '<FormTable v-model="tableData" :columns="columns" row-key="id" />'
    }, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(rowPropsResolver).toHaveBeenCalledTimes(rowCount)
    expect(componentPropsResolver).toHaveBeenCalledTimes(rowCount)

    await wrapper.findAll('input').at(targetIndex).setValue('Updated User')
    await wrapper.vm.$nextTick()

    // 只读取当前 row 的回调仅重新计算目标行。
    expect(rowPropsResolver).toHaveBeenCalledTimes(rowCount + 1)
    // 显式读取 tableData 的回调会为全部行重新计算。
    expect(componentPropsResolver).toHaveBeenCalledTimes(rowCount * 2)
    wrapper.destroy()
  })

  it('keeps nested field paths working', async () => {
    const wrapper = mountFormTable({
      tableData: [{ profile: { city: '杭州' } }],
      columns: [{
        label: '城市',
        formItems: [{ fieldKey: 'profile.city', type: 'input' }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('input').setValue('宁波')

    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { profile: { city: '宁波' } }
    ])
    wrapper.destroy()
  })

  it('applies updateRow patches immutably and emits one change per field', async () => {
    const original = [{ name: 'Alice', profile: { city: '杭州' } }]
    const wrapper = mountFormTable({
      tableData: original,
      columns: [{
        label: '批量更新',
        formItems: [{
          fieldKey: 'name',
          type: 'slot',
          component: { slot: 'batch-update' }
        }]
      }],
      scopedSlots: {
        'batch-update': `
          <button
            type="button"
            class="batch-update"
            @click="props.updateRow({ name: 'Bob', 'profile.city': '宁波' })"
          >更新</button>
        `
      }
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('.batch-update').trigger('click')

    expect(original).toEqual([{ name: 'Alice', profile: { city: '杭州' } }])
    expect(wrapper.emitted('update:tableData')).toHaveLength(1)
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { name: 'Bob', profile: { city: '宁波' } }
    ])
    expect(wrapper.emitted('field-change')?.map(([payload]) => payload)).toEqual([
      {
        row: { name: 'Bob', profile: { city: '宁波' } },
        index: 0,
        fieldKey: 'name',
        value: 'Bob',
        previousValue: 'Alice'
      },
      {
        row: { name: 'Bob', profile: { city: '宁波' } },
        index: 0,
        fieldKey: 'profile.city',
        value: '宁波',
        previousValue: '杭州'
      }
    ])
    wrapper.destroy()
  })

  it('composes consecutive field helpers without losing earlier updates', async () => {
    const original = [{ name: 'Alice', touched: false }]
    const wrapper = mountFormTable({
      tableData: original,
      columns: [{
        label: '连续更新',
        formItems: [{
          fieldKey: 'name',
          type: 'slot',
          component: { slot: 'compose-update' }
        }]
      }],
      scopedSlots: {
        'compose-update': `
          <button
            type="button"
            class="compose-update"
            @click="props.setValue('Bob'); props.updateRow({ touched: true })"
          >更新</button>
        `
      }
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('.compose-update').trigger('click')

    const updates = wrapper.emitted('update:tableData') || []
    expect(updates).toHaveLength(2)
    expect(updates[1]?.[0]).toEqual([{ name: 'Bob', touched: true }])
    expect(original).toEqual([{ name: 'Alice', touched: false }])
    wrapper.destroy()
  })
})
