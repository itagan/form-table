import { describe, expect, it, vi } from 'vitest'
import type {
  FormTableColumnContext,
  FormTableFieldRenderContext
} from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable header and hint attributes', () => {
  it('applies headerHint and other properties to the default header text node', async () => {
    const headerProps = vi.fn(({ tableData, columnConfig }: FormTableColumnContext) => ({
      class: `records-${tableData.length}`,
      'aria-label': `${columnConfig.label}说明`
    }))
    const headerHint = vi.fn(({ tableData, columnConfig }: FormTableColumnContext) => (
      `${columnConfig.label}：${tableData.length} 条`
    ))
    const wrapper = mountFormTable({
      hintOptions: { targets: 'all' },
      tableData: [{ name: 'Alice' }, { name: 'Bob' }],
      columns: [{
        label: '姓名',
        headerProps,
        headerHint,
        formItems: [{ fieldKey: 'name', type: 'input' }]
      }]
    })
    await wrapper.vm.$nextTick()

    const header = wrapper.find('.form-table-column-header')
    expect(header.attributes('title')).toBe('姓名：2 条')
    expect(header.attributes('aria-label')).toBe('姓名说明')
    expect(header.classes()).toContain('records-2')
    expect(headerProps).toHaveBeenCalledTimes(1)
    expect(headerHint).toHaveBeenCalledTimes(1)
    expect(Object.keys(headerProps.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'tableData'
    ])
    wrapper.destroy()
  })

  it('leaves renderHeader fully controlled by Element UI', async () => {
    const wrapper = mountFormTable({
      columns: [{
        label: '姓名',
        headerHint: '不应自动应用',
        headerProps: { title: '也不应自动应用' },
        props: {
          renderHeader: (h: any) => h('strong', { class: 'native-render-header' }, ['自定义表头'])
        },
        formItems: [{ fieldKey: 'name', type: 'input' }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.native-render-header').text()).toBe('自定义表头')
    expect(wrapper.find('.form-table-column-header').exists()).toBe(false)
    expect(wrapper.find('.native-render-header').attributes('title')).toBeUndefined()
    wrapper.destroy()
  })

  it('applies dynamic field hints to el-form-item without changing component attrs', async () => {
    const hint = vi.fn(({ value }: FormTableFieldRenderContext) => (
      value ? `完整内容：${value}` : undefined
    ))
    const wrapper = mountFormTable({
      tableData: [{ name: 'Alice' }],
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          hint
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const formItem = wrapper.find('.el-form-item')
    const nativeInput = wrapper.find('.el-input__inner')
    expect(formItem.attributes('title')).toBe('完整内容：Alice')
    expect(nativeInput.attributes('title')).toBeUndefined()
    expect(hint).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ tableData: [{ name: '' }] })
    expect(formItem.attributes('title')).toBeUndefined()
    expect(hint).toHaveBeenCalledTimes(2)
    wrapper.destroy()
  })

  it('preserves title passthrough at header, form-item, and component layers', async () => {
    const wrapper = mountFormTable({
      tableData: [{ name: 'Alice' }],
      columns: [{
        label: '姓名',
        headerProps: { title: '底层表头提示' },
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          formItemProps: { title: '底层字段提示' },
          component: { props: { title: '底层组件提示' } }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.form-table-column-header').attributes('title')).toBe('底层表头提示')
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('底层字段提示')
    expect(wrapper.find('.el-input__inner').attributes('title')).toBe('底层组件提示')
    wrapper.destroy()
  })

})
