/* eslint-disable vue/one-component-per-file */
import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FormTable from '../index.vue'
import type { ColumnConfig } from '../types.public'
import { localVue } from './test-utils'

describe('FormTable parent slot closure refresh', () => {
  it('uses the current section after keyed FormTable instances are reused', async () => {
    const sharedActionColumn: ColumnConfig = {
      key: 'actions',
      label: '操作',
      cellSlot: 'row-actions',
      props: { width: 100, fixed: 'right' }
    }

    let sequence = 0
    const makeSection = (type: string) => ({
      type,
      tableData: [{ id: `${type}-${++sequence}` }],
      columns: [sharedActionColumn]
    })

    const Host = Vue.extend({
      components: { FormTable },
      data: () => ({
        sections: [makeSection('hotel'), makeSection('meal')],
        clickedSection: null as null | ReturnType<typeof makeSection>
      }),
      methods: {
        rebuild(this: any) {
          this.sections = [makeSection('hotel'), makeSection('meal')]
        },
        addRow(this: any, section: ReturnType<typeof makeSection>) {
          this.clickedSection = section
          section.tableData = [...section.tableData, { id: `${section.type}-${++sequence}` }]
        }
      },
      template: `
        <div>
          <div v-for="section in sections" :key="section.type">
            <FormTable
              v-model="section.tableData"
              :columns="section.columns"
              row-key="id"
              :table-props="{ border: true }"
            >
              <template #row-actions>
                <button type="button" class="add-row" @click="addRow(section)">+</button>
              </template>
            </FormTable>
          </div>
        </div>
      `
    })

    const wrapper = mount(Host, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    ;(wrapper.vm as any).rebuild()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await wrapper.findAll('.add-row').at(0).trigger('click')
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    expect(vm.clickedSection).toBe(vm.sections[0])
    expect(vm.sections[0].tableData).toHaveLength(2)
    wrapper.destroy()
  })

  it('refreshes header and form item slot closures when shared configs are reused', async () => {
    const sharedColumns: ColumnConfig[] = [{
      key: 'details',
      label: '详情',
      headerSlot: 'details-header',
      formItems: [{
        key: 'name',
        fieldKey: 'name',
        type: 'slot',
        labelSlot: 'name-label',
        errorSlot: 'name-error',
        formItemProps: {
          rules: [{ required: true, message: '请输入名称', trigger: 'change' }]
        },
        component: { slot: 'name-field' }
      }]
    }]

    let sequence = 0
    const makeSection = () => ({
      type: 'hotel',
      marker: `section-${++sequence}`,
      tableData: [{ id: sequence, name: '' }],
      columns: sharedColumns
    })

    const Host = Vue.extend({
      components: { FormTable },
      data: () => ({ sections: [makeSection()] }),
      methods: {
        rebuild(this: any) {
          this.sections = [makeSection()]
        }
      },
      template: `
        <div>
          <div v-for="section in sections" :key="section.type">
            <FormTable
              v-model="section.tableData"
              :columns="section.columns"
              row-key="id"
            >
              <template #details-header>
                <span class="details-header">{{ section.marker }}</span>
              </template>
              <template #name-label>
                <span class="name-label">{{ section.marker }}</span>
              </template>
              <template #name-error="{ error }">
                <span class="name-error">{{ section.marker }}|{{ error }}</span>
              </template>
              <template #name-field>
                <span class="name-field">{{ section.marker }}</span>
              </template>
            </FormTable>
          </div>
        </div>
      `
    })

    const wrapper = mount(Host, { localVue, attachTo: document.body })
    await wrapper.vm.$nextTick()

    ;(wrapper.vm as any).rebuild()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect([
      wrapper.find('.details-header').text(),
      wrapper.find('.name-label').text(),
      wrapper.find('.name-field').text()
    ]).toEqual(['section-2', 'section-2', 'section-2'])

    await expect((wrapper.findComponent(FormTable as any).vm as any).validate()).resolves.toBe(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.name-error').text()).toBe('section-2|请输入名称')
    wrapper.destroy()
  })
})
