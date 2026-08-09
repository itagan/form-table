import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import { describe, expect, it, vi } from 'vitest'
import FormTableColumn from '../FormTableColumn.vue'
import FormTable from '../index.vue'
import type {
  ColumnConfig,
  FormItemConfig,
  FormTableColumnContext,
  FormTableFieldRenderContext,
  FormTableExpose,
  FormTableRowContext,
  TableRow
} from '../types.public'

const localVue = createLocalVue()
localVue.use(ElementUI)

const inputColumns: ColumnConfig[] = [
  {
    label: '姓名',
    children: [
      {
        children: [
          {
            fieldKey: 'name',
            type: 'input',
            component: {
              props: { placeholder: '请输入姓名' }
            }
          }
        ]
      }
    ]
  }
]

function mountFormTable(options: {
  tableData?: TableRow[]
  columns?: ColumnConfig[]
  tableProps?: Record<string, any>
  scopedSlots?: Record<string, any>
  listeners?: Record<string, (...args: any[]) => void>
} = {}) {
  return mount(FormTable as any, {
    localVue,
    propsData: {
      tableData: options.tableData || [{ name: 'Alice' }],
      columns: options.columns || inputColumns,
      formProps: { size: 'small' },
      tableProps: { border: true, ...options.tableProps }
    },
    scopedSlots: options.scopedSlots,
    listeners: options.listeners,
    attachTo: document.body
  })
}

