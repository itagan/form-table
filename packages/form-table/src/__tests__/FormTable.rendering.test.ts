import { describe, expect, it, vi } from 'vitest'
import FormTableColumn from '../FormTableColumn.vue'
import type {
  ColumnConfig,
  FormItemConfig,
  FormTableColumnContext,
  FormTableFieldRenderContext,
  FormTableRowContext
} from '../types.public'
import { mountFormTable } from './test-utils'

describe('FormTable rendering and configuration', () => {
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
        { label: '序号', visible: ({ tableData }) => tableData.length > 0, props: { type: 'index', width: 64 } }
      ]
    })
    await wrapper.vm.$nextTick()

    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    expect(columns).toHaveLength(2)
    expect((columns.at(0).vm as any).type).toBe('selection')
    expect((columns.at(1).vm as any).type).toBe('index')
    expect((columns.at(1).vm as any).label).toBe('序号')
    expect(wrapper.find('.el-form-item').exists()).toBe(false)
    wrapper.destroy()
  })

  it('renders one wrapping Flex row per field cell and lets rowProps configure it except type', async () => {
    const rowProps = vi.fn((_context: FormTableRowContext) => ({
      type: 'block',
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
    const wrapper = mountFormTable({
      tableData: [{ summary: '完整说明' }],
      columns: [{
        label: '摘要',
        formItems: [{
          fieldKey: 'summary',
          type: 'text',
          component: {
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

  it('renders a directly supplied component and wraps its listeners', async () => {
    const listener = vi.fn((context) => context.setValue('disabled'))
    const componentProps = vi.fn((context: FormTableFieldRenderContext) => ({ marker: context.fieldKey }))
    const StatusInput = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'status-input',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('commit', 'saved', { source: 'button' }) }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ status: 'enabled' }],
      columns: [{
        label: '状态',
        formItems: [{
            fieldKey: 'status',
            type: 'component',
            hint: '状态字段说明',
            component: {
              renderer: StatusInput,
              props: componentProps,
              listeners: { commit: listener }
            }
          }]
      }]
    })
    await wrapper.vm.$nextTick()
    expect(componentProps).toHaveBeenCalledTimes(1)
    expect(Object.keys(componentProps.mock.calls[0][0])).not.toContain('hint')
    await wrapper.find('.status-input').trigger('click')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0]).toMatchObject({
      row: { status: 'enabled' },
      index: 0,
      fieldKey: 'status',
      value: 'enabled',
      columnConfig: { label: '状态' },
      itemConfig: { fieldKey: 'status', type: 'component' }
    })
    expect(Object.keys(listener.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'fieldKey',
      'index',
      'itemConfig',
      'row',
      'setValue',
      'tableData',
      'updateRow',
      'value'
    ])
    expect(listener.mock.calls[0].slice(1)).toEqual(['saved', { source: 'button' }])
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ status: 'disabled' }])
    wrapper.destroy()
  })

  it('resolves the component from the current row and keeps model updates working', async () => {
    const createEditor = (name: string, className: string) => ({
      name,
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: className,
          attrs: { type: 'button' },
          on: { click: () => this.$emit('input', `${this.value}-updated`) }
        }, this.value)
      }
    })
    const VenueEditor = createEditor('VenueEditor', 'venue-editor')
    const HotelEditor = {
      name: 'HotelEditor',
      model: { prop: 'selected', event: 'change' },
      props: ['selected'],
      render(this: any, h: any) {
        return h('button', {
          class: 'hotel-editor',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('change', `${this.selected}-updated`) }
        }, this.selected)
      }
    }
    const resolveRenderer = vi.fn((context: FormTableFieldRenderContext) => (
      context.row.type === 'hotel' ? HotelEditor : VenueEditor
    ))
    const wrapper = mountFormTable({
      tableData: [
        { type: 'venue', detail: '会场需求' },
        { type: 'hotel', detail: '酒店需求' }
      ],
      columns: [{
        label: '需求说明',
        formItems: [{
          fieldKey: 'detail',
          type: 'component',
          component: { resolveRenderer }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.venue-editor').text()).toBe('会场需求')
    expect(wrapper.find('.hotel-editor').text()).toBe('酒店需求')
    expect(resolveRenderer).toHaveBeenCalledTimes(2)
    expect(resolveRenderer.mock.calls[1][0]).toMatchObject({
      row: { type: 'hotel', detail: '酒店需求' },
      index: 1,
      fieldKey: 'detail',
      value: '酒店需求'
    })

    await wrapper.find('.hotel-editor').trigger('click')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { type: 'venue', detail: '会场需求' },
      { type: 'hotel', detail: '酒店需求-updated' }
    ])
    wrapper.destroy()
  })

  it('falls back to the static renderer when resolveRenderer returns undefined', async () => {
    const DefaultEditor = {
      props: ['value'],
      render(this: any, h: any) {
        return h('span', { class: 'default-editor' }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ detail: '默认需求' }],
      columns: [{
        label: '需求说明',
        formItems: [{
          fieldKey: 'detail',
          type: 'component',
          component: {
            renderer: DefaultEditor,
            resolveRenderer: () => undefined
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.default-editor').text()).toBe('默认需求')
    wrapper.destroy()
  })

  it('renders an empty field when no component can be resolved', async () => {
    const wrapper = mountFormTable({
      tableData: [{ detail: '未支持的需求' }],
      columns: [{
        label: '需求说明',
        formItems: [{
          fieldKey: 'detail',
          type: 'component',
          component: { resolveRenderer: () => undefined }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('未支持的需求')
    expect(wrapper.find('input').exists()).toBe(false)
    wrapper.destroy()
  })

  it('preserves a component declared Vue 2 model when model config is omitted', async () => {
    const DeclaredModelSwitch = {
      model: { prop: 'checked', event: 'toggle' },
      props: ['checked'],
      render(this: any, h: any) {
        return h('button', {
          class: 'declared-model-switch',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('toggle', !this.checked) }
        }, String(this.checked))
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ enabled: true }],
      columns: [{
        label: '启用',
        formItems: [{
          fieldKey: 'enabled',
          type: 'component',
          component: { renderer: DeclaredModelSwitch }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.declared-model-switch').text()).toBe('true')
    await wrapper.find('.declared-model-switch').trigger('click')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ enabled: false }])
    wrapper.destroy()
  })

  it('supports a custom model prop, event, value extractor, and same-event listener', async () => {
    const selectionListener = vi.fn()
    const UserSelector = {
      props: ['selectedId'],
      render(this: any, h: any) {
        return h('button', {
          class: 'custom-model-selector',
          attrs: { type: 'button', 'data-selected-id': this.selectedId },
          on: {
            click: () => this.$emit('select', { id: 'user-2', name: 'Bob' }, 'manual')
          }
        }, this.selectedId)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ ownerId: 'user-1' }],
      columns: [{
        label: '负责人',
        formItems: [{
          fieldKey: 'ownerId',
          type: 'component',
          component: {
            renderer: UserSelector,
            model: {
              prop: 'selectedId',
              event: 'select',
              valueFromEvent: (...args) => (args[0] as { id: string }).id
            },
            listeners: { select: selectionListener }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.custom-model-selector').attributes('data-selected-id')).toBe('user-1')
    await wrapper.find('.custom-model-selector').trigger('click')

    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ ownerId: 'user-2' }])
    expect(selectionListener).toHaveBeenCalledTimes(1)
    expect(selectionListener.mock.calls[0][0]).toMatchObject({
      fieldKey: 'ownerId',
      value: 'user-1'
    })
    expect(selectionListener.mock.calls[0].slice(1)).toEqual([
      { id: 'user-2', name: 'Bob' },
      'manual'
    ])
    wrapper.destroy()
  })

  it('does not inject model props or listeners when model is false', async () => {
    const DisplayOnlyField = {
      inheritAttrs: false,
      props: ['status'],
      render(this: any, h: any) {
        return h('span', {
          class: 'display-only-field',
          attrs: {
            'data-status': this.status,
            'data-has-value': String(Object.prototype.hasOwnProperty.call(this.$attrs, 'value')),
            'data-has-input': String(Boolean(this.$listeners.input))
          }
        }, this.status)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ status: 'approved' }],
      columns: [{
        label: '状态',
        formItems: [{
          fieldKey: 'status',
          type: 'component',
          component: {
            renderer: DisplayOnlyField,
            model: false,
            props: ({ value }) => ({ status: value })
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const field = wrapper.find('.display-only-field')
    expect(field.attributes('data-status')).toBe('approved')
    expect(field.attributes('data-has-value')).toBe('false')
    expect(field.attributes('data-has-input')).toBe('false')
    expect(wrapper.emitted('update:tableData')).toBeUndefined()
    wrapper.destroy()
  })

  it('keeps radio and checkbox option children through the functional renderer', async () => {
    const options = [
      { label: '选项 A', value: 'a' },
      { label: '选项 B', value: 'b' }
    ]
    const wrapper = mountFormTable({
      tableData: [{ choice: 'a', checked: ['b'] }],
      columns: [{
        label: '选项字段',
        formItems: [{
            fieldKey: 'choice',
            type: 'radio',
            component: { options }
          },
          {
            fieldKey: 'checked',
            type: 'checkbox',
            component: { options }
          }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.el-radio')).toHaveLength(2)
    expect(wrapper.findAll('.el-checkbox')).toHaveLength(2)
    expect(wrapper.text()).toContain('选项 A')
    expect(wrapper.text()).toContain('选项 B')
    wrapper.destroy()
  })

  it('keeps keyed field instances stable when items are reordered', async () => {
    let nextInstanceId = 0
    const StatefulField = {
      props: ['value', 'marker'],
      data() {
        return { instanceId: ++nextInstanceId }
      },
      render(this: any, h: any) {
        return h('span', { class: 'stateful-field' }, `${this.marker}:${this.instanceId}`)
      }
    }
    const createItem = (key: string, marker: string) => ({
      key,
      fieldKey: 'name',
      type: 'component' as const,
      component: { renderer: StatefulField, props: { marker } }
    })
    const first = createItem('first-name', 'A')
    const second = createItem('second-name', 'B')
    const createColumns = (formItems: FormItemConfig[]): ColumnConfig[] => [{
      label: '稳定字段身份',
      formItems
    }]
    const wrapper = mountFormTable({ columns: createColumns([first, second]) })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.stateful-field').wrappers.map(node => node.text())).toEqual(['A:1', 'B:2'])
    await wrapper.setProps({ columns: createColumns([second, first]) })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.stateful-field').wrappers.map(node => node.text())).toEqual(['B:2', 'A:1'])
    wrapper.destroy()
  })

  it('keeps column content aligned when configs are reordered', async () => {
    let nextInstanceId = 0
    const StatefulField = {
      props: ['marker'],
      data() {
        return { instanceId: ++nextInstanceId }
      },
      render(this: any, h: any) {
        return h('span', { class: 'dynamic-structure-field' }, `${this.marker}:${this.instanceId}`)
      }
    }
    const createItem = (key: string, marker: string): FormItemConfig => ({
      key,
      fieldKey: marker,
      type: 'component',
      component: { renderer: StatefulField, props: { marker } }
    })
    const firstColumn: ColumnConfig = {
      key: 'first-column',
      label: '第一列',
      formItems: [createItem('column-a', 'column-a')]
    }
    const secondColumn: ColumnConfig = {
      key: 'second-column',
      label: '第二列',
      formItems: [createItem('column-b', 'column-b')]
    }
    const columnWrapper = mountFormTable({
      tableData: [{ 'column-a': '', 'column-b': '' }],
      columns: [firstColumn, secondColumn]
    })
    await columnWrapper.vm.$nextTick()
    expect(columnWrapper.findAll('.dynamic-structure-field').wrappers.map(node => node.text()))
      .toEqual(['column-a:1', 'column-b:2'])
    await columnWrapper.setProps({ columns: [secondColumn, firstColumn] })
    await columnWrapper.vm.$nextTick()
    const reorderedColumns = columnWrapper.findAll('.dynamic-structure-field').wrappers.map(node => node.text())
    expect(reorderedColumns.map(text => text.split(':')[0])).toEqual(['column-b', 'column-a'])
    expect(new Set(reorderedColumns.map(text => text.split(':')[1])).size).toBe(2)
    columnWrapper.destroy()
  })

  it('preserves uniquely keyed columns unless their relative order changes', async () => {
    let nextInstanceId = 0
    const StatefulColumnField = {
      props: ['marker'],
      data() {
        return { instanceId: ++nextInstanceId }
      },
      render(this: any, h: any) {
        return h('span', { class: 'stable-column-field' }, `${this.marker}:${this.instanceId}`)
      }
    }
    const createColumn = (key: string, marker: string): ColumnConfig => ({
      key,
      label: marker,
      formItems: [{
        key: `${key}-field`,
        fieldKey: marker,
        type: 'component',
        component: { renderer: StatefulColumnField, props: { marker } }
      }]
    })
    const first = createColumn('column-a', 'a')
    const second = createColumn('column-b', 'b')
    const third = createColumn('column-c', 'c')
    const wrapper = mountFormTable({
      tableData: [{ a: '', b: '', c: '' }],
      columns: [first, second, third]
    })
    const readFields = () => wrapper.findAll('.stable-column-field').wrappers.map(node => node.text())
    const readColumnInstances = () => Object.fromEntries(
      wrapper.findAllComponents(FormTableColumn as any).wrappers.map(component => [
        (component.props('column') as ColumnConfig).key,
        (component.vm as any)._uid
      ])
    )
    await wrapper.vm.$nextTick()
    expect(readFields()).toEqual(['a:1', 'b:2', 'c:3'])
    const initialColumnInstances = readColumnInstances()

    // 删除中间列时，共同列的相对顺序不变，a/c 列包装实例应保留。
    await wrapper.setProps({ columns: [first, third] })
    await wrapper.vm.$nextTick()
    expect(readFields().map(text => text.split(':')[0])).toEqual(['a', 'c'])
    expect(readColumnInstances()).toEqual({
      'column-a': initialColumnInstances['column-a'],
      'column-c': initialColumnInstances['column-c']
    })

    // 插回中间列时只创建 b 列包装，a/c 列包装继续保留。
    await wrapper.setProps({ columns: [first, second, third] })
    await wrapper.vm.$nextTick()
    expect(readFields().map(text => text.split(':')[0])).toEqual(['a', 'b', 'c'])
    const reinsertedColumnInstances = readColumnInstances()
    expect(reinsertedColumnInstances['column-a']).toBe(initialColumnInstances['column-a'])
    expect(reinsertedColumnInstances['column-c']).toBe(initialColumnInstances['column-c'])
    expect(reinsertedColumnInstances['column-b']).not.toBe(initialColumnInstances['column-b'])

    // 同 key、同顺序的新配置对象不会重建列包装实例。
    await wrapper.setProps({
      columns: [
        createColumn('column-a', 'a'),
        createColumn('column-b', 'b'),
        createColumn('column-c', 'c')
      ]
    })
    await wrapper.vm.$nextTick()
    expect(readFields().map(text => text.split(':')[0])).toEqual(['a', 'b', 'c'])
    expect(readColumnInstances()).toEqual(reinsertedColumnInstances)

    // 已有列相对顺序改变时整体换代，让 Element UI 按新顺序重新注册。
    await wrapper.setProps({ columns: [third, first, second] })
    await wrapper.vm.$nextTick()
    const reordered = readFields()
    expect(reordered.map(text => text.split(':')[0])).toEqual(['c', 'a', 'b'])
    const reorderedColumnInstances = readColumnInstances()
    expect(Object.keys(reorderedColumnInstances)).toEqual(expect.arrayContaining([
      'column-a',
      'column-b',
      'column-c'
    ]))
    expect(Object.entries(reorderedColumnInstances).every(([key, uid]) => (
      uid !== reinsertedColumnInstances[key]
    ))).toBe(true)
    wrapper.destroy()
  })

  it('preserves unaffected keyed column wrappers across dynamic visibility changes', async () => {
    const visibility = { showSecond: true }
    const createColumn = (key: string, visible?: () => boolean): ColumnConfig => ({
      key,
      label: key,
      visible,
      formItems: [{ fieldKey: key, type: 'text' }]
    })
    const first = createColumn('first')
    const second = createColumn('second', () => visibility.showSecond)
    const third = createColumn('third')
    const wrapper = mountFormTable({
      tableData: [{ first: 'A', second: 'B', third: 'C' }],
      columns: [first, second, third]
    })
    const readColumnInstances = () => Object.fromEntries(
      wrapper.findAllComponents(FormTableColumn as any).wrappers.map(component => [
        (component.props('column') as ColumnConfig).key,
        (component.vm as any)._uid
      ])
    )
    await wrapper.vm.$nextTick()
    const initialInstances = readColumnInstances()

    visibility.showSecond = false
    await wrapper.setProps({ columns: [...wrapper.props('columns')] })
    await wrapper.vm.$nextTick()
    expect(readColumnInstances()).toEqual({
      first: initialInstances.first,
      third: initialInstances.third
    })

    visibility.showSecond = true
    await wrapper.setProps({ columns: [...wrapper.props('columns')] })
    await wrapper.vm.$nextTick()
    const restoredInstances = readColumnInstances()
    expect(restoredInstances.first).toBe(initialInstances.first)
    expect(restoredInstances.third).toBe(initialInstances.third)
    expect(restoredInstances.second).not.toBe(initialInstances.second)
    wrapper.destroy()
  })

  it('reacts to dynamic column and item visibility changes', async () => {
    const state = { showColumn: true, showItem: true }
    const createColumns = (): ColumnConfig[] => [{
      key: 'dynamic-column',
      label: '动态列',
      visible: () => state.showColumn,
      formItems: [{
        key: 'dynamic-item',
        fieldKey: 'name',
        type: 'input',
        visible: () => state.showItem
      }]
    }]
    const wrapper = mountFormTable({ columns: createColumns() })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('input').exists()).toBe(true)

    state.showItem = false
    await wrapper.setProps({ columns: createColumns() })
    expect(wrapper.find('input').exists()).toBe(false)
    state.showItem = true
    state.showColumn = false
    await wrapper.setProps({ columns: createColumns() })
    expect(wrapper.text()).not.toContain('动态列')
    wrapper.destroy()
  })

  it('resolves dynamic visibility and options from row context', async () => {
    const columnVisible = vi.fn((_context: FormTableColumnContext) => true)
    const rowProps = vi.fn((_context: FormTableRowContext) => ({ gutter: 8 }))
    const fieldVisible = vi.fn(({ row }: FormTableFieldRenderContext) => row.province === 'zhejiang')
    const fieldOptions = vi.fn(({ row }: FormTableFieldRenderContext) => row.province === 'zhejiang'
      ? [{ label: '杭州', value: 'hangzhou' }]
      : [])
    const columns: ColumnConfig[] = [{
      label: '地区',
      visible: columnVisible,
      rowProps,
      formItems: [
          {
            fieldKey: 'province',
            type: 'select',
            colProps: { span: 12 },
            component: {
              options: [{ label: '浙江', value: 'zhejiang' }]
            }
          },
          {
            fieldKey: 'city',
            type: 'select',
            visible: fieldVisible,
            colProps: { span: 12 },
            component: {
              options: fieldOptions
            }
          }
      ]
    }]
    const wrapper = mountFormTable({
      tableData: [{ province: 'zhejiang', city: 'hangzhou' }],
      columns
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.el-select')).toHaveLength(2)
    expect(Object.keys(columnVisible.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'tableData'
    ])
    expect(Object.keys(rowProps.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'index',
      'row',
      'tableData'
    ])
    expect(Object.keys(fieldVisible.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'fieldKey',
      'index',
      'itemConfig',
      'row',
      'tableData',
      'value'
    ])
    expect(Object.keys(fieldOptions.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'fieldKey',
      'index',
      'itemConfig',
      'row',
      'tableData',
      'value'
    ])
    wrapper.destroy()
  })
})
