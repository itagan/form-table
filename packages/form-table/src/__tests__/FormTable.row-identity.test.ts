import Vue from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { ColumnConfig, TableRow } from '../types.public'
import { localVue, mountFormTable } from './test-utils'

describe('FormTable row identity updates', () => {
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
        formItems: [{
          fieldKey: 'name',
          type: 'slot',
          component: { slot: 'indexed-compose-update' }
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
        formItems: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            is: CaptureField,
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
        formItems: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            is: CaptureField,
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
        formItems: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            is: CaptureField,
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
        formItems: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            is: CaptureField,
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
        formItems: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            is: CaptureField,
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
      formItems: [{
        key,
        fieldKey,
        type: 'component',
        component: {
          is: CaptureField,
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
        formItems: [{
          fieldKey: 'name',
          type: 'component',
          component: {
            is: CaptureField,
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
