import { describe, expect, it, vi } from 'vitest'
import {
  FORM_TABLE_HINT_ATTRIBUTE,
  FORM_TABLE_HINT_FIELD_ATTRIBUTE,
  FORM_TABLE_HINT_TRIGGER_ATTRIBUTE,
  applyHintComponentProps,
  applyHintTargetProps,
  resolveFormTableFieldHint,
  resolveFormTableHint
} from '../hint'
import type { FormTableFieldRenderContext } from '../../types'

const createFieldContext = (value: unknown) => ({
  tableData: [], columnConfig: { label: '字段列', formItems: [] }, row: { value }, index: 0,
  displayIndex: 0,
  fieldKey: 'value', value,
  itemConfig: { fieldKey: 'value', type: 'input' }
}) as FormTableFieldRenderContext

describe('FormTable hint utilities', () => {
  it('normalizes only non-empty strings', () => {
    expect(resolveFormTableHint('说明')).toBe('说明')
    expect(resolveFormTableHint('')).toBeNull()
    expect(resolveFormTableHint(false)).toBeNull()
    expect(resolveFormTableHint(null)).toBeNull()
    expect(resolveFormTableHint(undefined)).toBeNull()
  })

  it('applies title or tooltip props without mutating the source', () => {
    const source = { title: '底层说明', class: 'target' }
    expect(applyHintTargetProps(source, null, 'tooltip')).toBe(source)
    expect(applyHintTargetProps(source, '托管说明', false)).toBe(source)
    expect(applyHintTargetProps(source, '托管说明', 'title')).toEqual({ class: 'target', title: '托管说明' })
    expect(applyHintTargetProps(source, '托管说明', 'tooltip', { focusable: true })).toEqual({
      class: 'target', [FORM_TABLE_HINT_ATTRIBUTE]: '托管说明', tabindex: 0
    })
    expect(applyHintTargetProps(source, '托管说明', 'tooltip', {
      trigger: 'content', fieldKey: 'name'
    })).toEqual({
      class: 'target',
      [FORM_TABLE_HINT_ATTRIBUTE]: '托管说明',
      [FORM_TABLE_HINT_TRIGGER_ATTRIBUTE]: 'content',
      [FORM_TABLE_HINT_FIELD_ATTRIBUTE]: 'name'
    })
    expect(applyHintTargetProps(source, '托管说明', 'title', {
      trigger: 'content'
    })).toEqual({ class: 'target' })
    expect(source).toEqual({ title: '底层说明', class: 'target' })
  })

  it('adds native titles to content props without overriding explicit component titles', () => {
    const source = { class: 'target' }
    expect(applyHintComponentProps(source, '组件说明', 'title', 'content')).toEqual({
      class: 'target', title: '组件说明'
    })
    expect(applyHintComponentProps({ title: '显式说明' }, '组件说明', 'title', 'content')).toEqual({
      title: '显式说明'
    })
    expect(applyHintComponentProps(source, '组件说明', 'tooltip', 'content')).toBe(source)
    expect(applyHintComponentProps(source, '组件说明', 'title', 'item')).toBe(source)
  })

  it('uses explicit values and falls back to the table formatter', () => {
    const context = createFieldContext('Alice')
    const formatter = vi.fn(({ value }) => `值:${value}`)
    expect(resolveFormTableFieldHint('显式', context, formatter)).toBe('显式')
    expect(formatter).not.toHaveBeenCalled()
    expect(resolveFormTableFieldHint(false, context, formatter)).toBeNull()
    expect(resolveFormTableFieldHint(undefined, context, formatter)).toBe('值:Alice')
    expect(resolveFormTableFieldHint('', context, true)).toBe('Alice')
    expect(resolveFormTableFieldHint(undefined, createFieldContext(0), true)).toBe('0')
    expect(resolveFormTableFieldHint(undefined, createFieldContext(false), true)).toBe('false')
    expect(resolveFormTableFieldHint(undefined, createFieldContext(null), true)).toBeNull()
    expect(resolveFormTableFieldHint(undefined, context, () => false)).toBeNull()
  })
})
