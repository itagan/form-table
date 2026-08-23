import type { FormTableValue, TableRow } from '../base'

export interface FormTableFieldChangePayload<TRow extends TableRow = TableRow> {
  row: TRow
  index: number
  fieldKey: string
  value: FormTableValue
  previousValue: FormTableValue
}

/** Element Table 事件中的运行时列对象；保留扩展字段以兼容不同 Element UI 版本。 */
export interface FormTableElementColumn {
  id?: string
  columnKey?: string
  label?: string
  property?: string
  prop?: string
  type?: string
  [key: string]: FormTableValue
}

/** Element Table sort-change 的原始载荷。 */
export interface FormTableSortChangePayload {
  column: FormTableElementColumn
  prop: string | null
  order: 'ascending' | 'descending' | null
}

/** Element Table filter-change 按 column-key 返回的筛选值。 */
export type FormTableFilterChangePayload = Record<string, FormTableValue[]>

export type FormTableEmits<TRow extends TableRow = TableRow> = {
  'update:tableData': (data: TRow[]) => void
  'field-change': (payload: FormTableFieldChangePayload<TRow>) => void
  'form-validate': (propPath: string, valid: boolean, message: string | null) => void
  'sort-change': (payload: FormTableSortChangePayload) => void
  'filter-change': (filters: FormTableFilterChangePayload) => void
  'current-change': (currentRow: TRow | null, oldCurrentRow: TRow | null) => void
  'header-click': (column: FormTableElementColumn, event: MouseEvent) => void
  'header-contextmenu': (column: FormTableElementColumn, event: MouseEvent) => void
  'header-dragend': (
    newWidth: number,
    oldWidth: number,
    column: FormTableElementColumn,
    event: MouseEvent
  ) => void
  'cell-click': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  'cell-dblclick': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  'cell-contextmenu': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  'cell-mouse-enter': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  'cell-mouse-leave': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  'row-click': (
    row: TRow,
    column: FormTableElementColumn,
    event: MouseEvent
  ) => void
  'row-dblclick': (
    row: TRow,
    column: FormTableElementColumn,
    event: MouseEvent
  ) => void
  'row-contextmenu': (
    row: TRow,
    column: FormTableElementColumn,
    event: MouseEvent
  ) => void
  'expand-change': (row: TRow, state: boolean | TRow[]) => void
  select: (selection: TRow[], row: TRow) => void
  'select-all': (selection: TRow[]) => void
  'selection-change': (selection: TRow[]) => void
}
