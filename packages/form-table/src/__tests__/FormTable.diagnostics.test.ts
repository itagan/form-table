import { describe, expect, it, vi } from 'vitest'
import { mountFormTable } from './test-utils'

const messages = (warn: ReturnType<typeof vi.spyOn>) => warn.mock.calls.map(call => String(call[0]))

describe('FormTable development diagnostics', () => {
  it('reports missing and duplicate row identities with source indexes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountFormTable({
      rowKey: 'id',
      tableData: [{ id: 'same' }, { id: 'same' }, { name: 'missing' }, { id: null }]
    })
    await wrapper.vm.$nextTick()

    expect(messages(warn)).toEqual(expect.arrayContaining([
      expect.stringContaining('Duplicate rowKey "same" at tableData indexes [0, 1]'),
      expect.stringContaining('rowKey is missing for tableData indexes [2, 3]')
    ]))
    wrapper.destroy()
    warn.mockRestore()
  })

  it('reports duplicate explicit keys at each configuration scope', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountFormTable({
      columns: [{
        key: 'duplicate-column',
        label: 'A',
        children: [
          {
            key: 'duplicate-row',
            children: [
              { key: 'duplicate-item', fieldKey: 'name', type: 'input' },
              { key: 'duplicate-item', fieldKey: 'alias', type: 'input' }
            ]
          },
          { key: 'duplicate-row', children: [] }
        ]
      }, {
        key: 'duplicate-column',
        label: 'B',
        children: []
      }]
    })
    await wrapper.vm.$nextTick()

    expect(messages(warn)).toEqual(expect.arrayContaining([
      expect.stringContaining('Duplicate key "duplicate-column" in columns at indexes [0, 1]'),
      expect.stringContaining('Duplicate key "duplicate-row" in columns[0].children at indexes [0, 1]'),
      expect.stringContaining('Duplicate key "duplicate-item" in columns[0].children[0].children at indexes [0, 1]')
    ]))
    wrapper.destroy()
    warn.mockRestore()
  })

  it('reports mixed column modes and ignored FormTable properties on plain columns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountFormTable({
      columns: [
        { label: 'mixed', children: [], cellSlot: 'actions' } as any,
        { props: { type: 'selection' }, headerHint: 'ignored', fieldKey: 'name' } as any
      ]
    })
    await wrapper.vm.$nextTick()

    expect(messages(warn)).toEqual(expect.arrayContaining([
      expect.stringContaining('columns[0] configures both children and cellSlot'),
      expect.stringContaining('columns[1] is a plain Element column; ignored FormTable properties: headerHint, fieldKey')
    ]))
    wrapper.destroy()
    warn.mockRestore()
  })

  it('warns once while an issue remains and warns again after it is fixed and reintroduced', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountFormTable({
      rowKey: 'id',
      tableData: [{ id: 'same' }, { id: 'same' }]
    })
    await wrapper.vm.$nextTick()
    expect(messages(warn).filter(message => message.includes('Duplicate rowKey'))).toHaveLength(1)

    await wrapper.setProps({ loading: true })
    expect(messages(warn).filter(message => message.includes('Duplicate rowKey'))).toHaveLength(1)

    await wrapper.setProps({ tableData: [{ id: 'first' }, { id: 'second' }] })
    await wrapper.setProps({ tableData: [{ id: 'same' }, { id: 'same' }] })
    expect(messages(warn).filter(message => message.includes('Duplicate rowKey'))).toHaveLength(2)
    wrapper.destroy()
    warn.mockRestore()
  })
})
