import { describe, expect, it, vi } from 'vitest'
import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import FormTable from '../index.vue'
import type {
  ColumnConfig,
  CustomComponentConfig,
  FormTableExpose,
  FormTableRecord,
  TableRow,
  ValidationRule
} from '../types.public'

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
  rules?: Record<string, ValidationRule[]>
  formData?: FormTableRecord
  customComponents?: CustomComponentConfig[]
  scopedSlots?: Record<string, any>
}

function mountFormTable(options: MountFormTableOptions = {}) {
  return mount(FormTable as any, {
    localVue,
    propsData: {
      tableData: options.tableData || [{ name: 'Alice' }],
      columns: options.columns || createColumns(),
      rules: options.rules || {},
      formData: options.formData || {},
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

  it('exposes row mutation methods and emits row operation events', async () => {
    const wrapper = mountFormTable({
      tableData: [
        { name: 'Alice' },
        { name: 'Bob' }
      ]
    })
    await wrapper.vm.$nextTick()
    const formTable = wrapper.vm as unknown as FormTableExpose

    formTable.addRow({ name: 'Carol' })
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Carol' }
    ])
    expect(wrapper.emitted('row-add')?.[0]).toEqual([{ name: 'Carol' }, 2])

    await wrapper.setProps({
      tableData: wrapper.emitted('update:tableData')?.[0]?.[0]
    })

    formTable.copyRow(0, { name: 'Alice Copy' })
    expect(wrapper.emitted('update:tableData')?.[1]?.[0]).toEqual([
      { name: 'Alice' },
      { name: 'Alice Copy' },
      { name: 'Bob' },
      { name: 'Carol' }
    ])
    expect(wrapper.emitted('row-copy')?.[0]).toEqual([{ name: 'Alice Copy' }, 1])

    await wrapper.setProps({
      tableData: wrapper.emitted('update:tableData')?.[1]?.[0]
    })

    formTable.moveRow(3, 1)
    expect(wrapper.emitted('update:tableData')?.[2]?.[0]).toEqual([
      { name: 'Alice' },
      { name: 'Carol' },
      { name: 'Alice Copy' },
      { name: 'Bob' }
    ])
    expect(wrapper.emitted('row-move')?.[0]).toEqual([{ name: 'Carol' }, 3, 1])

    await wrapper.setProps({
      tableData: wrapper.emitted('update:tableData')?.[2]?.[0]
    })

    formTable.removeRow(2)
    expect(wrapper.emitted('update:tableData')?.[3]?.[0]).toEqual([
      { name: 'Alice' },
      { name: 'Carol' },
      { name: 'Bob' }
    ])
    expect(wrapper.emitted('row-remove')?.[0]).toEqual([{ name: 'Alice Copy' }, 2])

    wrapper.destroy()
  })

  it('exposes form data helpers and keeps tableData synchronized', async () => {
    const wrapper = mountFormTable({
      tableData: [{ name: 'Alice' }],
      formData: {
        owner: 'tester'
      }
    })
    await wrapper.vm.$nextTick()
    const formTable = wrapper.vm as unknown as FormTableExpose

    expect(formTable.getFormData()).toEqual({
      owner: 'tester',
      tableData: [{ name: 'Alice' }]
    })

    formTable.setFormData({
      owner: 'next',
      tableData: [{ name: 'Bob' }]
    })

    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ name: 'Bob' }])
    expect(wrapper.emitted('update:formData')?.[1]?.[0]).toEqual({
      owner: 'next',
      tableData: [{ name: 'Bob' }]
    })

    wrapper.destroy()
  })

  it('validates visible row fields through the exposed validateRow method', async () => {
    const wrapper = mountFormTable({
      tableData: [{ name: '' }],
      rules: {
        'tableData.*.name': [
          {
            required: true,
            message: '请输入姓名',
            trigger: 'blur'
          }
        ]
      }
    })
    await wrapper.vm.$nextTick()
    const formTable = wrapper.vm as unknown as FormTableExpose
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await expect(formTable.validateRow(0)).resolves.toBe(false)

    await wrapper.setProps({
      tableData: [{ name: 'Alice' }]
    })
    await wrapper.vm.$nextTick()

    await expect(formTable.validateRow(0)).resolves.toBe(true)

    warnSpy.mockRestore()
    wrapper.destroy()
  })
})
