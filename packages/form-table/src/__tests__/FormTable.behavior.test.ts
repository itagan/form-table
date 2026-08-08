import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import { describe, expect, it, vi } from 'vitest'
import FormTable from '../index.vue'
import type { ColumnConfig, FormTableExpose, TableRow } from '../types.public'

const localVue = createLocalVue()
localVue.use(ElementUI)

const inputColumns: ColumnConfig[] = [
  {
    name: '姓名',
    children: [
      {
        children: [
          {
            key: 'name',
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
        name: '城市',
        children: [{ children: [{ key: 'profile.city', type: 'input' }] }]
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
    const wrapper = mountFormTable({
      tableData: [{ school: '一中' }],
      columns: [{
        name: '学校',
        children: [{ children: [{ key: 'school', slot: 'school' }] }]
      }],
      scopedSlots: {
        school: '<button type="button" class="slot-setter" @click="props.setValue(\'二中\')">{{ props.value }}</button>'
      }
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.slot-setter').text()).toBe('一中')
    await wrapper.find('.slot-setter').trigger('click')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ school: '二中' }])
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
          on: { click: () => this.$emit('commit') }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ status: 'enabled' }],
      columns: [{
        name: '状态',
        children: [{
          children: [{
            key: 'status',
            component: {
              is: StatusInput,
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
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ status: 'disabled' }])
    wrapper.destroy()
  })

  it('resolves dynamic visibility and options from row context', async () => {
    const columns: ColumnConfig[] = [{
      name: '地区',
      children: [{
        props: { gutter: 8 },
        children: [
          {
            key: 'province',
            type: 'select',
            colProps: { span: 12 },
            component: {
              options: [{ label: '浙江', value: 'zhejiang' }]
            }
          },
          {
            key: 'city',
            type: 'select',
            visible: ({ row }) => row.province === 'zhejiang',
            colProps: { span: 12 },
            component: {
              options: ({ row }) => row.province === 'zhejiang'
                ? [{ label: '杭州', value: 'hangzhou' }]
                : []
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
