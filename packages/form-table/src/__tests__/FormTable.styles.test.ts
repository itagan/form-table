import { mount } from '@vue/test-utils'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import FormTable from '../index.vue'
import { localVue, mountFormTable } from './test-utils'

describe('FormTable standalone styles', () => {
  const styleSource = fs.readFileSync(path.resolve(process.cwd(), 'src/style.css'), 'utf8')

  it('applies the default layout rules through stable component classes', async () => {
    const wrapper = mountFormTable({
      tableData: [{ name: '' }],
      columns: [{
        label: '姓名',
        formItems: [{ fieldKey: 'name', type: 'input' }]
      }]
    })
    await wrapper.vm.$nextTick()

    const layout = wrapper.find('.form-table-field-layout')
    const formItem = wrapper.find('.form-table-form-item')
    expect(layout.exists()).toBe(true)
    expect(formItem.classes()).toContain('el-form-item')
    expect(styleSource).toContain('.form-table-field-layout')
    expect(styleSource).toContain('flex-wrap: wrap')
    expect(styleSource).toContain('.form-table-container .form-table-form-item')
    expect(styleSource).toContain('margin-bottom: 0')
    wrapper.destroy()
  })

  it('lets rowProps and formItemProps merge classes and override default styles', async () => {
    const wrapper = mountFormTable({
      tableData: [{ name: '' }],
      columns: [{
        label: '姓名',
        rowProps: {
          class: 'business-field-layout',
          style: { flexWrap: 'nowrap' }
        },
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          formItemProps: {
            class: 'business-form-item',
            style: { marginBottom: '12px' }
          }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    const layout = wrapper.find('.form-table-field-layout')
    const formItem = wrapper.find('.form-table-form-item')
    expect(layout.classes()).toContain('business-field-layout')
    expect(formItem.classes()).toContain('business-form-item')
    expect(getComputedStyle(layout.element).flexWrap).toBe('nowrap')
    expect(getComputedStyle(formItem.element).marginBottom).toBe('12px')
    wrapper.destroy()
  })

  it('lets a later business stylesheet override the stable selectors', async () => {
    const style = document.createElement('style')
    style.textContent = `${styleSource}
      .form-table-field-layout.business-field-layout { flex-wrap: nowrap; }
      .form-table-container .form-table-form-item.business-form-item { margin-bottom: 8px; }
    `
    document.head.appendChild(style)
    const wrapper = mountFormTable({
      tableData: [{ name: '' }],
      columns: [{
        label: '姓名',
        rowProps: { class: 'business-field-layout' },
        formItems: [{
          fieldKey: 'name',
          type: 'input',
          formItemProps: { class: 'business-form-item' }
        }]
      }]
    })
    await wrapper.vm.$nextTick()

    expect(getComputedStyle(wrapper.find('.form-table-field-layout').element).flexWrap).toBe('nowrap')
    expect(getComputedStyle(wrapper.find('.form-table-form-item').element).marginBottom).toBe('8px')
    wrapper.destroy()
    style.remove()
  })

  it('keeps nested tables independently marked without styling unrelated FormItems', async () => {
    const style = document.createElement('style')
    style.textContent = styleSource
    document.head.appendChild(style)
    const NestedFormTable = localVue.extend({
      render(createElement) {
        return createElement(FormTable as any, {
          props: {
            tableData: [{ inner: '' }],
            columns: [{
              label: '内层',
              formItems: [{ fieldKey: 'inner', type: 'input' }]
            }]
          }
        })
      }
    })
    const host = mount(localVue.extend({
      render(createElement) {
        return createElement(FormTable as any, {
          props: {
            tableData: [{ outer: '' }],
            columns: [{
              label: '外层',
              formItems: [{
                fieldKey: 'outer',
                type: 'component',
                component: {
                  is: NestedFormTable,
                  model: false
                }
              }]
            }]
          }
        })
      }
    }), {
      localVue,
      attachTo: document.body
    })
    await localVue.nextTick()

    const roots = [
      host.element as HTMLElement,
      ...Array.from(host.element.querySelectorAll<HTMLElement>('.form-table-container'))
    ].filter(element => element.matches('.form-table-container'))
    const items = Array.from(host.element.querySelectorAll<HTMLElement>('.form-table-form-item'))
    expect(roots).toHaveLength(2)
    expect(items).toHaveLength(2)
    expect(items[0].closest('.form-table-container')).toBe(roots[0])
    expect(items[1].closest('.form-table-container')).toBe(roots[1])
    expect(items.every(item => item.classList.contains('form-table-form-item'))).toBe(true)
    expect(getComputedStyle(items[0]).marginBottom).toBe('0px')
    expect(getComputedStyle(items[1]).marginBottom).toBe('0px')

    const unrelated = document.createElement('div')
    unrelated.className = 'el-form-item'
    document.body.appendChild(unrelated)
    expect(getComputedStyle(unrelated).marginBottom).not.toBe('0px')
    unrelated.remove()
    host.destroy()
    style.remove()
  })
})
