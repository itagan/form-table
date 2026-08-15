import { describe, expect, it } from 'vitest'
import FormTable, {
  FormTable as NamedFormTable,
  createFormTable,
  defineFormTableColumns
} from '../index'
import * as publicEntry from '../index'

describe('public package entry', () => {
  it('keeps the default export and named FormTable export aligned', () => {
    expect(FormTable).toBeTruthy()
    expect(NamedFormTable).toBe(FormTable)
  })

  it('keeps runtime exports limited to the supported public API', () => {
    expect(Object.keys(publicEntry).sort()).toEqual([
      'FormTable',
      'createFormTable',
      'default',
      'defineFormTableColumns'
    ])
  })

  it('returns typed column definitions without changing their runtime identity', () => {
    const columns = [{ label: '姓名', children: [] }]

    expect(defineFormTableColumns(columns)).toBe(columns)
  })

  it('returns the same runtime component from the generic factory', () => {
    expect(createFormTable<{ id: string }>()).toBe(FormTable)
  })
})
