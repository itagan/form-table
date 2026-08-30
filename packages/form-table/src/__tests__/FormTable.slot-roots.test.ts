import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FormTable from '../index.vue'
import { localVue, mountFormTable } from './test-utils'

describe('FormTable slot root rendering', () => {
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
        formItems: [{
            fieldKey: 'native',
            type: 'slot',
            component: { slot: 'native-slot' }
          },
          {
            fieldKey: 'component',
            type: 'slot',
            component: { slot: 'component-slot' }
          },
          {
            fieldKey: 'empty',
            type: 'slot',
            component: { slot: 'empty-slot' }
          },
          {
            fieldKey: 'missing',
            type: 'slot',
            component: { slot: 'missing-slot' }
          }]
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
            formItems: [{
              fieldKey: 'multiple',
              type: 'slot',
              hint: '多根内容',
              component: { slot: 'multiple-slot' }
            }]
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

})
