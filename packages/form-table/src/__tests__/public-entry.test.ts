import { describe, expect, it, vi } from 'vitest'
import FormTable, { FormTable as NamedFormTable, FormTablePlugin } from '../index'

describe('public package entry', () => {
  it('keeps the default export and named FormTable export aligned', () => {
    expect(FormTable).toBeTruthy()
    expect(NamedFormTable).toBe(FormTable)
  })

  it('exposes a Vue 2 plugin that registers FormTable by name', () => {
    const component = vi.fn()

    FormTablePlugin.install?.({
      component
    } as any)

    expect(component).toHaveBeenCalledWith('FormTable', FormTable)
  })
})
