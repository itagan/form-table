import { describe, expect, it } from 'vitest'
import type { FormTableRowContext } from '../../types/context'
import { resolveColumnRenderConfig } from '../columnRender'

describe('column render config', () => {
  it('keeps a native column as a plain render config', () => {
    const column = { props: { type: 'selection' } }

    const result = resolveColumnRenderConfig(column)

    expect(result).toEqual({ kind: 'plain', column })
    expect(result.column).toBe(column)
  })

  it('keeps layout items and row props by reference', () => {
    const items = [{ fieldKey: 'name', type: 'text' as const }]
    const rowProps = (_context: FormTableRowContext) => ({ gutter: 8 })
    const column = { label: '姓名', formItems: items, rowProps }

    const result = resolveColumnRenderConfig(column)

    expect(result.kind).toBe('layout')
    if (result.kind !== 'layout') throw new Error('Expected a layout column')
    expect(result.column).toBe(column)
    expect(result.items).toBe(items)
    expect(result.rowProps).toBe(rowProps)
  })

  it('keeps a cell slot column and its slot name', () => {
    const column = { label: '操作', cellSlot: 'row-actions' }

    const result = resolveColumnRenderConfig(column)

    expect(result).toEqual({ kind: 'cell-slot', column, slotName: 'row-actions' })
    expect(result.column).toBe(column)
  })
})
