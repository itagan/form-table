import type {
  FormTableArchivedEventName,
  FormTableEmitFn,
  TableRow
} from '../types'
import { archiveFormTableEventArgs } from '../utils/eventArchive'

export function useFormTableTableEvents(emit: FormTableEmitFn) {
  const emitTableEvent = (
    type: FormTableArchivedEventName,
    ...args: any[]
  ) => {
    ;(emit as any)(type, ...args)
    emit('event', { type, args: archiveFormTableEventArgs(type, args) })
  }

  const handleTableSelect = (selection: TableRow[], row: TableRow) => {
    emitTableEvent('select', selection, row)
  }

  const handleTableSelectAll = (selection: TableRow[]) => {
    emitTableEvent('select-all', selection)
  }

  const handleTableSelectionChange = (selection: TableRow[]) => {
    emitTableEvent('selection-change', selection)
  }

  const handleTableCellMouseEnter = (
    row: TableRow,
    column: any,
    cell: HTMLElement,
    event: Event
  ) => {
    emitTableEvent('cell-mouse-enter', row, column, cell, event)
  }

  const handleTableCellMouseLeave = (
    row: TableRow,
    column: any,
    cell: HTMLElement,
    event: Event
  ) => {
    emitTableEvent('cell-mouse-leave', row, column, cell, event)
  }

  const handleTableCellClick = (
    row: TableRow,
    column: any,
    cell: HTMLElement,
    event: Event
  ) => {
    emitTableEvent('cell-click', row, column, cell, event)
  }

  const handleTableCellDblclick = (
    row: TableRow,
    column: any,
    cell: HTMLElement,
    event: Event
  ) => {
    emitTableEvent('cell-dblclick', row, column, cell, event)
  }

  const handleTableRowClick = (row: TableRow, column: any, event: Event) => {
    emitTableEvent('row-click', row, column, event)
  }

  const handleTableRowContextmenu = (row: TableRow, column: any, event: Event) => {
    emitTableEvent('row-contextmenu', row, column, event)
  }

  const handleTableRowDblclick = (row: TableRow, column: any, event: Event) => {
    emitTableEvent('row-dblclick', row, column, event)
  }

  const handleTableHeaderClick = (column: any, event: Event) => {
    emitTableEvent('header-click', column, event)
  }

  const handleTableHeaderContextmenu = (column: any, event: Event) => {
    emitTableEvent('header-contextmenu', column, event)
  }

  const handleTableSortChange = (payload: any) => {
    emitTableEvent('sort-change', payload)
  }

  const handleTableFilterChange = (filters: any) => {
    emitTableEvent('filter-change', filters)
  }

  const handleTableCurrentChange = (
    currentRow: TableRow | null,
    oldCurrentRow: TableRow | null
  ) => {
    emitTableEvent('current-change', currentRow, oldCurrentRow)
  }

  const handleTableHeaderDragend = (
    newWidth: number,
    oldWidth: number,
    column: any,
    event: Event
  ) => {
    emitTableEvent('header-dragend', newWidth, oldWidth, column, event)
  }

  const handleTableExpandChange = (row: TableRow, expandedRows: TableRow[]) => {
    emitTableEvent('expand-change', row, expandedRows)
  }

  return {
    handleTableSelect,
    handleTableSelectAll,
    handleTableSelectionChange,
    handleTableCellMouseEnter,
    handleTableCellMouseLeave,
    handleTableCellClick,
    handleTableCellDblclick,
    handleTableRowClick,
    handleTableRowContextmenu,
    handleTableRowDblclick,
    handleTableHeaderClick,
    handleTableHeaderContextmenu,
    handleTableSortChange,
    handleTableFilterChange,
    handleTableCurrentChange,
    handleTableHeaderDragend,
    handleTableExpandChange
  }
}
