import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import FormTable from '../index.vue'
import type { ColumnConfig, FormTableHintOptions, FormTableRowKey, TableRow } from '../types.public'

export const localVue = createLocalVue()
localVue.use(ElementUI)

export const inputColumns: ColumnConfig[] = [{
  label: '姓名',
  children: [{
    children: [{
      fieldKey: 'name',
      type: 'input',
      component: {
        props: { placeholder: '请输入姓名' }
      }
    }]
  }]
}]

export function mountFormTable(options: {
  tableData?: TableRow[]
  columns?: ColumnConfig[]
  tableProps?: Record<string, any>
  rowKey?: FormTableRowKey
  hintOptions?: FormTableHintOptions
  scopedSlots?: Record<string, any>
  listeners?: Record<string, (...args: any[]) => void>
} = {}) {
  return mount(FormTable as any, {
    localVue,
    propsData: {
      tableData: options.tableData || [{ name: 'Alice' }],
      columns: options.columns || inputColumns,
      formProps: { size: 'small' },
      tableProps: { border: true, ...options.tableProps },
      rowKey: options.rowKey,
      hintOptions: options.hintOptions
    },
    scopedSlots: options.scopedSlots,
    listeners: options.listeners,
    attachTo: document.body
  })
}
