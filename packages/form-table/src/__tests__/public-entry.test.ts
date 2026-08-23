import { describe, expect, it } from 'vitest'
import FormTable, {
  FormTable as NamedFormTable,
  createFormTable,
  defineFormTableColumns,
  defineFormTableType,
  defineFormTableTypes
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
      'defineFormTableColumns',
      'defineFormTableType',
      'defineFormTableTypes'
    ])
  })

  it('returns field type registries by identity and rejects reserved names', () => {
    const employee = { is: 'employee-picker' }
    expect(defineFormTableType()(employee)).toBe(employee)
    const fieldTypes = { employee }
    expect(defineFormTableTypes()(fieldTypes)).toBe(fieldTypes)
    expect(() => defineFormTableTypes()({
      // @ts-expect-error reserved names are rejected by the public helper.
      input: { is: 'business-input' }
    })).toThrow('[FormTable] Field type "input" is reserved')
  })

  it('returns typed column definitions without changing their runtime identity', () => {
    const columns = [{ label: '姓名', formItems: [] }]

    expect(defineFormTableColumns(columns)).toBe(columns)
  })

  it('returns the same runtime component from the generic factory', () => {
    expect(createFormTable<{ id: string }>()).toBe(FormTable)
  })
})
