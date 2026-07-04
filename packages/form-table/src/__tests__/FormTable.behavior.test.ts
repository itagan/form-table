import { describe, expect, it } from 'vitest'
import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import FormTable from '../index.vue'
import type { ColumnConfig, CustomComponentConfig, TableRow } from '../types.public'

const localVue = createLocalVue()
localVue.use(ElementUI)

function createColumns(): ColumnConfig[] {
  return [
    {
      name: '姓名',
      children: [
        {
          children: [
            {
              key: 'name',
              type: 'input',
              component: {
                bind: {
                  placeholder: '请输入姓名'
                }
              }
            }
          ]
        }
      ]
    }
  ]
}

interface MountFormTableOptions {
  tableData?: TableRow[]
  columns?: ColumnConfig[]
  customComponents?: CustomComponentConfig[]
  scopedSlots?: Record<string, any>
}

function mountFormTable(options: MountFormTableOptions = {}) {
  return mount(FormTable as any, {
    localVue,
    propsData: {
      tableData: options.tableData || [{ name: 'Alice' }],
      columns: options.columns || createColumns(),
      rules: {},
      formData: {},
      customComponents: options.customComponents || []
    },
    scopedSlots: options.scopedSlots,
    attachTo: document.body
  })
}

describe('FormTable behavior', () => {
  it('renders configured columns and row values', async () => {
    const wrapper = mountFormTable()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('姓名')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Alice')

    wrapper.destroy()
  })

  it('emits table data and field-change events when an input changes', async () => {
    const wrapper = mountFormTable()
    await wrapper.vm.$nextTick()
    const input = wrapper.find('input')

    await input.setValue('Bob')

    const tableDataEvents = wrapper.emitted('update:tableData')
    const fieldChangeEvents = wrapper.emitted('field-change')

    expect(tableDataEvents).toBeTruthy()
    expect(tableDataEvents?.[0]?.[0]).toEqual([{ name: 'Bob' }])
    expect(fieldChangeEvents?.[0]?.[0]).toEqual({
      row: { name: 'Bob' },
      index: 0,
      fieldKey: 'name',
      value: 'Bob',
      previousValue: 'Alice'
    })

    wrapper.destroy()
  })

  it('updates row data through a field slot setValue helper', async () => {
    const wrapper = mountFormTable({
      tableData: [{ school: '第一中学' }],
      columns: [
        {
          name: '学校',
          children: [
            {
              children: [
                {
                  key: 'school',
                  type: 'slot',
                  component: {
                    slotName: 'school-field'
                  }
                }
              ]
            }
          ]
        }
      ],
      scopedSlots: {
        'school-field': '<button type="button" class="slot-setter" @click="props.setValue(\'第二中学\')">{{ props.value }}</button>'
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.slot-setter').text()).toBe('第一中学')

    await wrapper.find('.slot-setter').trigger('click')

    const tableDataEvents = wrapper.emitted('update:tableData')
    const fieldChangeEvents = wrapper.emitted('field-change')

    expect(tableDataEvents?.[0]?.[0]).toEqual([{ school: '第二中学' }])
    expect(fieldChangeEvents?.[0]?.[0]).toEqual({
      row: { school: '第二中学' },
      index: 0,
      fieldKey: 'school',
      value: '第二中学',
      previousValue: '第一中学'
    })

    wrapper.destroy()
  })

  it('updates row data from a registered custom component v-model', async () => {
    const StatusInput = {
      name: 'StatusInput',
      props: {
        value: {
          type: String,
          default: ''
        }
      },
      render(this: any, h: any): any {
        return h(
          'button',
          {
            class: 'status-input',
            attrs: { type: 'button' },
            on: {
              click: () => this.$emit('input', 'disabled')
            }
          },
          this.value
        )
      }
    }

    const wrapper = mountFormTable({
      tableData: [{ status: 'enabled' }],
      columns: [
        {
          name: '状态',
          children: [
            {
              children: [
                {
                  key: 'status',
                  type: 'custom',
                  component: {
                    customComponent: 'StatusInput'
                  }
                }
              ]
            }
          ]
        }
      ],
      customComponents: [
        {
          name: 'StatusInput',
          component: StatusInput
        }
      ]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.status-input').text()).toBe('enabled')

    await wrapper.find('.status-input').trigger('click')

    const tableDataEvents = wrapper.emitted('update:tableData')
    const fieldChangeEvents = wrapper.emitted('field-change')

    expect(tableDataEvents?.[0]?.[0]).toEqual([{ status: 'disabled' }])
    expect(fieldChangeEvents?.[0]?.[0]).toEqual({
      row: { status: 'disabled' },
      index: 0,
      fieldKey: 'status',
      value: 'disabled',
      previousValue: 'enabled'
    })

    wrapper.destroy()
  })
})
