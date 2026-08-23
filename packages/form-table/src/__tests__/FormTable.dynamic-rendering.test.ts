import { describe, expect, it, vi } from 'vitest'
import FormTableColumn from '../FormTableColumn.vue'
import type {
  ColumnConfig,
  FormItemConfig,
  FormTableColumnContext,
  FormTableFieldRenderContext,
  FormTableRowContext
} from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable dynamic rendering and identity', () => {
  it('keeps radio and checkbox option children through the functional renderer', async () => {
    const options = [
      { label: '选项 A', value: 'a' },
      { label: '选项 B', value: 'b' }
    ]
    const wrapper = mountFormTable({
      tableData: [{ choice: 'a', checked: ['b'] }],
      columns: [{
        label: '选项字段',
        formItems: [{
            fieldKey: 'choice',
            type: 'radio',
            component: { options }
          },
          {
            fieldKey: 'checked',
            type: 'checkbox',
            component: { options }
          }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.el-radio')).toHaveLength(2)
    expect(wrapper.findAll('.el-checkbox')).toHaveLength(2)
    expect(wrapper.text()).toContain('选项 A')
    expect(wrapper.text()).toContain('选项 B')
    wrapper.destroy()
  })

  it('keeps keyed field instances stable when items are reordered', async () => {
    let nextInstanceId = 0
    const StatefulField = {
      props: ['value', 'marker'],
      data() {
        return { instanceId: ++nextInstanceId }
      },
      render(this: any, h: any) {
        return h('span', { class: 'stateful-field' }, `${this.marker}:${this.instanceId}`)
      }
    }
    const createItem = (key: string, marker: string) => ({
      key,
      fieldKey: 'name',
      type: 'component' as const,
      component: { is: StatefulField, props: { marker } }
    })
    const first = createItem('first-name', 'A')
    const second = createItem('second-name', 'B')
    const createColumns = (formItems: FormItemConfig[]): ColumnConfig[] => [{
      label: '稳定字段身份',
      formItems
    }]
    const wrapper = mountFormTable({ columns: createColumns([first, second]) })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.stateful-field').wrappers.map(node => node.text())).toEqual(['A:1', 'B:2'])
    await wrapper.setProps({ columns: createColumns([second, first]) })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.stateful-field').wrappers.map(node => node.text())).toEqual(['B:2', 'A:1'])
    wrapper.destroy()
  })

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

  it('reacts to dynamic column and item visibility changes', async () => {
    const state = { showColumn: true, showItem: true }
    const createColumns = (): ColumnConfig[] => [{
      key: 'dynamic-column',
      label: '动态列',
      visible: () => state.showColumn,
      formItems: [{
        key: 'dynamic-item',
        fieldKey: 'name',
        type: 'input',
        visible: () => state.showItem
      }]
    }]
    const wrapper = mountFormTable({ columns: createColumns() })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('input').exists()).toBe(true)

    state.showItem = false
    await wrapper.setProps({ columns: createColumns() })
    expect(wrapper.find('input').exists()).toBe(false)
    state.showItem = true
    state.showColumn = false
    await wrapper.setProps({ columns: createColumns() })
    expect(wrapper.text()).not.toContain('动态列')
    wrapper.destroy()
  })

  it('resolves dynamic visibility and options from row context', async () => {
    const columnVisible = vi.fn((_context: FormTableColumnContext) => true)
    const rowProps = vi.fn((_context: FormTableRowContext) => ({ gutter: 8 }))
    const fieldVisible = vi.fn(({ row }: FormTableFieldRenderContext) => row.province === 'zhejiang')
    const fieldOptions = vi.fn(({ row }: FormTableFieldRenderContext) => row.province === 'zhejiang'
      ? [{ label: '杭州', value: 'hangzhou' }]
      : [])
    const columns: ColumnConfig[] = [{
      label: '地区',
      visible: columnVisible,
      rowProps,
      formItems: [
          {
            fieldKey: 'province',
            type: 'select',
            colProps: { span: 12 },
            component: {
              options: [{ label: '浙江', value: 'zhejiang' }]
            }
          },
          {
            fieldKey: 'city',
            type: 'select',
            visible: fieldVisible,
            colProps: { span: 12 },
            component: {
              options: fieldOptions
            }
          }
      ]
    }]
    const wrapper = mountFormTable({
      tableData: [{ province: 'zhejiang', city: 'hangzhou' }],
      columns
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.el-select')).toHaveLength(2)
    expect(Object.keys(columnVisible.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'tableData'
    ])
    expect(Object.keys(rowProps.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'displayIndex',
      'index',
      'row',
      'tableData'
    ])
    expect(Object.keys(fieldVisible.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'displayIndex',
      'fieldKey',
      'index',
      'itemConfig',
      'row',
      'tableData',
      'value'
    ])
    expect(Object.keys(fieldOptions.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'displayIndex',
      'fieldKey',
      'index',
      'itemConfig',
      'row',
      'tableData',
      'value'
    ])
    wrapper.destroy()
  })
})
