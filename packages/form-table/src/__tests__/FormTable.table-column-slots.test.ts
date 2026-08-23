import { describe, expect, it, vi } from 'vitest'
import type { FormTableColumnContext } from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable table and column slot rendering', () => {
  it('forwards the native empty slot only when it is provided', async () => {
    const customWrapper = mountFormTable({
      tableData: [],
      tableProps: { emptyText: 'Element 默认空状态' },
      scopedSlots: {
        empty: '<strong class="custom-empty">暂无可编辑数据</strong>'
      }
    })
    await customWrapper.vm.$nextTick()

    expect(customWrapper.find('.custom-empty').text()).toBe('暂无可编辑数据')
    expect(customWrapper.text()).not.toContain('Element 默认空状态')
    customWrapper.destroy()

    const defaultWrapper = mountFormTable({
      tableData: [],
      tableProps: { emptyText: 'Element 默认空状态' }
    })
    await defaultWrapper.vm.$nextTick()

    expect(defaultWrapper.find('.el-table__empty-text').text()).toBe('Element 默认空状态')
    defaultWrapper.destroy()
  })

  it('forwards the native append slot without adding a FormTable wrapper', async () => {
    const renderAppend = async (tableData: Array<{ name: string }>) => {
      const wrapper = mountFormTable({
        tableData,
        scopedSlots: {
          append: '<div class="native-table-append">继续加载</div>'
        }
      })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.el-table__append-wrapper > .native-table-append').text()).toBe('继续加载')
      expect(wrapper.find('.form-table-append').exists()).toBe(false)
      wrapper.destroy()
    }

    await renderAppend([{ name: 'Alice' }])
    await renderAppend([])

    const wrapper = mountFormTable()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.el-table__append-wrapper').exists()).toBe(false)
    wrapper.destroy()
  })

  it('combines an Element expand column prop with cellSlot content', async () => {
    const wrapper = mountFormTable({
      columns: [{ label: '详情', props: { type: 'expand' }, cellSlot: 'row-detail' }],
      scopedSlots: {
        'row-detail': '<div class="expanded-detail">{{ props.row.name }}详情</div>'
      }
    })
    await wrapper.vm.$nextTick()

    const column = wrapper.findComponent({ name: 'ElTableColumn' })
    expect((column.vm as any).type).toBe('expand')
    expect((column.vm as any).$scopedSlots.default).toBeTypeOf('function')
    wrapper.destroy()
  })

  it('renders a cellSlot column without field wrappers or a virtual fieldKey', async () => {
    const original = [{ id: 1, name: 'Alice', enabled: true }]
    const wrapper = mountFormTable({
      tableData: original,
      columns: [{
        key: 'actions-column',
        label: '操作',
        cellSlot: 'row-actions',
        props: { width: 120, align: 'center' }
      }],
      scopedSlots: {
        'row-actions': `<button
          type="button"
          class="cell-slot-action"
          :data-index="props.index"
          :data-column-key="props.columnConfig.key"
          @click="props.updateRow({ enabled: !props.row.enabled })"
        >{{ props.row.name }}|{{ props.fieldKey === undefined }}|{{ props.propPath === undefined }}</button>`
      }
    })
    await wrapper.vm.$nextTick()

    const button = wrapper.find('.cell-slot-action')
    expect(button.text()).toBe('Alice|true|true')
    expect(button.attributes('data-index')).toBe('0')
    expect(button.attributes('data-column-key')).toBe('actions-column')
    expect(wrapper.find('.el-form-item').exists()).toBe(false)
    expect(wrapper.find('.el-row').exists()).toBe(false)
    expect(wrapper.find('.el-col').exists()).toBe(false)

    await button.trigger('click')
    expect(original).toEqual([{ id: 1, name: 'Alice', enabled: true }])
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { id: 1, name: 'Alice', enabled: false }
    ])
    expect(wrapper.emitted('field-change')?.[0]?.[0]).toMatchObject({
      fieldKey: 'enabled',
      value: false,
      previousValue: true
    })
    wrapper.destroy()
  })

  it('keeps a cellSlot column empty when its named slot is missing', async () => {
    const wrapper = mountFormTable({
      columns: [{ label: '操作', cellSlot: 'missing-actions' }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('操作')
    expect(wrapper.text()).not.toContain('Alice')
    expect(wrapper.findComponent({ name: 'FormTableRow' }).exists()).toBe(false)
    expect(wrapper.find('.el-row').exists()).toBe(false)
    expect(wrapper.find('.el-col').exists()).toBe(false)
    expect(wrapper.find('.el-form-item').exists()).toBe(false)
    wrapper.destroy()
  })

  it('exposes the resolved dynamic label and raw columnConfig to the header slot', async () => {
    const headerProps = vi.fn(({ tableData }: FormTableColumnContext) => ({
      class: `resolved-header-${tableData.length}`,
      'aria-label': '学校说明'
    }))
    const headerHint = vi.fn(({ columnConfig, tableData }: FormTableColumnContext) => (
      `${columnConfig.label}完整说明（${tableData.length}）`
    ))
    const wrapper = mountFormTable({
      columns: [{
        key: 'school-column',
        label: '学校',
        props: ({ tableData }) => ({ label: `学校（${tableData.length}）` }),
        headerSlot: 'school-header',
        headerHint,
        headerProps,
        formItems: [{ fieldKey: 'name', type: 'input' }]
      }],
      scopedSlots: {
        'school-header': `
          <span class="school-header">
            {{ props.label }}|{{ props.columnConfig.label }}|{{ props.columnConfig.key }}|{{ props.column === undefined }}|{{ props.header === undefined }}
          </span>
        `
      }
    })
    await wrapper.vm.$nextTick()

    const header = wrapper.find('.form-table-column-header')
    expect((wrapper.findComponent({ name: 'ElTableColumn' }).vm as any).label).toBe('学校（1）')
    expect(wrapper.find('.school-header').text()).toBe('学校（1）|学校|school-column|true|true')
    expect(wrapper.find('.school-header').classes()).not.toContain('resolved-header-1')
    expect(wrapper.find('.school-header').attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('.school-header').attributes('title')).toBeUndefined()
    expect(header.classes()).toContain('resolved-header-1')
    expect(header.attributes('aria-label')).toBe('学校说明')
    expect(header.attributes('title')).toBeUndefined()
    expect(headerProps).toHaveBeenCalledTimes(1)
    expect(headerHint).not.toHaveBeenCalled()

    await wrapper.setProps({ tableData: [{ name: 'Alice' }, { name: 'Bob' }] })
    await wrapper.vm.$nextTick()
    expect((wrapper.findComponent({ name: 'ElTableColumn' }).vm as any).label).toBe('学校（2）')
    expect(wrapper.find('.school-header').text()).toBe('学校（2）|学校|school-column|true|true')
    expect(header.attributes('title')).toBeUndefined()
    expect(headerHint).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