describe('FormTable core behavior', () => {
  it('renders a type field and emits immutable field updates', async () => {
    const original = [{ name: 'Alice' }]
    const wrapper = mountFormTable({ tableData: original })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('姓名')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Alice')
    await wrapper.find('input').setValue('Bob')

    expect(original).toEqual([{ name: 'Alice' }])
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ name: 'Bob' }])
    expect(wrapper.emitted('field-change')?.[0]?.[0]).toEqual({
      row: { name: 'Bob' },
      index: 0,
      fieldKey: 'name',
      value: 'Bob',
      previousValue: 'Alice'
    })
    wrapper.destroy()
  })

  it('keeps nested field paths working', async () => {
    const wrapper = mountFormTable({
      tableData: [{ profile: { city: '杭州' } }],
      columns: [{
        label: '城市',
        children: [{ children: [{ fieldKey: 'profile.city', type: 'input' }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('input').setValue('宁波')

    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { profile: { city: '宁波' } }
    ])
    wrapper.destroy()
  })

  it('renders a named slot and exposes focused update helpers', async () => {
    const componentPropsResolver = vi.fn(({ row }: FormTableFieldRenderContext) => ({
      suffix: row.school === '一中' ? '（当前）' : ''
    }))
    const slotListener = vi.fn()
    const wrapper = mountFormTable({
      tableData: [{ school: '一中' }],
      columns: [{
        label: '学校',
        children: [{ children: [{
          fieldKey: 'school',
          type: 'slot',
          component: {
            renderer: 'school',
            props: componentPropsResolver,
            options: [{ label: '校区配置', value: 'campus' }],
            listeners: { commit: slotListener }
          }
        }] }]
      }],
      scopedSlots: {
        school: `<button
          type="button"
          class="slot-setter"
          @click="props.setValue('二中'); props.component.listeners.commit('saved')"
        >{{ props.value }}{{ props.component.props.suffix }}{{ props.component.options[0].label }}</button>`
      }
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.slot-setter').text()).toBe('一中（当前）校区配置')
    expect(componentPropsResolver).toHaveBeenCalledTimes(1)
    expect(Object.keys(componentPropsResolver.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'fieldKey',
      'index',
      'itemConfig',
      'row',
      'rowConfig',
      'tableData',
      'value'
    ])
    await wrapper.find('.slot-setter').trigger('click')
    expect(slotListener).toHaveBeenCalledTimes(1)
    expect(slotListener.mock.calls[0][0]).toMatchObject({
      row: { school: '一中' },
      fieldKey: 'school',
      value: '一中'
    })
    expect(slotListener.mock.calls[0][1]).toBe('saved')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ school: '二中' }])
    wrapper.destroy()
  })

  it('renders native, component, multiple-root, and empty slots without wrapper elements', async () => {
    localVue.component('transparent-slot-root', {
      props: ['value'],
      render(this: any, h: any) {
        return h('section', { class: 'transparent-component' }, this.value)
      }
    })
    const wrapper = mountFormTable({
      tableData: [{ native: '文本', component: '组件', empty: '', missing: '' }],
      columns: [{
        label: '透明 Slot',
        children: [{ children: [
          {
            fieldKey: 'native',
            type: 'slot',
            component: { renderer: 'native-slot' }
          },
          {
            fieldKey: 'component',
            type: 'slot',
            component: { renderer: 'component-slot' }
          },
          {
            fieldKey: 'empty',
            type: 'slot',
            component: { renderer: 'empty-slot' }
          },
          {
            fieldKey: 'missing',
            type: 'slot',
            component: { renderer: 'missing-slot' }
          }
        ] }]
      }],
      scopedSlots: {
        'native-slot': '<span class="transparent-native">{{ props.value }}</span>',
        'component-slot': '<transparent-slot-root :value="props.value" />',
        'empty-slot': () => []
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.transparent-native').text()).toBe('文本')
    expect(wrapper.find('.transparent-component').text()).toBe('组件')
    expect(wrapper.find('.should-not-render').exists()).toBe(false)
    expect(wrapper.findAll('.el-form-item')).toHaveLength(4)
    expect(wrapper.find('.form-table-slot').exists()).toBe(false)
    wrapper.destroy()
  })

  it('renders every root from a template scoped slot without a wrapper element', async () => {
    const Host = localVue.extend({
      components: { FormTable },
      data() {
        return {
          tableData: [{ multiple: '' }],
          columns: [{
            label: '多根 Slot',
            children: [{ children: [{
              fieldKey: 'multiple',
              type: 'slot',
              component: { renderer: 'multiple-slot' }
            }] }]
          }]
        }
      },
      template: `
        <FormTable :table-data="tableData" :columns="columns">
          <template #multiple-slot>
            <span class="transparent-first">A</span>
            <span class="transparent-second">B</span>
          </template>
        </FormTable>
      `
    })
    const wrapper = mount(Host, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.transparent-first').exists()).toBe(true)
    expect(wrapper.find('.transparent-second').exists()).toBe(true)
    expect(wrapper.find('.form-table-slot').exists()).toBe(false)
    wrapper.destroy()
  })

  it('exposes columnConfig to the header slot without a column alias', async () => {
    const wrapper = mountFormTable({
      columns: [{
        key: 'school-column',
        label: '学校',
        headerSlot: 'school-header',
        children: [{ children: [{ fieldKey: 'name', type: 'input' }] }]
      }],
      scopedSlots: {
        'school-header': `
          <span class="school-header">
            {{ props.columnConfig.key }}|{{ props.column === undefined }}
          </span>
        `
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.school-header').text()).toBe('school-column|true')
    expect(wrapper.find('.form-table-column-header').exists()).toBe(false)
    wrapper.destroy()
  })

  it('renders the field value when an untyped config has no renderer', async () => {
    const wrapper = mountFormTable({
      tableData: [{ summary: '只读内容' }],
      columns: [{
        label: '默认展示',
        children: [{ children: [{ fieldKey: 'summary' } as any] }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('只读内容')
    wrapper.destroy()
  })

  it('renders a directly supplied component and wraps its listeners', async () => {
    const listener = vi.fn((context) => context.setValue('disabled'))
    const componentProps = vi.fn(() => ({ marker: 'status' }))
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
        children: [{
          children: [{
            fieldKey: 'status',
            type: 'component',
            component: {
              renderer: StatusInput,
              props: componentProps,
              listeners: { commit: listener }
            }
          }]
        }]
      }]
    })
    await wrapper.vm.$nextTick()
    expect(componentProps).toHaveBeenCalledTimes(1)
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
      'rowConfig',
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
        children: [{ children: [{
          fieldKey: 'detail',
          type: 'component',
          component: { resolveRenderer }
        }] }]
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
        children: [{ children: [{
          fieldKey: 'detail',
          type: 'component',
          component: {
            renderer: DefaultEditor,
            resolveRenderer: () => undefined
          }
        }] }]
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
        children: [{ children: [{
          fieldKey: 'detail',
          type: 'component',
          component: { resolveRenderer: () => undefined }
        }] }]
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
        children: [{ children: [{
          fieldKey: 'enabled',
          type: 'component',
          component: { renderer: DeclaredModelSwitch }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.declared-model-switch').text()).toBe('true')
    await wrapper.find('.declared-model-switch').trigger('click')
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([{ enabled: false }])
    wrapper.destroy()
  })

  it('treats model true as the component native Vue 2 model', async () => {
    const DeclaredModelSwitch = {
      model: { prop: 'checked', event: 'toggle' },
      props: ['checked'],
      render(this: any, h: any) {
        return h('button', {
          class: 'explicit-default-model-switch',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('toggle', !this.checked) }
        }, String(this.checked))
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ enabled: true }],
      columns: [{
        label: '启用',
        children: [{ children: [{
          fieldKey: 'enabled',
          type: 'component',
          component: {
            renderer: DeclaredModelSwitch,
            model: true
          }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.explicit-default-model-switch').text()).toBe('true')
    await wrapper.find('.explicit-default-model-switch').trigger('click')
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
        children: [{ children: [{
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
        }] }]
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
        children: [{ children: [{
          fieldKey: 'status',
          type: 'component',
          component: {
            renderer: DisplayOnlyField,
            model: false,
            props: ({ value }) => ({ status: value })
          }
        }] }]
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
        children: [{ children: [
          {
            fieldKey: 'choice',
            type: 'radio',
            component: { options }
          },
          {
            fieldKey: 'checked',
            type: 'checkbox',
            component: { options }
          }
        ] }]
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
    const createColumns = (children: FormItemConfig[]): ColumnConfig[] => [{
      label: '稳定字段身份',
      children: [{ children }]
    }]
    const wrapper = mountFormTable({ columns: createColumns([first, second]) })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.stateful-field').wrappers.map(node => node.text())).toEqual(['A:1', 'B:2'])
    await wrapper.setProps({ columns: createColumns([second, first]) })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.stateful-field').wrappers.map(node => node.text())).toEqual(['B:2', 'A:1'])
    wrapper.destroy()
  })

  it('keeps keyed row instances and column content aligned when configs are reordered', async () => {
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
    const firstRow = { key: 'first-row', children: [createItem('row-a', 'row-a')] }
    const secondRow = { key: 'second-row', children: [createItem('row-b', 'row-b')] }
    const rowWrapper = mountFormTable({
      tableData: [{ 'row-a': '', 'row-b': '' }],
      columns: [{ key: 'rows', label: '布局行', children: [firstRow, secondRow] }]
    })
    await rowWrapper.vm.$nextTick()
    expect(rowWrapper.findAll('.dynamic-structure-field').wrappers.map(node => node.text()))
      .toEqual(['row-a:1', 'row-b:2'])
    await rowWrapper.setProps({
      columns: [{ key: 'rows', label: '布局行', children: [secondRow, firstRow] }]
    })
    await rowWrapper.vm.$nextTick()
    expect(rowWrapper.findAll('.dynamic-structure-field').wrappers.map(node => node.text()))
      .toEqual(['row-b:2', 'row-a:1'])
    rowWrapper.destroy()

    nextInstanceId = 0
    const firstColumn: ColumnConfig = {
      key: 'first-column',
      label: '第一列',
      children: [{ key: 'first-layout', children: [createItem('column-a', 'column-a')] }]
    }
    const secondColumn: ColumnConfig = {
      key: 'second-column',
      label: '第二列',
      children: [{ key: 'second-layout', children: [createItem('column-b', 'column-b')] }]
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
      children: [{
        key: `${key}-layout`,
        children: [{
          key: `${key}-field`,
          fieldKey: marker,
          type: 'component',
          component: { renderer: StatefulColumnField, props: { marker } }
        }]
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
      children: [{ children: [{ fieldKey: key, type: 'text' }] }]
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

  it('reacts to dynamic column, row, and item visibility changes', async () => {
    const state = { showColumn: true, showRow: true, showItem: true }
    const createColumns = (): ColumnConfig[] => [{
      key: 'dynamic-column',
      label: '动态列',
      visible: () => state.showColumn,
      children: [{
        key: 'dynamic-row',
        visible: () => state.showRow,
        children: [{
          key: 'dynamic-item',
          fieldKey: 'name',
          type: 'input',
          visible: () => state.showItem
        }]
      }]
    }]
    const wrapper = mountFormTable({ columns: createColumns() })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('input').exists()).toBe(true)

    state.showItem = false
    await wrapper.setProps({ columns: createColumns() })
    expect(wrapper.find('input').exists()).toBe(false)
    state.showItem = true
    state.showRow = false
    await wrapper.setProps({ columns: createColumns() })
    expect(wrapper.find('input').exists()).toBe(false)
    state.showRow = true
    state.showColumn = false
    await wrapper.setProps({ columns: createColumns() })
    expect(wrapper.text()).not.toContain('动态列')
    wrapper.destroy()
  })

  it('applies updateRow patches immutably and emits one change per field', async () => {
    const original = [{ name: 'Alice', profile: { city: '杭州' } }]
    const wrapper = mountFormTable({
      tableData: original,
      columns: [{
        label: '批量更新',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          component: { renderer: 'batch-update' }
        }] }]
      }],
      scopedSlots: {
        'batch-update': `
          <button
            type="button"
            class="batch-update"
            @click="props.updateRow({ name: 'Bob', 'profile.city': '宁波' })"
          >更新</button>
        `
      }
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('.batch-update').trigger('click')

    expect(original).toEqual([{ name: 'Alice', profile: { city: '杭州' } }])
    expect(wrapper.emitted('update:tableData')).toHaveLength(1)
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { name: 'Bob', profile: { city: '宁波' } }
    ])
    expect(wrapper.emitted('field-change')?.map(([payload]) => payload)).toEqual([
      {
        row: { name: 'Bob', profile: { city: '宁波' } },
        index: 0,
        fieldKey: 'name',
        value: 'Bob',
        previousValue: 'Alice'
      },
      {
        row: { name: 'Bob', profile: { city: '宁波' } },
        index: 0,
        fieldKey: 'profile.city',
        value: '宁波',
        previousValue: '杭州'
      }
    ])
    wrapper.destroy()
  })

  it('composes consecutive field helpers without losing earlier updates', async () => {
    const original = [{ name: 'Alice', touched: false }]
    const wrapper = mountFormTable({
      tableData: original,
      columns: [{
        label: '连续更新',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'slot',
          component: { renderer: 'compose-update' }
        }] }]
      }],
      scopedSlots: {
        'compose-update': `
          <button
            type="button"
            class="compose-update"
            @click="props.setValue('Bob'); props.updateRow({ touched: true })"
          >更新</button>
        `
      }
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('.compose-update').trigger('click')

    const updates = wrapper.emitted('update:tableData') || []
    expect(updates).toHaveLength(2)
    expect(updates[1]?.[0]).toEqual([{ name: 'Bob', touched: true }])
    expect(original).toEqual([{ name: 'Alice', touched: false }])
    wrapper.destroy()
  })

  it('does not use a stale row index for an unrelated context in the same update chain', async () => {
    const contexts: any[] = []
    const CaptureField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'capture-unkeyed-row',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('capture') }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ name: 'Old row' }],
      columns: [{
        label: '姓名',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: context => contexts.push(context) }
          }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('.capture-unkeyed-row').trigger('click')

    await wrapper.setProps({ tableData: [{ name: 'New row' }] })
    await wrapper.vm.$nextTick()
    await wrapper.find('.capture-unkeyed-row').trigger('click')

    contexts[1].setValue('Updated row')
    contexts[0].updateRow({ name: 'Wrong row' })

    expect(wrapper.emitted('update:tableData')).toEqual([[[{ name: 'Updated row' }]]])
    expect(wrapper.emitted('field-change')).toHaveLength(1)
    wrapper.destroy()
  })

  it('ignores updates when a configured rowKey is duplicated', async () => {
    let savedContext: any
    const CaptureField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'capture-duplicate-key',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('capture') }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [
        { id: 1, name: 'First' },
        { id: 1, name: 'Second' }
      ],
      tableProps: { rowKey: 'id' },
      columns: [{
        label: '姓名',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: context => { savedContext = context } }
          }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.findAll('.capture-duplicate-key').at(0).trigger('click')

    savedContext.setValue('Wrong row')

    expect(wrapper.emitted('update:tableData')).toBeUndefined()
    expect(wrapper.emitted('field-change')).toBeUndefined()
    wrapper.destroy()
  })

  it('updates the original row by rowKey after rows are replaced and reordered', async () => {
    let savedContext: any
    const captureContext = vi.fn((context) => {
      savedContext = context
    })
    const CaptureField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'capture-row-context',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('capture') }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      tableProps: { rowKey: 'id' },
      columns: [{
        label: '姓名',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: captureContext }
          }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.findAll('.capture-row-context').at(0).trigger('click')

    await wrapper.setProps({
      tableData: [
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice' }
      ]
    })
    await wrapper.vm.$nextTick()
    savedContext.setValue('Alicia')

    const updates = wrapper.emitted('update:tableData') || []
    expect(updates[updates.length - 1]?.[0]).toEqual([
      { id: 2, name: 'Bob' },
      { id: 1, name: 'Alicia' }
    ])
    const fieldChanges = wrapper.emitted('field-change') || []
    expect(fieldChanges[fieldChanges.length - 1]?.[0]).toMatchObject({
      index: 1,
      fieldKey: 'name',
      value: 'Alicia'
    })
    wrapper.destroy()
  })

  it('updates a reordered unkeyed row when its object reference is preserved', async () => {
    let savedContext: any
    const first = { name: 'Alice' }
    const second = { name: 'Bob' }
    const CaptureField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'capture-reordered-reference',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('capture') }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [first, second],
      columns: [{
        label: '姓名',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: context => { savedContext = context } }
          }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.findAll('.capture-reordered-reference').at(0).trigger('click')
    await wrapper.setProps({ tableData: [second, first] })
    await wrapper.vm.$nextTick()

    savedContext.setValue('Alicia')

    const updates = wrapper.emitted('update:tableData') || []
    expect(updates[updates.length - 1]?.[0]).toEqual([second, { name: 'Alicia' }])
    wrapper.destroy()
  })

  it.each([
    ['nested rowKey path', 'meta.identity'],
    ['rowKey function', (row: TableRow) => row.meta.identity]
  ])('locates replaced rows using a %s', async (_label, rowKey) => {
    let savedContext: any
    const CaptureField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'capture-key-variant',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('capture') }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [{ meta: { identity: 'a' }, name: 'Alice' }],
      tableProps: { rowKey },
      columns: [{
        label: '姓名',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: context => { savedContext = context } }
          }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('.capture-key-variant').trigger('click')
    await wrapper.setProps({
      tableData: [{ meta: { identity: 'a' }, name: 'Refreshed' }]
    })
    await wrapper.vm.$nextTick()

    savedContext.setValue('Alicia')

    const updates = wrapper.emitted('update:tableData') || []
    expect(updates[updates.length - 1]?.[0]).toEqual([
      { meta: { identity: 'a' }, name: 'Alicia' }
    ])
    wrapper.destroy()
  })

  it('keeps an event context bound to its original field after configs are replaced', async () => {
    let savedContext: any
    const CaptureField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'capture-original-config',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('capture') }
        }, this.value)
      }
    }
    const createColumns = (key: string, fieldKey: string): ColumnConfig[] => [{
      key: 'identity-column',
      label: '身份',
      children: [{ key: 'identity-row', children: [{
        key,
        fieldKey,
        type: 'component',
        component: {
          renderer: CaptureField,
          listeners: { capture: context => { savedContext = context } }
        }
      }] }]
    }]
    const row = { name: 'Alice', alias: 'A' }
    const wrapper = mountFormTable({ tableData: [row], columns: createColumns('name-field', 'name') })
    await wrapper.vm.$nextTick()
    await wrapper.find('.capture-original-config').trigger('click')
    await wrapper.setProps({ columns: createColumns('alias-field', 'alias') })
    await wrapper.vm.$nextTick()

    expect(savedContext.itemConfig.key).toBe('name-field')
    savedContext.setValue('Alicia')

    const updates = wrapper.emitted('update:tableData') || []
    expect(updates[updates.length - 1]?.[0]).toEqual([{ name: 'Alicia', alias: 'A' }])
    wrapper.destroy()
  })

  it('does not update another row when the bound rowKey no longer exists', async () => {
    let savedContext: any
    const CaptureField = {
      props: ['value'],
      render(this: any, h: any) {
        return h('button', {
          class: 'capture-deleted-row',
          attrs: { type: 'button' },
          on: { click: () => this.$emit('capture') }
        }, this.value)
      }
    }
    const wrapper = mountFormTable({
      tableData: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      tableProps: { rowKey: 'id' },
      columns: [{
        label: '姓名',
        children: [{ children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: context => { savedContext = context } }
          }
        }] }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.findAll('.capture-deleted-row').at(0).trigger('click')
    await wrapper.setProps({ tableData: [{ id: 2, name: 'Bob' }] })
    await wrapper.vm.$nextTick()

    savedContext.updateRow({ name: 'Wrong row' })

    expect(wrapper.emitted('update:tableData')).toBeUndefined()
    expect(wrapper.emitted('field-change')).toBeUndefined()
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
      children: [{
        props: rowProps,
        children: [
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
      'rowConfig',
      'tableData'
    ])
    expect(Object.keys(fieldVisible.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'fieldKey',
      'index',
      'itemConfig',
      'row',
      'rowConfig',
      'tableData',
      'value'
    ])
    expect(Object.keys(fieldOptions.mock.calls[0][0]).sort()).toEqual([
      'columnConfig',
      'fieldKey',
      'index',
      'itemConfig',
      'row',
      'rowConfig',
      'tableData',
      'value'
    ])
    wrapper.destroy()
  })

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
    const resetFields = vi.spyOn(expose.getFormRef() as any, 'resetFields')
    expose.resetFields()
    expect(resetFields).toHaveBeenCalledTimes(1)
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
