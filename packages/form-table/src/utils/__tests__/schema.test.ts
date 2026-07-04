import { describe, expect, it, vi } from 'vitest'
import type { ColumnConfig } from '../../types'
import { getSchemaFieldProps, normalizeColumns } from '../schema'

function createColumns(): ColumnConfig[] {
  return [
    {
      name: '基础信息',
      children: [
        {
          children: [
            {
              key: 'name',
              type: 'input'
            },
            {
              key: 'profile.city',
              type: 'select'
            }
          ]
        }
      ]
    },
    {
      name: '备注',
      children: [
        {
          children: [
            {
              key: 'remark',
              type: 'textarea'
            }
          ]
        }
      ]
    }
  ]
}

describe('schema utils', () => {
  it('normalizes columns into a field map and ordered field keys', () => {
    const columns = createColumns()
    const schema = normalizeColumns(columns)

    expect(schema.columns).toBe(columns)
    expect(schema.fieldKeys).toEqual(['name', 'profile.city', 'remark'])
    expect(schema.fieldMap.get('name')?.type).toBe('input')
    expect(schema.fieldMap.get('profile.city')?.type).toBe('select')
  })

  it('generates Element UI form prop paths for a row', () => {
    const schema = normalizeColumns(createColumns())

    expect(getSchemaFieldProps(schema, 2)).toEqual([
      'tableData.2.name',
      'tableData.2.profile.city',
      'tableData.2.remark'
    ])
  })

  it('keeps first field key order when duplicate keys are present', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const columns = createColumns()
    columns[1].children[0].children.push({
      key: 'name',
      type: 'input'
    })

    const schema = normalizeColumns(columns)

    expect(schema.fieldKeys).toEqual(['name', 'profile.city', 'remark'])
    expect(schema.fieldMap.get('name')).toBe(columns[1].children[0].children[1])
    warnSpy.mockRestore()
  })
})
