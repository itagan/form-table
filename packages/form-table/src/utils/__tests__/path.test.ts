import { describe, expect, it } from 'vitest'
import { getValueByPath, setValueByPath } from '../path'

describe('path utils', () => {
  it('reads dot paths and array index paths', () => {
    const row = {
      profile: {
        city: 'Shanghai'
      },
      contacts: [
        {
          phone: '13800000000'
        }
      ]
    }

    expect(getValueByPath(row, 'profile.city')).toBe('Shanghai')
    expect(getValueByPath(row, 'contacts[0].phone')).toBe('13800000000')
    expect(getValueByPath(row, 'contacts.1.phone')).toBeUndefined()
  })

  it('writes nested values without mutating the original row', () => {
    const row = {
      profile: {
        city: 'Shanghai',
        district: 'Pudong'
      },
      contacts: [
        {
          phone: '13800000000'
        }
      ]
    }

    const nextRow = setValueByPath(row, 'contacts[0].phone', '13900000000')

    expect(nextRow).not.toBe(row)
    expect(nextRow.contacts).not.toBe(row.contacts)
    expect(nextRow.contacts[0]).not.toBe(row.contacts[0])
    expect(nextRow.contacts[0].phone).toBe('13900000000')
    expect(row.contacts[0].phone).toBe('13800000000')
  })

  it('creates missing nested objects while writing', () => {
    const nextRow = setValueByPath({}, 'profile.address.city', 'Hangzhou')

    expect(nextRow).toEqual({
      profile: {
        address: {
          city: 'Hangzhou'
        }
      }
    })
  })
})
