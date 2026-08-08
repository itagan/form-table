import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import { describe, expect, it, vi } from 'vitest'
import FormTable from '../index.vue'
import type {
  ColumnConfig,
  FormTableFieldRenderContext,
  FormTableExpose,
  FormTableRowContext,
  FormTableTableContext,
  TableRow
} from '../types.public'

const localVue = createLocalVue()
localVue.use(ElementUI)

const inputColumns: ColumnConfig[] = [
  {
    label: '姓名',
    children: [
      {
        children: [
          {
            fieldKey: 'name',
            type: 'input',
            component: {
              props: { placeholder: '请输入姓名' }
            }
          }
        ]
      }
    ]
  }
]

function mountFormTable(options: {
  tableData?: TableRow[]
  columns?: ColumnConfig[]
  scopedSlots?: Record<string, any>
  listeners?: Record<string, (...args: any[]) => void>
} = {}) {
  return mount(FormTable as any, {
    localVue,
    propsData: {
      tableData: options.tableData || [{ name: 'Alice' }],
      columns: options.columns || inputColumns,
      formProps: { size: 'small' },
      tableProps: { border: true }
    },
    scopedSlots: options.scopedSlots,
    listeners: options.listeners,
    attachTo: document.body
  })
}

describe('FormTable core behavior', () => {
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

  it('keeps nested field paths working', async () => {
    const wrapper = mountFormTable({
      tableData: [{ profile: { city: '杭州' } }],
      columns: [{
        label: '城市',
        children: [{ children: [{ fieldKey: 'profile.city', type: 'input' }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('input').setValue('宁波')

    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { profile: { city: '宁波' } }
    ])
    wrapper.destroy()
  })

  it('renders a named slot and exposes focused update helpers', async () => {
    const componentPropsResolver = vi.fn(({ row }: FormTableFieldRenderContext) => ({
      suffix: row.school === '一中' ? '（当前）' : ''
    }))
    const slotListener = vi.fn()
    const wrapper = mountFormTable({
      tableData: [{ school: '一中' }],
      columns: [{
        label: '学校',
        children: [{ children: [{
          fieldKey: 'school',
          type: 'slot',
          component: {
            renderer: 'school',
            props: componentPropsResolver,
            options: [{ label: '校区配置', value: 'campus' }],
            listeners: { commit: slotListener }
          }
        }] }]
      }],
      scopedSlots: {
        school: `<button
          type="button"
          class="slot-setter"
          @click="props.setValue('二中'); props.component.listeners.commit('saved')"
        >{{ props.value }}{{ props.component.props.suffix }}{{ props.component.options[0].label }}</button>`
      }
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.slot-setter').text()).toBe('一中（当前）校区配置')
    expect(componentPropsResolver).toHaveBeenCalledTimes(1)
    expect(Object.keys(componentPropsResolver.mock.calls[0][0]).sort()).toEqual([
      'fieldKey',
      'index',
      'row',
      'tableData',
      'value'
    ])
    await wrapper.find('.slot-setter').trigger('click')
    expect(slotListener).toHaveBeenCalledTimes(1)
    expect(slotListener.mock.calls[0][0]).toMatchObject({
      row: { school: '一中' },
      fieldKey: 'school',
      value: '一中'
    })
    expect(slotListener.mock.calls[0][1]).toBe('saved')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ school: '二中' }])
    wrapper.destroy()
  })

  it('renders the field value when an untyped config has no renderer', async () => {
    const wrapper = mountFormTable({
      tableData: [{ summary: '只读内容' }],
      columns: [{
        label: '默认展示',
        children: [{ children: [{ fieldKey: 'summary' } as any] }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('只读内容')
    wrapper.destroy()
  })

  it('renders a directly supplied component and wraps its listeners', async () => {
    const listener = vi.fn((context) => context.setValue('disabled'))
    const StatusInput = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'status-input',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('commit', 'saved', { source: 'button' }) }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ status: 'enabled' }],
      columns: [{
        label: '状态',
        children: [{
          children: [{
            fieldKey: 'status',
            type: 'component',
            component: {
              renderer: StatusInput,
              listeners: { commit: listener }
            }
          }]
        }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('.status-input').trigger('click')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0]).toMatchObject({
      row: { status: 'enabled' },
      index: 0,
      fieldKey: 'status',
      value: 'enabled'
    })
    expect(Object.keys(listener.mock.calls[0][0]).sort()).toEqual([
      'fieldKey',
      'index',
      'row',
      'setValue',
      'tableData',
      'updateRow',
      'value'
    ])
    expect(listener.mock.calls[0].slice(1)).toEqual(['saved', { source: 'button' }])
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ status: 'disabled' }])
    wrapper.destroy()
  })

  it('applies updateRow patches immutably and emits one change per field', async () => {
    const original = [{ name: 'Alice', profile: { city: '杭州' } }]
    const wrapper = mountFormTable({
      tableData: original,
      columns: [{
        label: '批量更新',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          component: { renderer: 'batch-update' }
        }] }]
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
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          component: { renderer: 'compose-update' }
        }] }]
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

  it('resolves dynamic visibility and options from row context', async () => {
    const columnVisible = vi.fn((_context: FormTableTableContext) => true)
    const rowProps = vi.fn((_context: FormTableRowContext) => ({ gutter: 8 }))
    const fieldVisible = vi.fn(({ row }: FormTableFieldRenderContext) => row.province === 'zhejiang')
    const fieldOptions = vi.fn(({ row }: FormTableFieldRenderContext) => row.province === 'zhejiang'
      ? [{ label: '杭州', value: 'hangzhou' }]
      : [])
    const columns: ColumnConfig[] = [{
      label: '地区',
      visible: columnVisible,
      children: [{
        props: rowProps,
        children: [
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
    }]
    const wrapper = mountFormTable({
      tableData: [{ province: 'zhejiang', city: 'hangzhou' }],
      columns
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.el-select')).toHaveLength(2)
    expect(Object.keys(columnVisible.mock.calls[0][0]).sort()).toEqual(['tableData'])
    expect(Object.keys(rowProps.mock.calls[0][0]).sort()).toEqual([
      'index',
      'row',
      'tableData'
    ])
    expect(Object.keys(fieldVisible.mock.calls[0][0]).sort()).toEqual([
      'fieldKey',
      'index',
      'row',
      'tableData',
      'value'
    ])
    expect(Object.keys(fieldOptions.mock.calls[0][0]).sort()).toEqual([
      'fieldKey',
      'index',
      'row',
      'tableData',
      'value'
    ])
    wrapper.destroy()
  })

  it('forwards native table events and exposes native refs', async () => {
    const rowClick = vi.fn()
    const wrapper = mountFormTable({ listeners: { 'row-click': rowClick } })
    await wrapper.vm.$nextTick()
    ;(wrapper.findComponent({ name: 'ElTable' }).vm as any).$emit('row-click', { name: 'Alice' })
    expect(rowClick).toHaveBeenCalledWith({ name: 'Alice' })

    const expose = wrapper.vm as unknown as FormTableExpose
    expect(expose.getFormRef()).toBeTruthy()
    expect(expose.getTableRef()).toBeTruthy()
    expose.clearValidate()
    wrapper.destroy()
  })
})
