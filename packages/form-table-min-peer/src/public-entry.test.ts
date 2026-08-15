import ElementUI from 'element-ui'
import { describe, expect, it } from 'vitest'
import Vue from 'vue'
import FormTable, {
  FormTable as NamedFormTable,
  createFormTable,
  defineFormTableColumns
} from '@itagan/form-table'
import '@itagan/form-table/style.css'

Vue.use(ElementUI)

describe('minimum peer package consumer', () => {
  it('loads the built public entry and keeps runtime exports aligned', () => {
    expect(Vue.version).toBe('2.7.1')
    expect(ElementUI.version).toBe('2.4.9')
    expect(NamedFormTable).toBe(FormTable)
    expect(createFormTable()).toBe(FormTable)
    expect(defineFormTableColumns([])).toEqual([])
  })

  it('mounts, updates controlled data, and validates with minimum peers', async () => {
    const host = new (Vue.extend({
      data: () => ({ rows: [{ id: 'row-1', name: 'Alice', appointmentTime: '09:00' }] }),
      render(createElement) {
        return createElement(FormTable as any, {
          ref: 'formTable',
          props: {
            tableData: this.rows,
            rowKey: 'id',
            columns: [{
              label: '姓名',
              formItems: [
                {
                  fieldKey: 'name',
                  type: 'input',
                  formItemProps: {
                    rules: [{ required: true, message: '请输入姓名' }]
                  }
                },
                {
                  fieldKey: 'appointmentTime',
                  type: 'time-select',
                  component: {
                    props: {
                      pickerOptions: { start: '08:00', step: '00:30', end: '18:00' }
                    }
                  }
                }
              ]
            }]
          },
          on: {
            'update:tableData': (rows: Array<{ id: string, name: string, appointmentTime: string }>) => {
              this.rows = rows
            }
          }
        })
      }
    }))().$mount()
    document.body.appendChild(host.$el)
    await Vue.nextTick()

    expect(host.$el.querySelector('.el-date-editor--time-select')).not.toBeNull()
    const input = host.$el.querySelector('input') as HTMLInputElement
    input.value = 'Bob'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await Vue.nextTick()
    expect(host.rows).toEqual([{ id: 'row-1', name: 'Bob', appointmentTime: '09:00' }])

    host.rows = [{ id: 'row-1', name: '', appointmentTime: '09:00' }]
    await Vue.nextTick()
    const formTable = host.$refs.formTable as any
    expect(await formTable.validate()).toBe(false)
    await Vue.nextTick()
    expect(host.$el.textContent).toContain('请输入姓名')
    host.$destroy()
    host.$el.remove()
  })
})
