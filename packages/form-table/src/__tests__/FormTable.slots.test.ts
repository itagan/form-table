import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FormTable from '../index.vue'
import type {
  FormTableColumnContext,
  FormTableFieldRenderContext
} from '../types.public'
import { localVue, mountFormTable } from './test-utils'

describe('FormTable slot rendering', () => {
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

  it('renders a cellSlot column without field wrappers or a virtual fieldKey', async () => {
    const original = [{ id: 1, name: 'Alice', enabled: true }]
    const wrapper = mountFormTable({
      tableData: original,
      columns: [{
        key: 'actions-column',
        label: '操作',
        cellSlot: 'row-actions',
        props: { width: 120, align: 'center' }
      }],
      scopedSlots: {
        'row-actions': `<button
          type="button"
          class="cell-slot-action"
          :data-index="props.index"
          :data-column-key="props.columnConfig.key"
          @click="props.updateRow({ enabled: !props.row.enabled })"
        >{{ props.row.name }}|{{ props.fieldKey === undefined }}|{{ props.propPath === undefined }}</button>`
      }
    })
    await wrapper.vm.$nextTick()

    const button = wrapper.find('.cell-slot-action')
    expect(button.text()).toBe('Alice|true|true')
    expect(button.attributes('data-index')).toBe('0')
    expect(button.attributes('data-column-key')).toBe('actions-column')
    expect(wrapper.find('.el-form-item').exists()).toBe(false)
    expect(wrapper.find('.el-row').exists()).toBe(false)
    expect(wrapper.find('.el-col').exists()).toBe(false)

    await button.trigger('click')
    expect(original).toEqual([{ id: 1, name: 'Alice', enabled: true }])
    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { id: 1, name: 'Alice', enabled: false }
    ])
    expect(wrapper.emitted('field-change')?.[0]?.[0]).toMatchObject({
      fieldKey: 'enabled',
      value: false,
      previousValue: true
    })
    wrapper.destroy()
  })

  it('keeps a cellSlot column empty when its named slot is missing', async () => {
    const wrapper = mountFormTable({
      columns: [{ label: '操作', cellSlot: 'missing-actions' }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('操作')
    expect(wrapper.text()).not.toContain('Alice')
    expect(wrapper.find('.el-form-item').exists()).toBe(false)
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
              hint: '多根内容',
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
    expect(wrapper.find('.el-form-item').attributes('title')).toBe('多根内容')
    wrapper.destroy()
  })

  it('exposes columnConfig to the header slot without a column alias', async () => {
    const headerProps = vi.fn(({ tableData }: FormTableColumnContext) => ({
      class: `resolved-header-${tableData.length}`,
      'aria-label': '学校说明'
    }))
    const headerHint = vi.fn(({ columnConfig }: FormTableColumnContext) => (
      `${columnConfig.label}完整说明`
    ))
    const wrapper = mountFormTable({
      columns: [{
        key: 'school-column',
        label: '学校',
        headerSlot: 'school-header',
        headerHint,
        headerProps,
        children: [{ children: [{ fieldKey: 'name', type: 'input' }] }]
      }],
      scopedSlots: {
        'school-header': `
          <span
            class="school-header"
            v-bind="props.header.props"
            :title="props.header.hint"
          >
            {{ props.columnConfig.key }}|{{ props.column === undefined }}
          </span>
        `
      }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.school-header').text()).toBe('school-column|true')
    expect(wrapper.find('.school-header').classes()).toContain('resolved-header-1')
    expect(wrapper.find('.school-header').attributes('aria-label')).toBe('学校说明')
    expect(wrapper.find('.school-header').attributes('title')).toBe('学校完整说明')
    expect(wrapper.find('.form-table-column-header').exists()).toBe(false)
    expect(headerProps).toHaveBeenCalledTimes(1)
    expect(headerHint).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })
})

