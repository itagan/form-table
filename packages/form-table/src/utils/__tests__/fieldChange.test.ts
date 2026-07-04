import { describe, expect, it, vi } from 'vitest'
import type { FormItemConfig, TableRow } from '../../types'
import { createInitialFieldChanges, resolveRowChange } from '../fieldChange'

function createResolver(fieldConfigs: Record<string, FormItemConfig>) {
  const tableData: TableRow[] = [
    {
      name: 'Alice',
      age: 18,
      profile: {
        city: 'Shanghai'
      }
    }
  ]

  return (options?: Parameters<typeof resolveRowChange>[1]) => resolveRowChange({
    rowIndex: 0,
    currentRow: tableData[0],
    tableData,
    formData: {
      tableData,
      owner: 'tester'
    },
    getFieldConfig: (fieldKey) => fieldConfigs[fieldKey]
  }, options)
}

describe('field change utils', () => {
  it('creates initial field changes only for defined values', () => {
    expect(createInitialFieldChanges({
      name: 'Alice',
      profile: {
        city: 'Shanghai'
      }
    }, ['name', 'profile.city', 'missing'])).toEqual([
      {
        fieldKey: 'name',
        value: 'Alice',
        previousValue: undefined
      },
      {
        fieldKey: 'profile.city',
        value: 'Shanghai',
        previousValue: undefined
      }
    ])
  })

  it('applies initial patches immutably and records field changes', () => {
    const resolve = createResolver({})
    const result = resolve({
      initialPatch: {
        name: 'Bob',
        'profile.city': 'Suzhou'
      }
    })

    expect(result.nextRow).toEqual({
      name: 'Bob',
      age: 18,
      profile: {
        city: 'Suzhou'
      }
    })
    expect(result.fieldChanges).toEqual([
      {
        row: result.nextRow,
        index: 0,
        fieldKey: 'name',
        value: 'Bob',
        previousValue: 'Alice'
      },
      {
        row: result.nextRow,
        index: 0,
        fieldKey: 'profile.city',
        value: 'Suzhou',
        previousValue: 'Shanghai'
      }
    ])
  })

  it('runs linked onValueChange patches with the latest row context', () => {
    const onValueChange = vi.fn((context) => {
      expect(context.row.name).toBe('Bob')
      expect(context.formData.tableData[0].name).toBe('Bob')
      expect(context.getValue('name')).toBe('Bob')

      return {
        age: 20
      }
    })
    const resolve = createResolver({
      name: {
        key: 'name',
        type: 'input',
        behavior: {
          onValueChange
        }
      }
    })

    const result = resolve({
      initialPatch: {
        name: 'Bob'
      }
    })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(result.nextRow.age).toBe(20)
    expect(result.fieldChanges.map((change) => change.fieldKey)).toEqual(['name', 'age'])
  })

  it('coalesces repeated changes for the same field into the initial and final values', () => {
    const resolve = createResolver({
      name: {
        key: 'name',
        type: 'input',
        behavior: {
          onValueChange: () => ({
            name: 'Carol'
          })
        }
      }
    })

    const result = resolve({
      initialPatch: {
        name: 'Bob'
      }
    })

    expect(result.nextRow.name).toBe('Carol')
    expect(result.fieldChanges).toEqual([
      {
        row: result.nextRow,
        index: 0,
        fieldKey: 'name',
        value: 'Carol',
        previousValue: 'Alice'
      }
    ])
  })

  it('drops a field change when linked updates return it to the initial value', () => {
    const resolve = createResolver({
      name: {
        key: 'name',
        type: 'input',
        behavior: {
          onValueChange: () => ({
            name: 'Alice'
          })
        }
      }
    })

    const result = resolve({
      initialPatch: {
        name: 'Bob'
      }
    })

    expect(result.nextRow.name).toBe('Alice')
    expect(result.fieldChanges).toEqual([])
  })

  it('warns and stops processing runaway linked changes', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const resolve = createResolver({
      count: {
        key: 'count',
        type: 'number',
        behavior: {
          onValueChange: (context) => ({
            count: Number(context.value || 0) + 1
          })
        }
      }
    })

    const result = resolve({
      initialPatch: {
        count: 1
      }
    })

    expect(result.nextRow.count).toBe(101)
    expect(warnSpy).toHaveBeenCalledWith('[FormTable] onValueChange exceeded max linked update count, remaining changes were ignored.')
    warnSpy.mockRestore()
  })
})
