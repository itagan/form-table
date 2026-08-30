import { describe, expect, it, vi } from 'vitest'
import { mountFormTable } from './test-utils'

describe('FormTable built-in field rendering', () => {
  it('uses component props for Input and DatePicker variants', async () => {
    const wrapper = mountFormTable({
      tableData: [{ description: '初始内容', startedAt: '', birthday: '' }],
      columns: [{
        label: '组件模式',
        formItems: [
          {
            fieldKey: 'description',
            type: 'input',
            component: { props: { type: 'textarea', rows: 3 } }
          },
          {
            fieldKey: 'startedAt',
            type: 'date',
            component: { props: { type: 'datetime' } }
          },
          { fieldKey: 'birthday', type: 'date' }
        ]
      }]
    })
    await wrapper.vm.$nextTick()

    const input = wrapper.findComponent({ name: 'ElInput' })
    expect((input.vm as any).type).toBe('textarea')
    expect(input.find('textarea').attributes('rows')).toBe('3')

    const datePickers = wrapper.findAllComponents({ name: 'ElDatePicker' })
    expect(datePickers).toHaveLength(2)
    expect((datePickers.at(0).vm as any).type).toBe('datetime')
    expect((datePickers.at(1).vm as any).type).toBe('date')

    input.vm.$emit('input', '更新内容')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{
      description: '更新内容',
      startedAt: '',
      birthday: ''
    }])
    wrapper.destroy()
  })

  it('renders time-select as the independent Element TimeSelect component', async () => {
    const pickerOptions = { start: '08:00', step: '00:30', end: '18:00' }
    const wrapper = mountFormTable({
      tableData: [{ appointmentTime: '09:00' }],
      columns: [{
        label: '预约时间',
        formItems: [{
          fieldKey: 'appointmentTime',
          type: 'time-select',
          component: { props: { pickerOptions, placeholder: '选择时间' } }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const timeSelect = wrapper.findComponent({ name: 'ElTimeSelect' })
    expect(timeSelect.exists()).toBe(true)
    expect((timeSelect.vm as any).pickerOptions).toEqual(pickerOptions)

    timeSelect.vm.$emit('input', '10:30')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{
      appointmentTime: '10:30'
    }])
    wrapper.destroy()
  })

  it('renders fields without a stateful component adapter instance', async () => {
    const wrapper = mountFormTable()
    await wrapper.vm.$nextTick()

    const input = wrapper.findComponent({ name: 'ElInput' })
    const componentNames: string[] = []
    let parent = input.vm.$parent
    while (parent) {
      const options = parent.$options as { name?: string; __name?: string }
      componentNames.push(options.name || options.__name || '')
      parent = parent.$parent
    }

    expect(componentNames.slice(0, 2)).toEqual(['ElFormItem', 'FormTableItem'])
    expect(componentNames).not.toContain('ComponentWrapper')
    wrapper.destroy()
  })

  it('applies component props, including native title, to text fields', async () => {
    const valueToProp = vi.fn(() => '不应展示')
    const wrapper = mountFormTable({
      tableData: [{ summary: '完整说明' }],
      columns: [{
        label: '摘要',
        formItems: [{
          fieldKey: 'summary',
          type: 'text',
          component: {
            model: { valueToProp },
            props: ({ value }) => ({
              title: `查看：${value}`,
              class: 'summary-text'
            })
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const text = wrapper.find('.summary-text')
    expect(text.text()).toBe('完整说明')
    expect(text.attributes('title')).toBe('查看：完整说明')
    expect(valueToProp).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('forwards text field listeners with the field context and original event arguments', async () => {
    const click = vi.fn()
    const wrapper = mountFormTable({
      tableData: [{ summary: '只读摘要' }],
      columns: [{
        label: '摘要',
        formItems: [{
          fieldKey: 'summary',
          type: 'text',
          component: {
            props: { class: 'clickable-summary', title: '查看摘要' },
            listeners: { click }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    await wrapper.find('.clickable-summary').trigger('click')

    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.calls[0][0]).toMatchObject({
      row: { summary: '只读摘要' },
      index: 0,
      fieldKey: 'summary',
      value: '只读摘要'
    })
    expect(click.mock.calls[0][1]).toBeInstanceOf(Event)
    expect(wrapper.find('.clickable-summary').attributes('title')).toBe('查看摘要')
    wrapper.destroy()
  })

  it('passes native title through to built-in field components without an extra wrapper', async () => {
    const wrapper = mountFormTable({
      tableData: [{ name: 'Alice' }],
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          component: {
            props: ({ value }) => ({
              title: value ? `编辑：${value}` : undefined
            })
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const inputRoot = wrapper.find('.el-input')
    const nativeInput = wrapper.find('.el-input__inner')
    expect(inputRoot.attributes('title')).toBeUndefined()
    expect(nativeInput.attributes('title')).toBe('编辑：Alice')
    expect(inputRoot.element.parentElement?.classList.contains('el-form-item__content')).toBe(true)

    await wrapper.setProps({ tableData: [{ name: 'Bob' }] })
    expect(nativeInput.attributes('title')).toBe('编辑：Bob')

    await wrapper.setProps({ tableData: [{ name: '' }] })
    expect(nativeInput.attributes('title')).toBeUndefined()
    wrapper.destroy()
  })
})
