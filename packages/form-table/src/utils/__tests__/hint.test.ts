import { describe, expect, it } from 'vitest'
import {
  FORM_TABLE_HINT_ATTRIBUTE,
  applyHintTargetProps,
  resolveFormTableHint
} from '../hint'

describe('FormTable hint utilities', () => {
  it('normalizes strings, ownership defaults, custom ownership, and empty values', () => {
    expect(resolveFormTableHint('说明')).toEqual({ content: '说明', ownership: 'table' })
    expect(resolveFormTableHint({ content: '说明' })).toEqual({ content: '说明', ownership: 'table' })
    expect(resolveFormTableHint({ content: '说明', ownership: 'custom' })).toEqual({
      content: '说明',
      ownership: 'custom'
    })
    expect(resolveFormTableHint('')).toEqual({ content: '', ownership: 'table' })
    expect(resolveFormTableHint(null)).toBeNull()
    expect(resolveFormTableHint(undefined)).toBeNull()
  })

  it('applies the shared target precedence and optional focusability', () => {
    const source = { title: '底层说明', tabindex: -1, class: 'target' }
    expect(applyHintTargetProps(source, null, 'tooltip')).toEqual({ tabindex: -1, class: 'target' })
    expect(applyHintTargetProps(source, { content: '自定义', ownership: 'custom' }, 'tooltip')).toBe(source)
    expect(applyHintTargetProps(source, { content: '', ownership: 'table' }, 'tooltip')).toEqual({
      tabindex: -1,
      class: 'target'
    })
    expect(applyHintTargetProps(
      { class: 'header' },
      { content: '托管说明', ownership: 'table' },
      'tooltip',
      { focusable: true }
    )).toEqual({
      class: 'header',
      [FORM_TABLE_HINT_ATTRIBUTE]: '托管说明',
      tabindex: 0
    })
  })
})
