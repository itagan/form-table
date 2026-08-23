import { describe, expect, it, vi } from 'vitest'
import type {
  FormTableColumnContext,
  FormTableFieldRenderContext,
  FormTableRowContext
} from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable basic rendering and configuration', () => {
  it('uses top-level rowKey for Element Table and filters the legacy passthrough key', async () => {
    const wrapper = mountFormTable({ rowKey: 'id', tableProps: { rowKey: 'legacy-id' } })
    await wrapper.vm.$nextTick()

    const table = wrapper.findComponent({ name: 'ElTable' })
    expect((table.vm as any).rowKey).toBe('id')
    wrapper.destroy()
  })

  it('renders plain Element selection and index columns from props', async () => {
    const wrapper = mountFormTable({
      columns: [
        { props: { type: 'selection', width: 48 } },
        { label: '序号', visible: ({ tableData }) => tableData.length > 0, props: { type: 'index', width: 64 } },
        { props: { label: '姓名', prop: 'name', width: 120 } }
      ]
    })
    await wrapper.vm.$nextTick()

    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    expect(columns).toHaveLength(3)
    expect((columns.at(0).vm as any).type).toBe('selection')
    expect((columns.at(1).vm as any).type).toBe('index')
    expect((columns.at(1).vm as any).label).toBe('序号')
    expect((columns.at(2).vm as any).label).toBe('姓名')
    expect((columns.at(2).vm as any).prop).toBe('name')
    expect(wrapper.find('.el-form-item').exists()).toBe(false)
    wrapper.destroy()
  })

  it('lets column props override the default label and preserves an explicit empty label', async () => {
    const overridingProps = Object.freeze({ label: '员工姓名', minWidth: 160 })
    const wrapper = mountFormTable({
      columns: [
        { label: '姓名', props: overridingProps, formItems: [] },
        { label: '操作', props: { label: '' }, formItems: [] }
      ]
    })
    await wrapper.vm.$nextTick()

    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    expect((columns.at(0).vm as any).label).toBe('员工姓名')
    expect((columns.at(0).vm as any).minWidth).toBe(160)
    expect((columns.at(1).vm as any).label).toBe('')
    expect(overridingProps).toEqual({ label: '员工姓名', minWidth: 160 })
    wrapper.destroy()
  })

  it('renders one wrapping Flex row per field cell by default and applies rowProps', async () => {
    const rowProps = vi.fn((_context: FormTableRowContext) => ({
      gutter: 12,
      justify: 'space-between',
      align: 'middle',
      class: 'custom-field-layout',
      style: { minHeight: '40px' }
    }))
    const wrapper = mountFormTable({
      tableData: [{ first: '', second: '', third: '', fourth: '', defaultSpan: '' }],
      columns: [{
        label: '分组字段',
        rowProps,
        formItems: [
          { fieldKey: 'first', type: 'input', colProps: { span: 8 } },
          { fieldKey: 'second', type: 'input', colProps: { span: 16 } },
          { fieldKey: 'third', type: 'input', colProps: { span: 12 } },
          { fieldKey: 'fourth', type: 'input', colProps: { span: 12 } },
          { fieldKey: 'defaultSpan', type: 'input', colProps: {} }
        ]
      }]
    })
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAllComponents({ name: 'ElRow' })
    expect(rows).toHaveLength(1)
    expect(rowProps).toHaveBeenCalledTimes(1)
    expect((rows.at(0).vm as any).type).toBe('flex')
    expect((rows.at(0).vm as any).gutter).toBe(12)
    expect((rows.at(0).vm as any).justify).toBe('space-between')
    expect((rows.at(0).vm as any).align).toBe('middle')
    expect(rows.at(0).classes()).toEqual(expect.arrayContaining([
      'form-table-field-layout',
      'custom-field-layout',
      'el-row--flex'
    ]))
    expect(rows.at(0).attributes('style')).toContain('min-height: 40px')
    expect(rows.at(0).findAllComponents({ name: 'ElCol' }).wrappers.map(col => (col.vm as any).span))
      .toEqual([8, 16, 12, 12, 24])
    wrapper.destroy()
  })

  it('lets rowProps override the default Flex row without mutating the source object', async () => {
    const rowProps = Object.freeze({ type: undefined, gutter: 6 })
    const wrapper = mountFormTable({
      tableData: [{ name: '' }],
      columns: [{
        label: '姓名',
        rowProps,
        formItems: [{ fieldKey: 'name', type: 'input' }]
      }]
    })
    await wrapper.vm.$nextTick()

    const row = wrapper.findComponent({ name: 'ElRow' })
    expect((row.vm as any).type).toBeUndefined()
    expect((row.vm as any).gutter).toBe(6)
    expect(row.classes()).not.toContain('el-row--flex')
    expect(rowProps).toEqual({ type: undefined, gutter: 6 })
    wrapper.destroy()
  })

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

  it('applies headerHint and other properties to the default header text node', async () => {
    const headerProps = vi.fn(({ tableData, columnConfig }: FormTableColumnContext) => ({
      class: `records-${tableData.length}`,
      'aria-label': `${columnConfig.label}说明`
    }))
    const headerHint = vi.fn(({ tableData, columnConfig }: FormTableColumnContext) => (
      `${columnConfig.label}：${tableData.length} 条`
    ))
    const wrapper = mountFormTable({
      hintOptions: { targets: 'all' },
      tableData: [{ name: 'Alice' }, { name: 'Bob' }],
      columns: [{
        label: '姓名',
        headerProps,
        headerHint,
        formItems: [{ fieldKey: 'name', type: 'input' }]
      }]
    })
    await wrapper.vm.$nextTick()

    const header = wrapper.find('.form-table-column-header')
    expect(header.attributes('title')).toBe('姓名：2 条')
    expect(header.attributes('aria-label')).toBe('姓名说明')
    expect(header.classes()).toContain('records-2')
    expect(headerProps).toHaveBeenCalledTimes(1)
    expect(headerHint).toHaveBeenCalledTimes(1)
    expect(Object.keys(headerProps.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'tableData'
    ])
    wrapper.destroy()
  })

  it('leaves renderHeader fully controlled by Element UI', async () => {
    const wrapper = mountFormTable({
      columns: [{
        label: '姓名',
        headerHint: '不应自动应用',
        headerProps: { title: '也不应自动应用' },
        props: {
          renderHeader: (h: any) => h('strong', { class: 'native-render-header' }, ['自定义表头'])
        },
        formItems: [{ fieldKey: 'name', type: 'input' }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.native-render-header').text()).toBe('自定义表头')
    expect(wrapper.find('.form-table-column-header').exists()).toBe(false)
    expect(wrapper.find('.native-render-header').attributes('title')).toBeUndefined()
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

  it('applies dynamic field hints to el-form-item without changing component attrs', async () => {
    const hint = vi.fn(({ value }: FormTableFieldRenderContext) => (
      value ? `完整内容：${value}` : undefined
    ))
    const wrapper = mountFormTable({
      tableData: [{ name: 'Alice' }],
      columns: [{
        label: '姓名',
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          hint
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const formItem = wrapper.find('.el-form-item')
    const nativeInput = wrapper.find('.el-input__inner')
    expect(formItem.attributes('title')).toBe('完整内容：Alice')
    expect(nativeInput.attributes('title')).toBeUndefined()
    expect(hint).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ tableData: [{ name: '' }] })
    expect(formItem.attributes('title')).toBeUndefined()
    expect(hint).toHaveBeenCalledTimes(2)
    wrapper.destroy()
  })

  it('preserves title passthrough at header, form-item, and component layers', async () => {
    const wrapper = mountFormTable({
      tableData: [{ name: 'Alice' }],
      columns: [{
        label: '姓名',
        headerProps: { title: '底层表头提示' },
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          formItemProps: { title: '底层字段提示' },
          component: { props: { title: '底层组件提示' } }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.form-table-column-header').attributes('title')).toBe('底层表头提示')
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('底层字段提示')
    expect(wrapper.find('.el-input__inner').attributes('title')).toBe('底层组件提示')
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
