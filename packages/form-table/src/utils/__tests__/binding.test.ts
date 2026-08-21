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

  it('uses per-entry fallback values for missing object and nested paths', () => {
    const binding = {
      map: [
        { fieldPath: 'userId', valuePath: 'id', fallbackValue: '' },
        { fieldPath: 'userName', valuePath: 'profile.name', fallbackValue: '未命名' },
        { fieldPath: 'optionalCode', valuePath: 'optional.code', fallbackValue: undefined },
        { fieldPath: 'phone', valuePath: 'phone' }
      ]
    }

    expect(createBindingPatch(binding, { profile: null })).toEqual({
      userId: '',
      userName: '未命名',
      optionalCode: undefined
    })
    expect(createBindingPatch(binding, {})).toEqual({
      userId: '',
      userName: '未命名',
      optionalCode: undefined
    })
    expect(createBindingPatch(binding, undefined)).toEqual({
      userId: '',
      userName: '未命名',
      optionalCode: undefined
    })
  })

  it('uses fallback values for empty arrays without changing mapped read defaults', () => {
    const binding = {
      map: [
        { fieldPath: 'startTime', valuePath: '[0]', fallbackValue: '' },
        { fieldPath: 'endTime', valuePath: '[1]', fallbackValue: '' }
      ]
    }

    expect(createBindingPatch(binding, [])).toEqual({
      startTime: '',
      endTime: ''
    })
    expect(resolveBindingValue({}, binding)).toEqual([undefined, undefined])
  })

  it('preserves explicit undefined and null values instead of replacing them with fallbacks', () => {
    const binding = {
      map: [
        { fieldPath: 'userId', valuePath: 'id', fallbackValue: 'fallback-id' },
        { fieldPath: 'userName', valuePath: 'name', fallbackValue: 'fallback-name' }
      ]
    }

    expect(createBindingPatch(binding, { id: undefined, name: null })).toEqual({
      userId: undefined,
      userName: null
    })
  })

  it('shallow-clones array and plain-object fallback containers for each patch', () => {
    const fallbackList: string[] = []
    const fallbackMeta = { source: 'fallback' }
    const binding = {
      map: [
        { fieldPath: 'ids', valuePath: 'ids', fallbackValue: fallbackList },
        { fieldPath: 'meta', valuePath: 'meta', fallbackValue: fallbackMeta }
      ]
    }

    const firstPatch = createBindingPatch(binding, {}) as any
    const secondPatch = createBindingPatch(binding, {}) as any

    expect(firstPatch).toEqual({ ids: [], meta: { source: 'fallback' } })
    expect(firstPatch.ids).not.toBe(fallbackList)
    expect(firstPatch.meta).not.toBe(fallbackMeta)
    expect(firstPatch.ids).not.toBe(secondPatch.ids)
    expect(firstPatch.meta).not.toBe(secondPatch.meta)
  })

  it('prefers fallbacks while clearing and keeps null for entries without one', () => {
    const binding = {
      map: [
        { fieldPath: 'startTime', valuePath: '[0]', fallbackValue: '' },
        { fieldPath: 'endTime', valuePath: '[1]' }
      ]
    }

    expect(createBindingPatch(binding, null)).toEqual({
      startTime: '',
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
