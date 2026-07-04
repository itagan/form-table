import { describe, expect, it } from 'vitest'
import {
  extractColumnAttrs,
  extractFormAttrs,
  extractTableAttrs,
  normalizeAttrs,
  pick
} from '../attrs'

describe('attrs utils', () => {
  it('picks defined values and keeps falsy values', () => {
    expect(pick({
      enabled: false,
      count: 0,
      label: '',
      skipped: undefined
    }, ['enabled', 'count', 'label', 'skipped'])).toEqual({
      enabled: false,
      count: 0,
      label: ''
    })
  })

  it('normalizes kebab-case attribute names to camelCase', () => {
    expect(normalizeAttrs({
      'label-width': '120px',
      'max-height': 400,
      border: true
    })).toEqual({
      labelWidth: '120px',
      maxHeight: 400,
      border: true
    })
  })

  it('extracts form attrs without leaking table or column attrs', () => {
    expect(extractFormAttrs({
      'label-width': '120px',
      size: 'small',
      disabled: false,
      border: true,
      width: '160px',
      unknown: 'ignored'
    })).toEqual({
      labelWidth: '120px',
      size: 'small',
      disabled: false
    })
  })

  it('extracts table attrs without leaking form or column attrs', () => {
    expect(extractTableAttrs({
      border: true,
      stripe: false,
      'max-height': 360,
      'label-width': '120px',
      width: '160px',
      renderHeader: () => null
    })).toEqual({
      border: true,
      stripe: false,
      maxHeight: 360
    })
  })

  it('extracts column attrs without leaking form or table attrs', () => {
    const renderHeader = () => null

    expect(extractColumnAttrs({
      type: 'selection',
      width: '80px',
      align: 'center',
      renderHeader,
      border: true,
      'label-width': '120px'
    })).toEqual({
      type: 'selection',
      width: '80px',
      align: 'center',
      renderHeader
    })
  })
})
