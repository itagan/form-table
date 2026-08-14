import { mount } from '@vue/test-utils'
import Vue from 'vue'
import { describe, expect, it, vi } from 'vitest'
import FormTable from '../index.vue'
import type {
  ColumnConfig,
  FormTableFieldRenderContext,
  FormTableRowContext,
  TableRow
} from '../types.public'
import { inputColumns, localVue, mountFormTable } from './test-utils'

describe('FormTable data updates and row identity', () => {
  it('supports Vue 2 v-model through the tableData update contract', async () => {
    const wrapper = mount({
      components: { FormTable },
      data: () => ({
        tableData: [{ name: 'Alice' }],
        columns: inputColumns
      }),
      template: '<FormTable v-model="tableData" :columns="columns" />'
    }, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    await wrapper.find('input').setValue('Bob')

    expect((wrapper.vm as any).tableData).toEqual([{ name: 'Bob' }])
    const formTable = wrapper.findComponent(FormTable as any)
    expect(formTable.emitted('update:tableData')?.[0]?.[0]).toEqual([{ name: 'Bob' }])
    expect(formTable.emitted('input')).toBeUndefined()
    wrapper.destroy()
  })

  it('keeps tableData.sync as a compatible binding syntax', async () => {
    const wrapper = mount({
      components: { FormTable },
      data: () => ({
        tableData: [{ name: 'Alice' }],
        columns: inputColumns
      }),
      template: '<FormTable :table-data.sync="tableData" :columns="columns" />'
    }, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    await wrapper.find('input').setValue('Bob')

    expect((wrapper.vm as any).tableData).toEqual([{ name: 'Bob' }])
    wrapper.destroy()
  })

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

  it('keeps unrelated row references when editing a large data set', async () => {
    const rowCount = 300
    const targetIndex = 150
    const original = Array.from({ length: rowCount }, (_, index) => ({
      id: index + 1,
      name: `User ${index + 1}`
    }))
    const wrapper = mountFormTable({ tableData: original })
    await wrapper.vm.$nextTick()

    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBe(rowCount)
    await inputs.at(targetIndex).setValue('Updated User')

    const nextTableData = wrapper.emitted('update:tableData')?.[0]?.[0] as TableRow[]
    expect(nextTableData).toHaveLength(rowCount)
    expect(nextTableData[targetIndex]).toEqual({ id: targetIndex + 1, name: 'Updated User' })
    expect(nextTableData[targetIndex]).not.toBe(original[targetIndex])
    expect(nextTableData[targetIndex - 1]).toBe(original[targetIndex - 1])
    expect(nextTableData[targetIndex + 1]).toBe(original[targetIndex + 1])
    expect(original[targetIndex].name).toBe(`User ${targetIndex + 1}`)
    wrapper.destroy()
  })

  it('only invalidates dynamic callbacks that read changed reactive data', async () => {
    const rowCount = 300
    const targetIndex = 150
    const rowPropsResolver = vi.fn(({ row }: FormTableRowContext) => ({
      gutter: row.id === 1 ? 0 : 2
    }))
    const componentPropsResolver = vi.fn(({ row, tableData }: FormTableFieldRenderContext) => ({
      placeholder: `${row.name}-${tableData[0]?.name}`
    }))
    const wrapper = mount({
      components: { FormTable },
      data: () => ({
        tableData: Array.from({ length: rowCount }, (_, index) => ({
          id: index + 1,
          name: `User ${index + 1}`
        })),
        columns: [{
          key: 'name-column',
          label: '姓名',
          rowProps: rowPropsResolver,
          children: [{
            key: 'name-item',
            fieldKey: 'name',
            type: 'input',
            component: { props: componentPropsResolver }
          }]
        }] as ColumnConfig[]
      }),
      template: '<FormTable v-model="tableData" :columns="columns" row-key="id" />'
    }, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    expect(rowPropsResolver).toHaveBeenCalledTimes(rowCount)
    expect(componentPropsResolver).toHaveBeenCalledTimes(rowCount)

    await wrapper.findAll('input').at(targetIndex).setValue('Updated User')
    await wrapper.vm.$nextTick()

    // 只读取当前 row 的回调仅重新计算目标行。
    expect(rowPropsResolver).toHaveBeenCalledTimes(rowCount + 1)
    // 显式读取 tableData 的回调会为全部行重新计算。
    expect(componentPropsResolver).toHaveBeenCalledTimes(rowCount * 2)
    wrapper.destroy()
  })

  it('keeps nested field paths working', async () => {
    const wrapper = mountFormTable({
      tableData: [{ profile: { city: '杭州' } }],
      columns: [{
        label: '城市',
        children: [{ fieldKey: 'profile.city', type: 'input' }]
      }]
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('input').setValue('宁波')

    expect(wrapper.emitted('update:tableData')?.[0]?.[0]).toEqual([
      { profile: { city: '宁波' } }
    ])
    wrapper.destroy()
  })

  it('applies updateRow patches immutably and emits one change per field', async () => {
    const original = [{ name: 'Alice', profile: { city: '杭州' } }]
    const wrapper = mountFormTable({
      tableData: original,
      columns: [{
        label: '批量更新',
        children: [{
          fieldKey: 'name',
          type: 'slot',
          component: { renderer: 'batch-update' }
        }]
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
        children: [{
          fieldKey: 'name',
          type: 'slot',
          component: { renderer: 'compose-update' }
        }]
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

  it('reuses the rowKey index during consecutive synchronous updates', async () => {
    const rowCount = 20
    const rowKey = vi.fn((row: TableRow) => row.id)
    const wrapper = mountFormTable({
      tableData: Array.from({ length: rowCount }, (_, index) => ({
        id: index + 1,
        name: `User ${index + 1}`,
        touched: false
      })),
      rowKey,
      columns: [{
        label: '连续更新',
        children: [{
          fieldKey: 'name',
          type: 'slot',
          component: { renderer: 'indexed-compose-update' }
        }]
      }],
      scopedSlots: {
        'indexed-compose-update': `
          <button
            v-if="props.index === 0"
            type="button"
            class="indexed-compose-update"
            @click="props.setValue('Updated'); props.updateRow({ touched: true })"
          >更新</button>
        `
      }
    })
    await wrapper.vm.$nextTick()
    rowKey.mockClear()

    await wrapper.find('.indexed-compose-update').trigger('click')

    expect(rowKey.mock.calls.length).toBeLessThan(rowCount * 2)
    const updates = wrapper.emitted('update:tableData') || []
    expect(updates[1]?.[0]?.[0]).toEqual({ id: 1, name: 'Updated', touched: true })
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
        children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: context => contexts.push(context) }
          }
        }]
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
    const previousWarnHandler = localVue.config.warnHandler
    const previousGlobalWarnHandler = Vue.config.warnHandler
    localVue.config.warnHandler = () => undefined
    Vue.config.warnHandler = () => undefined
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
      rowKey: 'id',
      columns: [{
        label: '姓名',
        children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: context => { savedContext = context } }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()
    localVue.config.warnHandler = previousWarnHandler
    Vue.config.warnHandler = previousGlobalWarnHandler
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
      rowKey: 'id',
      columns: [{
        label: '姓名',
        children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: captureContext }
          }
        }]
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
        children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: context => { savedContext = context } }
          }
        }]
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
      rowKey,
      columns: [{
        label: '姓名',
        children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: context => { savedContext = context } }
          }
        }]
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
      children: [{
        key,
        fieldKey,
        type: 'component',
        component: {
          renderer: CaptureField,
          listeners: { capture: context => { savedContext = context } }
        }
      }]
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
      rowKey: 'id',
      columns: [{
        label: '姓名',
        children: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            renderer: CaptureField,
            listeners: { capture: context => { savedContext = context } }
          }
        }]
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
})
