import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnConfig } from '../../types'
import { getSchemaFieldProps, normalizeColumns, validateRulePaths } from '../schema'
import { resetFormTableWarnings } from '../warnings'

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
              type: 'select',
              options: [
                { label: '上海', value: 'shanghai' }
              ]
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
  afterEach(() => {
    resetFormTableWarnings()
    vi.restoreAllMocks()
  })

  it('normalizes columns into a field map and ordered field keys', () => {
    const columns = createColumns()
    const schema = normalizeColumns(columns)

    expect(schema.columns).toEqual(columns)
    expect(schema.fieldKeys).toEqual(['name', 'profile.city', 'remark'])
    expect(schema.fieldMap.get('name')?.type).toBe('input')
    expect(schema.fieldMap.get('profile.city')?.type).toBe('select')
  })

  it('normalizes column fields shorthand into a single row', () => {
    const columns: ColumnConfig[] = [
      {
        name: '基础信息',
        fieldRow: {
          key: 'base-row',
          gutter: 8,
          props: {
            justify: 'space-between'
          }
        },
        fields: [
          {
            key: 'name',
            type: 'input'
          },
          {
            key: 'age',
            type: 'number'
          }
        ]
      }
    ]

    const schema = normalizeColumns(columns)

    expect(schema.columns[0].children).toEqual([
      {
        key: 'base-row',
        gutter: 8,
        props: {
          justify: 'space-between'
        },
        children: columns[0].fields
      }
    ])
    expect(schema.fieldKeys).toEqual(['name', 'age'])
    expect(getSchemaFieldProps(schema, 0)).toEqual([
      'tableData.0.name',
      'tableData.0.age'
    ])
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
    const duplicatedItem = {
      key: 'name',
      type: 'input'
    } as const
    columns[1].children?.[0].children.push(duplicatedItem)

    const schema = normalizeColumns(columns)

    expect(schema.fieldKeys).toEqual(['name', 'profile.city', 'remark'])
    expect(schema.fieldMap.get('name')).toBe(duplicatedItem)
    expect(warnSpy).toHaveBeenCalledWith('[FormTable] duplicate field key "name" detected.')
  })

  it('warns about confusing column shorthand combinations', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    normalizeColumns([
      {
        name: '混合配置',
        fieldRow: {
          gutter: 8
        },
        fields: [
          {
            key: 'name',
            type: 'input'
          }
        ],
        children: [
          {
            children: [
              {
                key: 'name',
                type: 'input'
              }
            ]
          }
        ]
      },
      {
        name: '无效 fieldRow',
        fieldRow: {
          gutter: 8
        }
      }
    ])

    expect(warnSpy).toHaveBeenCalledWith(
      '[FormTable] column "混合配置" configures both children and fields; children will be used.'
    )
    expect(warnSpy).toHaveBeenCalledWith(
      '[FormTable] column "无效 fieldRow" configures fieldRow without fields; fieldRow will not be used.'
    )
  })

  it('warns about common field config mistakes', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    normalizeColumns([
      {
        name: '错误字段',
        fields: [
          {
            key: '',
            type: 'input'
          },
          {
            key: 'unknown',
            type: 'unknown' as never
          },
          {
            key: 'slotField',
            type: 'slot'
          },
          {
            key: 'customField',
            type: 'custom'
          },
          {
            key: 'status',
            type: 'select'
          },
          {
            key: 'name',
            type: 'input',
            required: true,
            rules: [
              {
                required: true
              }
            ]
          }
        ]
      }
    ])

    expect(warnSpy).toHaveBeenCalledWith('[FormTable] field config requires a non-empty key.')
    expect(warnSpy).toHaveBeenCalledWith('[FormTable] unknown field type "unknown" for field "unknown".')
    expect(warnSpy).toHaveBeenCalledWith('[FormTable] slot field "slotField" requires component.slotName.')
    expect(warnSpy).toHaveBeenCalledWith('[FormTable] custom field "customField" requires component.name.')
    expect(warnSpy).toHaveBeenCalledWith('[FormTable] select field "status" has no options configured.')
    expect(warnSpy).toHaveBeenCalledWith('[FormTable] field "name" has both top-level required and a required rule.')
  })

  it('warns about invalid or unknown top-level rule paths', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const schema = normalizeColumns(createColumns())

    validateRulePaths(schema, {
      name: [
        { required: true }
      ],
      'tableData.*.missing': [
        { required: true }
      ],
      'tableData.0.profile.city': [
        { required: true }
      ]
    })

    expect(warnSpy).toHaveBeenCalledWith(
      '[FormTable] rules path "name" should use "tableData.*.fieldKey" or "tableData.0.fieldKey".'
    )
    expect(warnSpy).toHaveBeenCalledWith(
      '[FormTable] rules path "tableData.*.missing" points to unknown field "missing".'
    )
    expect(warnSpy).not.toHaveBeenCalledWith(
      '[FormTable] rules path "tableData.0.profile.city" points to unknown field "profile.city".'
    )
  })
})
