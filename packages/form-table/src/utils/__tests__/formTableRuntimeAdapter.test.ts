import { describe, expect, it, vi } from 'vitest'
import {
  getVue2ComponentListeners,
  resolveHintTooltipProps,
  resolveTableListeners,
  resolveTableProps
} from '../formTableRuntimeAdapter'

describe('FormTable runtime adapter', () => {
  it('reads Vue 2 listeners and forwards only native table events', () => {
    const rowClick = vi.fn()
    const fieldChange = vi.fn()
    const updateTableData = vi.fn()
    const listeners = getVue2ComponentListeners({
      $listeners: {
        'row-click': rowClick,
        'field-change': fieldChange,
        'update:tableData': updateTableData
      }
    })

    expect(resolveTableListeners(listeners)).toEqual({ 'row-click': rowClick })
    expect(getVue2ComponentListeners(null)).toEqual({})
  })

  it('removes only the legacy table rowKey passthrough', () => {
    const source = { rowKey: 'legacy-id', border: true, height: 320 }

    expect(resolveTableProps(source)).toEqual({ border: true, height: 320 })
    expect(source).toEqual({ rowKey: 'legacy-id', border: true, height: 320 })
  })

  it('protects managed Tooltip props and preserves supported passthrough values', () => {
    expect(resolveHintTooltipProps({
      content: 'ignored',
      manual: false,
      enterable: true,
      placement: 'bottom',
      effect: 'light',
      popperClass: 'business-tooltip',
      openDelay: 200
    })).toEqual({
      placement: 'bottom',
      effect: 'light',
      popperClass: 'form-table-hint-tooltip business-tooltip',
      openDelay: 200
    })
  })

  it('uses a short default Tooltip delay while allowing explicit overrides', () => {
    expect(resolveHintTooltipProps({}).openDelay).toBe(100)
    expect(resolveHintTooltipProps({ openDelay: 0 }).openDelay).toBe(0)
  })
})
