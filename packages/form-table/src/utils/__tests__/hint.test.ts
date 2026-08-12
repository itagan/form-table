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
  it('normalizes strings, behavior defaults, custom behavior, and empty values', () => {
    expect(resolveFormTableHint('说明')).toEqual({ content: '说明', behavior: 'auto' })
    expect(resolveFormTableHint({ content: '说明' })).toEqual({ content: '说明', behavior: 'auto' })
    expect(resolveFormTableHint({ content: '说明', behavior: 'custom' })).toEqual({
      content: '说明',
      behavior: 'custom'
    })
    expect(resolveFormTableHint('')).toBeNull()
    expect(resolveFormTableHint({ content: '' })).toBeNull()
    expect(resolveFormTableHint(null)).toBeNull()
    expect(resolveFormTableHint(undefined)).toBeNull()
  })

  it('applies the shared target precedence and optional focusability', () => {
    const source = { title: '底层说明', tabindex: -1, class: 'target' }
    expect(applyHintTargetProps(source, null, 'tooltip')).toBe(source)
    expect(applyHintTargetProps(source, { content: '自定义', behavior: 'custom' }, 'tooltip')).toBe(source)
    expect(applyHintTargetProps(
      { class: 'header' },
      { content: '托管说明', behavior: 'auto' },
      'tooltip',
      { focusable: true }
    )).toEqual({
      class: 'header',
      [FORM_TABLE_HINT_ATTRIBUTE]: '托管说明',
      tabindex: 0
    })
    expect(source).toEqual({ title: '底层说明', tabindex: -1, class: 'target' })
  })

  it('formats inherited fields with the default value formatter', () => {
    expect(resolveFormTableFieldHint(undefined, createFieldContext('完整内容'), true)).toEqual({
      content: '完整内容',
      behavior: 'auto'
    })
    expect(resolveFormTableFieldHint(undefined, createFieldContext(0), true)?.content).toBe('0')
    expect(resolveFormTableFieldHint(undefined, createFieldContext(false), true)?.content).toBe('false')
    expect(resolveFormTableFieldHint(undefined, createFieldContext(null), true)).toBeNull()
    expect(resolveFormTableFieldHint('', createFieldContext('回退'), true)?.content).toBe('回退')
    expect(resolveFormTableFieldHint(false, createFieldContext('隐藏'), true)).toBeNull()
  })

  it('uses the table formatter only as fallback and keeps explicit contents authoritative', () => {
    const formatter = vi.fn(({ fieldKey, value }) => `${fieldKey}:${String(value)}`)
    const context = createFieldContext('Alice')
    expect(resolveFormTableFieldHint(undefined, context, formatter)).toEqual({
      content: 'value:Alice',
      behavior: 'auto'
    })
    expect(formatter).toHaveBeenCalledWith(context)

    formatter.mockClear()
    expect(resolveFormTableFieldHint('显式说明', context, formatter)?.content).toBe('显式说明')
    expect(formatter).not.toHaveBeenCalled()
    expect(resolveFormTableFieldHint(undefined, context, () => null)).toBeNull()
    expect(resolveFormTableFieldHint(undefined, context, () => undefined)).toBeNull()
    expect(resolveFormTableFieldHint(undefined, context, () => '')).toBeNull()
  })
})
