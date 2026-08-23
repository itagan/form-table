import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useRowIndex } from '../useRowIndex'

describe('useRowIndex', () => {
  it('resolves source indexes after display reordering and controlled data replacement', () => {
    const first = { id: 1 }
    const second = { id: 2 }
    const tableData = ref([first, second])
    const resolveRowIndex = useRowIndex(() => tableData.value)

    expect(resolveRowIndex(first, 0)).toBe(0)
    expect(resolveRowIndex(second, 0)).toBe(1)

    tableData.value = [second, first]
    expect(resolveRowIndex(second, 0)).toBe(0)
    expect(resolveRowIndex(first, 1)).toBe(1)
  })

  it('warns once and rejects an ambiguous duplicate row reference', () => {
    const duplicate = { id: 1 }
    const other = { id: 2 }
    const tableData = ref([duplicate, other, duplicate])
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const resolveRowIndex = useRowIndex(() => tableData.value)

    expect(resolveRowIndex(duplicate, 1)).toBe(-1)
    expect(resolveRowIndex(duplicate, 1)).toBe(-1)
    expect(warn).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('same row object'))

    warn.mockRestore()
  })
})
