import { describe, expect, it } from 'vitest'
import type { ColumnConfig, FormTableBaseContext, FormTableRuntimeContext } from '../../types'
import { buildDefaultRow } from '../dynamic'

describe('dynamic utils', () => {
  it('builds default rows from column fields shorthand', () => {
    const columns: ColumnConfig[] = [
      {
        name: '基础信息',
        fieldRow: {
          gutter: 8
        },
        fields: [
          {
            key: 'name',
            type: 'input',
            behavior: {
              defaultValue: 'Draft'
            }
          },
          {
            key: 'profile.city',
            type: 'input',
            behavior: {
              defaultValue: ({ index }: FormTableRuntimeContext) => `city-${index}`
            }
          }
        ]
      },
      {
        name: '隐藏字段',
        fieldRow: {
          visible: false
        },
        fields: [
          {
            key: 'hidden',
            type: 'input',
            behavior: {
              defaultValue: 'hidden'
            }
          }
        ]
      }
    ]
    const baseContext: FormTableBaseContext = {
      formData: {},
      tableData: []
    }

    expect(buildDefaultRow(columns, baseContext, 2)).toEqual({
      name: 'Draft',
      profile: {
        city: 'city-2'
      }
    })
  })
})
