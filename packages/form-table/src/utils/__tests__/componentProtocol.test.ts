import { describe, expect, it, vi } from 'vitest'
import {
  createFieldValueSetter,
  filterComponentRenderProps,
  wrapComponentListeners
} from '../componentProtocol'
import type { FormTableFieldContext } from '../../types'

describe('component protocol utils', () => {
  it('filters FormTable-only props before rendering the underlying component', () => {
    expect(filterComponentRenderProps({
      placeholder: '请输入',
      clearable: true,
      options: [{ label: 'A', value: 'a' }],
      formatter: () => '',
      emptyText: '-',
      optionProps: { label: 'name' }
    })).toEqual({
      placeholder: '请输入',
      clearable: true
    })
  })

  it('dispatches field value changes through the unified row update command', () => {
    const dispatch = vi.fn()
    const row = { profile: { city: '杭州' } }
    const setValue = createFieldValueSetter({
      getRow: () => row,
      getRowIndex: () => 2,
      getFieldKey: () => 'profile.city',
      dispatch
    })

    setValue('上海')

    expect(dispatch).toHaveBeenCalledWith(
      'update:row',
      2,
      row,
      'profile.city',
      '上海'
    )
  })

  it('skips unchanged values and warns when dispatch is missing', () => {
    const warn = vi.fn()
    const row = { name: 'Alice' }
    const setValue = createFieldValueSetter({
      getRow: () => row,
      getRowIndex: () => 0,
      getFieldKey: () => 'name',
      warn
    })

    setValue('Alice')
    expect(warn).not.toHaveBeenCalled()

    setValue('Bob')
    expect(warn).toHaveBeenCalledWith('[FormTable] dispatch not found, value update skipped.')
  })

  it('reads the latest row metadata every time a value is set', () => {
    const dispatch = vi.fn()
    const firstRow = { name: 'Alice' }
    const secondRow = { name: 'Bob' }
    let currentRow = firstRow
    let currentIndex = 0
    const setValue = createFieldValueSetter({
      getRow: () => currentRow,
      getRowIndex: () => currentIndex,
      getFieldKey: () => 'name',
      dispatch
    })

    currentRow = secondRow
    currentIndex = 3
    setValue('Carol')

    expect(dispatch).toHaveBeenCalledWith('update:row', 3, secondRow, 'name', 'Carol')
  })

  it('wraps configured listeners with field context followed by original args', () => {
    const context = {
      row: { status: 'enabled' },
      index: 1,
      fieldKey: 'status',
      value: 'enabled',
      formData: {},
      tableData: [],
      setValue: vi.fn(),
      updateRow: vi.fn()
    } as unknown as FormTableFieldContext
    const listener = vi.fn()
    const wrapped = wrapComponentListeners({
      commit: listener
    }, () => context)

    wrapped.commit('disabled', { source: 'button' })

    expect(listener).toHaveBeenCalledWith(context, 'disabled', { source: 'button' })
  })
})
