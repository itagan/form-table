import { describe, expect, it, vi } from 'vitest'
import {
  FORM_TABLE_HINT_ATTRIBUTE,
  applyHintTargetProps,
  resolveFormTableFieldHint,
  resolveFormTableHint
} from '../hint'
import type { FormTableFieldRenderContext } from '../../types'

const createFieldContext = (value: unknown) => ({
  tableData: [],
  columnConfig: { label: '字段列', children: [] },
  row: { value },
  index: 0,
  rowConfig: { children: [] },
  fieldKey: 'value',
  value,
  itemConfig: { fieldKey: 'value', type: 'input' }
}) as FormTableFieldRenderContext

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

  it('formats hint=true with the default value formatter', () => {
    expect(resolveFormTableFieldHint(true, createFieldContext('完整内容'))).toEqual({
      content: '完整内容',
      ownership: 'table'
    })
    expect(resolveFormTableFieldHint(true, createFieldContext(0))?.content).toBe('0')
    expect(resolveFormTableFieldHint(true, createFieldContext(false))?.content).toBe('false')
    expect(resolveFormTableFieldHint(true, createFieldContext(null))?.content).toBe('')
  })

  it('uses the table formatter only for hint=true and preserves empty formatter results', () => {
    const formatter = vi.fn(({ fieldKey, value }) => `${fieldKey}:${String(value)}`)
    const context = createFieldContext('Alice')
    expect(resolveFormTableFieldHint(true, context, formatter)).toEqual({
      content: 'value:Alice',
      ownership: 'table'
    })
    expect(formatter).toHaveBeenCalledWith(context)

    formatter.mockClear()
    expect(resolveFormTableFieldHint('显式说明', context, formatter)?.content).toBe('显式说明')
    expect(formatter).not.toHaveBeenCalled()
    expect(resolveFormTableFieldHint(true, context, () => null)).toBeNull()
    expect(resolveFormTableFieldHint(true, context, () => undefined)).toBeNull()
    expect(resolveFormTableFieldHint(true, context, () => '')?.content).toBe('')
  })
})
