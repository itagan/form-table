import { describe, expect, it, vi } from 'vitest'
import type { VueConstructor } from 'vue'
import FormTable, {
  FormTable as NamedFormTable,
  FormTablePlugin,
  createFormTableField,
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
      'FormTablePlugin',
      'createFormTable',
      'createFormTableField',
      'default',
      'defineFormTableColumns'
    ])
  })

  it('exposes a Vue 2 plugin that registers FormTable by name', () => {
    const component = vi.fn()

    FormTablePlugin.install?.({
      component
    } as unknown as VueConstructor)

    expect(component).toHaveBeenCalledWith('FormTable', FormTable)
  })

  it('returns typed column definitions without changing their runtime identity', () => {
    const columns = [{ label: '姓名', children: [] }]

    expect(defineFormTableColumns(columns)).toBe(columns)
  })

  it('returns field definitions without changing their runtime identity', () => {
    const defineField = createFormTableField<{ name: string }>()
    const field = { fieldKey: 'name', type: 'input' } as const

    expect(defineField(field)).toBe(field)
  })

  it('returns the same runtime component from the generic factory', () => {
    expect(createFormTable<{ id: string }>()).toBe(FormTable)
  })
})
