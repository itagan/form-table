/* eslint-disable vue/one-component-per-file */
import ElementUI from 'element-ui'
import { describe, expect, it } from 'vitest'
import Vue from 'vue'
import FormTable, {
  FormTable as NamedFormTable,
  createFormTable,
  defineFormTableColumns,
  defineFormTableType,
  defineFormTableTypes
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
    const fieldType = { is: 'custom-field' }
    expect(defineFormTableType()(fieldType)).toBe(fieldType)
    const fieldTypes = { custom: { is: 'custom-field' } }
    expect(defineFormTableTypes()(fieldTypes)).toBe(fieldTypes)
  })

  it('mounts, updates controlled data, and validates with minimum peers', async () => {
    const EmployeeField = Vue.extend({
      props: ['selectedId'],
      render(createElement) {
        return createElement('button', {
          class: 'minimum-employee-field',
          attrs: {
            type: 'button',
            'data-selected-id': (this.selectedId as { id: string }).id
          },
          on: { click: () => this.$emit('user-confirm', { id: 'user-2' }) }
        }, this.selectedId)
      }
    })
    const fieldTypes = defineFormTableTypes()({
      employee: {
        is: EmployeeField as any,
        model: {
          prop: 'selectedId',
          event: 'user-confirm',
          valueToProp: (_context, value: unknown) => ({ id: value }),
          valueFromEvent: (_context, ...args) => (args[0] as { id: string }).id
        }
      }
    })
    const host = new (Vue.extend({
      data: () => ({
        rows: [{ id: 'row-1', name: 'Alice', appointmentTime: '09:00', employeeId: 'user-1' }]
      }),
      render(createElement) {
        return createElement(FormTable as any, {
          ref: 'formTable',
          props: {
            tableData: this.rows,
            rowKey: 'id',
            fieldTypes,
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
                },
                {
                  fieldKey: 'employeeId',
                  type: 'employee'
                }
              ]
            }]
          },
          on: {
            'update:tableData': (rows: Array<{
              id: string
              name: string
              appointmentTime: string
              employeeId: string
            }>) => {
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
    expect(host.rows).toEqual([{
      id: 'row-1',
      name: 'Bob',
      appointmentTime: '09:00',
      employeeId: 'user-1'
    }])

    const employee = host.$el.querySelector('.minimum-employee-field') as HTMLButtonElement
    expect(employee.dataset.selectedId).toBe('user-1')
    employee.click()
    await Vue.nextTick()
    expect(host.rows[0].employeeId).toBe('user-2')

    host.rows = [{ id: 'row-1', name: '', appointmentTime: '09:00', employeeId: 'user-2' }]
    await Vue.nextTick()
    const formTable = host.$refs.formTable as any
    expect(await formTable.validate()).toBe(false)
    await Vue.nextTick()
    expect(host.$el.textContent).toContain('请输入姓名')
    host.$destroy()
    host.$el.remove()
  })
})
