import { describe, expect, it } from 'vitest'
import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import FormTable from '../index.vue'
import type { ColumnConfig, TableRow } from '../types.public'

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

function mountFormTable(tableData: TableRow[] = [{ name: 'Alice' }]) {
  return mount(FormTable as any, {
    localVue,
    propsData: {
      tableData,
      columns: createColumns(),
      rules: {},
      formData: {}
    },
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
})
