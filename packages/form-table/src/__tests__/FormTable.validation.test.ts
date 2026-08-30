import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FormTable from '../index.vue'
import type {
  FormTableExpose,
  TableRow
} from '../types.public'
import { localVue, mountFormTable } from './test-utils'

describe('FormTable validation', () => {
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
        formItems: [{
          fieldKey: 'profile.phone',
          type: 'input',
          formItemProps: {
            rules: [
              { required: true, message: '请输入手机号', trigger: 'blur' },
              { pattern: /^1\d{10}$/, message: '手机号格式错误', trigger: 'blur' },
              { validator: asyncValidator, trigger: 'blur' }
            ]
          }
        }]
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
        formItems: [{
          fieldKey: 'approval',
          type: 'slot',
          formItemProps: {
            rules: [{ required: true, message: '请选择审核结果', trigger: 'change' }]
          },
          component: { slot: 'approval' }
        }]
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

  it('lets a cellSlot compose multiple rows that remain managed by the root form', async () => {
    const Host = localVue.extend({
      components: { FormTable },
      data() {
        return {
          tableData: [{ firstName: '', lastName: '' }],
          columns: [{ label: '手写多行', cellSlot: 'manual-fields' }],
          changes: [] as unknown[]
        }
      },
      methods: {
        recordChange(payload: unknown) {
          this.changes.push(payload)
        }
      },
      template: `
        <FormTable
          ref="formTable"
          v-model="tableData"
          :columns="columns"
          @field-change="recordChange"
        >
          <template #manual-fields="props">
            <div class="manual-multi-row">
              <el-row class="manual-row-first">
                <el-col :span="24">
                  <el-form-item
                    :prop="\`tableData.\${props.index}.firstName\`"
                    :rules="[{ required: true, message: '请输入名' }]"
                  >
                    <button type="button" class="set-first-name" @click="props.updateRow({ firstName: 'Ada' })">设置名</button>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row class="manual-row-second">
                <el-col :span="24">
                  <el-form-item
                    :prop="\`tableData.\${props.index}.lastName\`"
                    :rules="[{ required: true, message: '请输入姓' }]"
                  >
                    <button type="button" class="set-last-name" @click="props.updateRow({ lastName: 'Lovelace' })">设置姓</button>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </template>
        </FormTable>
      `
    })
    const wrapper = mount(Host, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()
    const expose = wrapper.findComponent(FormTable as any).vm as unknown as FormTableExpose

    expect(wrapper.findAll('.manual-multi-row > .el-row')).toHaveLength(2)
    expect(expose.getFormRef()).toBeTruthy()
    expect(await expose.validate()).toBe(false)

    await wrapper.find('.set-first-name').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.find('.set-last-name').trigger('click')
    await wrapper.vm.$nextTick()

    expect((wrapper.vm as any).tableData).toEqual([{ firstName: 'Ada', lastName: 'Lovelace' }])
    expect((wrapper.vm as any).changes).toHaveLength(2)
    expect(await expose.validate()).toBe(true)
    expose.clearValidate()
    wrapper.destroy()
  })

  it('clears stale validation state after dynamic rows are removed', async () => {
    const secondRow = { name: '' }
    const wrapper = mountFormTable({
      tableData: [{ name: '' }, secondRow],
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          formItemProps: {
            rules: [{ required: true, message: '请输入姓名' }]
          }
        }]
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
