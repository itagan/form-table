import type {
  FormTableArchivedEventName,
  FormTableEmits,
  FormTableEmitFn,
  FormTableValue,
  TableRow
} from '../types'
import { archiveFormTableEventArgs } from '../utils/eventArchive'

export function useFormTableTableEvents(emit: FormTableEmitFn) {
  const emitTableEvent = <K extends FormTableArchivedEventName>(
    type: K,
    ...args: FormTableEmits[K]
  ) => {
    emit(type, ...args)
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
    column: FormTableValue,
    cell: HTMLElement,
    event: Event
  ) => {
    emitTableEvent('cell-mouse-enter', row, column, cell, event)
  }

  const handleTableCellMouseLeave = (
    row: TableRow,
    column: FormTableValue,
    cell: HTMLElement,
    event: Event
  ) => {
    emitTableEvent('cell-mouse-leave', row, column, cell, event)
  }

  const handleTableCellClick = (
    row: TableRow,
    column: FormTableValue,
    cell: HTMLElement,
    event: Event
  ) => {
    emitTableEvent('cell-click', row, column, cell, event)
  }

  const handleTableCellDblclick = (
    row: TableRow,
    column: FormTableValue,
    cell: HTMLElement,
    event: Event
  ) => {
    emitTableEvent('cell-dblclick', row, column, cell, event)
  }

  const handleTableRowClick = (row: TableRow, column: FormTableValue, event: Event) => {
    emitTableEvent('row-click', row, column, event)
  }

  const handleTableRowContextmenu = (row: TableRow, column: FormTableValue, event: Event) => {
    emitTableEvent('row-contextmenu', row, column, event)
  }

  const handleTableRowDblclick = (row: TableRow, column: FormTableValue, event: Event) => {
    emitTableEvent('row-dblclick', row, column, event)
  }

  const handleTableHeaderClick = (column: FormTableValue, event: Event) => {
    emitTableEvent('header-click', column, event)
  }

  const handleTableHeaderContextmenu = (column: FormTableValue, event: Event) => {
    emitTableEvent('header-contextmenu', column, event)
  }

  const handleTableSortChange = (payload: FormTableValue) => {
    emitTableEvent('sort-change', payload)
  }

  const handleTableFilterChange = (filters: FormTableValue) => {
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
    column: FormTableValue,
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
