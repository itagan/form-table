import { describe, expect, it } from 'vitest'
import FormTableColumn from '../FormTableColumn.vue'
import type {
  ColumnConfig,
  FormItemConfig
} from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable dynamic column identity', () => {
  it('keeps column content aligned when configs are reordered', async () => {
    let nextInstanceId = 0
    const StatefulField = {
      props: ['marker'],
      data() {
        return { instanceId: ++nextInstanceId }
      },
      render(this: any, h: any) {
        return h('span', { class: 'dynamic-structure-field' }, `${this.marker}:${this.instanceId}`)
      }
    }
    const createItem = (key: string, marker: string): FormItemConfig => ({
      key,
      fieldKey: marker,
      type: 'component',
      component: { is: StatefulField, props: { marker } }
    })
    const firstColumn: ColumnConfig = {
      key: 'first-column',
      label: '第一列',
      formItems: [createItem('column-a', 'column-a')]
    }
    const secondColumn: ColumnConfig = {
      key: 'second-column',
      label: '第二列',
      formItems: [createItem('column-b', 'column-b')]
    }
    const columnWrapper = mountFormTable({
      tableData: [{ 'column-a': '', 'column-b': '' }],
      columns: [firstColumn, secondColumn]
    })
    await columnWrapper.vm.$nextTick()
    expect(columnWrapper.findAll('.dynamic-structure-field').wrappers.map(node => node.text()))
      .toEqual(['column-a:1', 'column-b:2'])
    await columnWrapper.setProps({ columns: [secondColumn, firstColumn] })
    await columnWrapper.vm.$nextTick()
    const reorderedColumns = columnWrapper.findAll('.dynamic-structure-field').wrappers.map(node => node.text())
    expect(reorderedColumns.map(text => text.split(':')[0])).toEqual(['column-b', 'column-a'])
    expect(new Set(reorderedColumns.map(text => text.split(':')[1])).size).toBe(2)
    columnWrapper.destroy()
  })

  it('preserves uniquely keyed columns unless their relative order changes', async () => {
    let nextInstanceId = 0
    const StatefulColumnField = {
      props: ['marker'],
      data() {
        return { instanceId: ++nextInstanceId }
      },
      render(this: any, h: any) {
        return h('span', { class: 'stable-column-field' }, `${this.marker}:${this.instanceId}`)
      }
    }
    const createColumn = (key: string, marker: string): ColumnConfig => ({
      key,
      label: marker,
      formItems: [{
        key: `${key}-field`,
        fieldKey: marker,
        type: 'component',
        component: { is: StatefulColumnField, props: { marker } }
      }]
    })
    const first = createColumn('column-a', 'a')
    const second = createColumn('column-b', 'b')
    const third = createColumn('column-c', 'c')
    const wrapper = mountFormTable({
      tableData: [{ a: '', b: '', c: '' }],
      columns: [first, second, third]
    })
    const readFields = () => wrapper.findAll('.stable-column-field').wrappers.map(node => node.text())
    const readColumnInstances = () => Object.fromEntries(
      wrapper.findAllComponents(FormTableColumn as any).wrappers.map(component => [
        (component.props('column') as ColumnConfig).key,
        (component.vm as any)._uid
      ])
    )
    await wrapper.vm.$nextTick()
    expect(readFields()).toEqual(['a:1', 'b:2', 'c:3'])
    const initialColumnInstances = readColumnInstances()

    // 删除中间列时，共同列的相对顺序不变，a/c 列包装实例应保留。
    await wrapper.setProps({ columns: [first, third] })
    await wrapper.vm.$nextTick()
    expect(readFields().map(text => text.split(':')[0])).toEqual(['a', 'c'])
    expect(readColumnInstances()).toEqual({
      'column-a': initialColumnInstances['column-a'],
      'column-c': initialColumnInstances['column-c']
    })

    // 插回中间列时只创建 b 列包装，a/c 列包装继续保留。
    await wrapper.setProps({ columns: [first, second, third] })
    await wrapper.vm.$nextTick()
    expect(readFields().map(text => text.split(':')[0])).toEqual(['a', 'b', 'c'])
    const reinsertedColumnInstances = readColumnInstances()
    expect(reinsertedColumnInstances['column-a']).toBe(initialColumnInstances['column-a'])
    expect(reinsertedColumnInstances['column-c']).toBe(initialColumnInstances['column-c'])
    expect(reinsertedColumnInstances['column-b']).not.toBe(initialColumnInstances['column-b'])

    // 同 key、同顺序的新配置对象不会重建列包装实例。
    await wrapper.setProps({
      columns: [
        createColumn('column-a', 'a'),
        createColumn('column-b', 'b'),
        createColumn('column-c', 'c')
      ]
    })
    await wrapper.vm.$nextTick()
    expect(readFields().map(text => text.split(':')[0])).toEqual(['a', 'b', 'c'])
    expect(readColumnInstances()).toEqual(reinsertedColumnInstances)

    // 已有列相对顺序改变时整体换代，让 Element UI 按新顺序重新注册。
    await wrapper.setProps({ columns: [third, first, second] })
    await wrapper.vm.$nextTick()
    const reordered = readFields()
    expect(reordered.map(text => text.split(':')[0])).toEqual(['c', 'a', 'b'])
    const reorderedColumnInstances = readColumnInstances()
    expect(Object.keys(reorderedColumnInstances)).toEqual(expect.arrayContaining([
      'column-a',
      'column-b',
      'column-c'
    ]))
    expect(Object.entries(reorderedColumnInstances).every(([key, uid]) => (
      uid !== reinsertedColumnInstances[key]
    ))).toBe(true)
    wrapper.destroy()
  })

  it('preserves unaffected keyed column wrappers across dynamic visibility changes', async () => {
    const visibility = { showSecond: true }
    const createColumn = (key: string, visible?: () => boolean): ColumnConfig => ({
      key,
      label: key,
      visible,
      formItems: [{ fieldKey: key, type: 'text' }]
    })
    const first = createColumn('first')
    const second = createColumn('second', () => visibility.showSecond)
    const third = createColumn('third')
    const wrapper = mountFormTable({
      tableData: [{ first: 'A', second: 'B', third: 'C' }],
      columns: [first, second, third]
    })
    const readColumnInstances = () => Object.fromEntries(
      wrapper.findAllComponents(FormTableColumn as any).wrappers.map(component => [
        (component.props('column') as ColumnConfig).key,
        (component.vm as any)._uid
      ])
    )
    await wrapper.vm.$nextTick()
    const initialInstances = readColumnInstances()

    visibility.showSecond = false
    await wrapper.setProps({ columns: [...wrapper.props('columns')] })
    await wrapper.vm.$nextTick()
    expect(readColumnInstances()).toEqual({
      first: initialInstances.first,
      third: initialInstances.third
    })

    visibility.showSecond = true
    await wrapper.setProps({ columns: [...wrapper.props('columns')] })
    await wrapper.vm.$nextTick()
    const restoredInstances = readColumnInstances()
    expect(restoredInstances.first).toBe(initialInstances.first)
    expect(restoredInstances.third).toBe(initialInstances.third)
    expect(restoredInstances.second).not.toBe(initialInstances.second)
    wrapper.destroy()
  })

})
