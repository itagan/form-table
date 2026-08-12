import { describe, expect, it, vi } from 'vitest'
import type {
  FormTableExpose,
  TableRow
} from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable validation and exposed API', () => {
  it('forwards only native table events and exposes native refs', async () => {
    const rowClick = vi.fn()
    const fieldChange = vi.fn()
    const updateTableData = vi.fn()
    const wrapper = mountFormTable({
      listeners: {
        'row-click': rowClick,
        'field-change': fieldChange,
        'update:tableData': updateTableData
      }
    })
    await wrapper.vm.$nextTick()
    const table = wrapper.findComponent({ name: 'ElTable' }).vm as any
    expect(Object.keys(table.$listeners)).toContain('row-click')
    expect(Object.keys(table.$listeners)).not.toContain('field-change')
    expect(Object.keys(table.$listeners)).not.toContain('update:tableData')
    table.$emit('row-click', { name: 'Alice' })
    expect(rowClick).toHaveBeenCalledWith({ name: 'Alice' })

    const expose = wrapper.vm as unknown as FormTableExpose
    expect(expose.getFormRef()).toBeTruthy()
    expect(expose.getTableRef()).toBeTruthy()
    expect((expose as any).resetFields).toBeUndefined()
    expose.clearValidate()
    wrapper.destroy()
  })

  it('validates required, pattern, async, and nested field rules', async () => {
    const asyncValidator = vi.fn((_rule, value, callback) => {
      Promise.resolve().then(() => {
        callback(value === '13800138000' ? undefined : new Error('手机号不可用'))
      })
    })
    const wrapper = mountFormTable({
      tableData: [{ profile: { phone: '' } }],
      columns: [{
        label: '手机号',
        children: [{ children: [{
          fieldKey: 'profile.phone',
          type: 'input',
          formItemProps: {
            rules: [
              { required: true, message: '请输入手机号', trigger: 'blur' },
              { pattern: /^1\d{10}$/, message: '手机号格式错误', trigger: 'blur' },
              { validator: asyncValidator, trigger: 'blur' }
            ]
          }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    const expose = wrapper.vm as unknown as FormTableExpose

    expect(await expose.validate()).toBe(false)
    await wrapper.setProps({ tableData: [{ profile: { phone: '13800138000' } }] })
    await wrapper.vm.$nextTick()
    expect(await expose.validate()).toBe(true)
    expect(asyncValidator).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('supports manual validateField for a custom slot using propPath', async () => {
    const wrapper = mountFormTable({
      tableData: [{ approval: '' }],
      columns: [{
        label: '审核',
        children: [{ children: [{
          fieldKey: 'approval',
          type: 'slot',
          formItemProps: {
            rules: [{ required: true, message: '请选择审核结果', trigger: 'change' }]
          },
          component: { renderer: 'approval' }
        }] }]
      }],
      scopedSlots: {
        approval: `
          <button
            type="button"
            class="approve-slot"
            :data-prop="props.propPath"
            @click="props.setValue('approved')"
          >通过</button>
        `
      }
    })
    await wrapper.vm.$nextTick()
    const button = wrapper.find('.approve-slot')
    const propPath = String(button.attributes('data-prop'))
    expect(propPath).toBe('tableData.0.approval')
    await button.trigger('click')
    const nextTableData = wrapper.emitted('update:tableData')?.at(-1)?.[0] as TableRow[]
    await wrapper.setProps({ tableData: nextTableData })
    await wrapper.vm.$nextTick()

    const formRef = (wrapper.vm as unknown as FormTableExpose).getFormRef()
    await new Promise<void>((resolve) => {
      formRef?.validateField?.(propPath, (message) => {
        expect(message).toBe('')
        resolve()
      })
    })
    wrapper.destroy()
  })

  it('clears stale validation state after dynamic rows are removed', async () => {
    const secondRow = { name: '' }
    const wrapper = mountFormTable({
      tableData: [{ name: '' }, secondRow],
      columns: [{
        label: '姓名',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'input',
          formItemProps: {
            rules: [{ required: true, message: '请输入姓名' }]
          }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    const expose = wrapper.vm as unknown as FormTableExpose
    expect(await expose.validate()).toBe(false)
    expect(wrapper.findAll('.el-form-item.is-error').length).toBeGreaterThan(0)

    await wrapper.setProps({ tableData: [secondRow] })
    await wrapper.vm.$nextTick()
    expose.clearValidate()
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.el-form-item.is-error')).toHaveLength(0)
    wrapper.destroy()
  })
})
