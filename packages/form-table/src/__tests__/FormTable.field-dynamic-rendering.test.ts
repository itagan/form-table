import { describe, expect, it, vi } from 'vitest'
import type {
  ColumnConfig,
  FormItemConfig,
  FormTableColumnContext,
  FormTableFieldRenderContext,
  FormTableRowContext
} from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable dynamic field rendering', () => {
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
