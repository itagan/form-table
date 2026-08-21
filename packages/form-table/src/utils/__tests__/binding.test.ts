import { describe, expect, it } from 'vitest'
import { createBindingPatch, resolveBindingValue } from '../binding'

describe('field binding utils', () => {
  it('builds nested object values from row field paths', () => {
    const binding = {
      map: [
        { fieldPath: 'user.id', valuePath: 'selection.code' },
        { fieldPath: 'user.name', valuePath: 'selection.label' }
      ]
    }

    expect(resolveBindingValue({ user: { id: 'u-1', name: 'Alice' } }, binding)).toEqual({
      selection: { code: 'u-1', label: 'Alice' }
    })
  })

  it('builds array values and maps them back to one row patch', () => {
    const binding = {
      map: [
        { fieldPath: 'period.start', valuePath: '[0]' },
        { fieldPath: 'period.end', valuePath: '[1]' }
      ]
    }

    expect(resolveBindingValue({ period: { start: '08:00', end: '09:00' } }, binding)).toEqual([
      '08:00',
      '09:00'
    ])
    expect(createBindingPatch(binding, ['10:00', '11:00'])).toEqual({
      'period.start': '10:00',
      'period.end': '11:00'
    })
  })

  it('skips missing paths but preserves explicitly present undefined and null', () => {
    const binding = {
      map: [
        { fieldPath: 'userId', valuePath: 'id' },
        { fieldPath: 'userName', valuePath: 'name' },
        { fieldPath: 'departmentId', valuePath: 'department.id' }
      ]
    }
    const value = { id: undefined, name: null }

    expect(createBindingPatch(binding, value)).toEqual({
      userId: undefined,
      userName: null
    })
  })

  it('clears every mapped field when the root value is null', () => {
    const binding = {
      map: [
        { fieldPath: 'startTime', valuePath: '[0]' },
        { fieldPath: 'endTime', valuePath: '[1]' }
      ]
    }

    expect(createBindingPatch(binding, null)).toEqual({
      startTime: null,
      endTime: null
    })
  })

  it.each([
    [{ map: [] }, 'at least one entry'],
    [{ map: [{ fieldPath: 1 as unknown as string, valuePath: 'id' }] }, 'require string fieldPath'],
    [{ map: [{ fieldPath: '', valuePath: 'id' }] }, 'must not be empty'],
    [{ map: [{ fieldPath: 'profile.__proto__.name', valuePath: 'name' }] }, 'not allowed'],
    [{ map: [
      { fieldPath: 'user', valuePath: 'id' },
      { fieldPath: 'user.id', valuePath: 'name' }
    ] }, 'overlapping fieldPath'],
    [{ map: [
      { fieldPath: 'userId', valuePath: 'selection' },
      { fieldPath: 'userName', valuePath: 'selection.name' }
    ] }, 'overlapping valuePath'],
    [{ map: [
      { fieldPath: 'start', valuePath: '[0]' },
      { fieldPath: 'end', valuePath: 'end' }
    ] }, 'cannot mix array and object roots']
  ])('rejects invalid binding configuration %#', (binding, message) => {
    expect(() => resolveBindingValue({}, binding)).toThrowError(message as string)
  })
})
