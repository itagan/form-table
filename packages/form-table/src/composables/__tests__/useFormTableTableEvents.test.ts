import { describe, expect, it, vi } from 'vitest'
import { useFormTableTableEvents } from '../useFormTableTableEvents'
import type { FormTableEmitFn, TableRow } from '../../types'

function createTableEventHandlers() {
  const emit = vi.fn() as unknown as FormTableEmitFn
  const handlers = useFormTableTableEvents(emit)

  return {
    emit: emit as unknown as ReturnType<typeof vi.fn>,
    handlers
  }
}

describe('useFormTableTableEvents', () => {
  it('emits selection-change and archives the same selection payload', () => {
    const { emit, handlers } = createTableEventHandlers()
    const selection: TableRow[] = [{ name: 'Alice' }]

    handlers.handleTableSelectionChange(selection)

    expect(emit).toHaveBeenNthCalledWith(1, 'selection-change', selection)
    expect(emit).toHaveBeenNthCalledWith(2, 'event', {
      type: 'selection-change',
      args: [selection]
    })
  })

  it('keeps row-click original args and archives column and DOM event safely', () => {
    const { emit, handlers } = createTableEventHandlers()
    const row = { name: 'Alice' }
    const column = {
      id: 'el-table_1_column_1',
      columnKey: 'name-column',
      property: 'name',
      label: '姓名',
      type: 'default',
      index: 0,
      noisyInternalState: { shouldNotArchive: true }
    }
    const event = new MouseEvent('click', {
      button: 0,
      clientX: 12,
      clientY: 34
    })

    handlers.handleTableRowClick(row, column, event)

    expect(emit).toHaveBeenNthCalledWith(1, 'row-click', row, column, event)
    expect(emit).toHaveBeenNthCalledWith(2, 'event', {
      type: 'row-click',
      args: [
        row,
        {
          id: 'el-table_1_column_1',
          columnKey: 'name-column',
          property: 'name',
          label: '姓名',
          type: 'default',
          index: 0
        },
        {
          type: 'click',
          button: 0,
          key: undefined,
          clientX: 12,
          clientY: 34
        }
      ]
    })
  })

  it('archives sort-change payload column without mutating the original payload', () => {
    const { emit, handlers } = createTableEventHandlers()
    const column = {
      id: 'el-table_1_column_2',
      property: 'age',
      label: '年龄',
      index: 1,
      store: { states: { columns: [] } }
    }
    const payload = {
      column,
      prop: 'age',
      order: 'ascending'
    }

    handlers.handleTableSortChange(payload)

    expect(emit).toHaveBeenNthCalledWith(1, 'sort-change', payload)
    expect(emit).toHaveBeenNthCalledWith(2, 'event', {
      type: 'sort-change',
      args: [
        {
          column: {
            id: 'el-table_1_column_2',
            columnKey: undefined,
            property: 'age',
            label: '年龄',
            type: undefined,
            index: 1
          },
          prop: 'age',
          order: 'ascending'
        }
      ]
    })
    expect(payload.column).toBe(column)
  })
})
