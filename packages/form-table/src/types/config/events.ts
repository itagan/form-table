import type { FormTableValue, TableRow } from '../base'

/** 单个字段成功写回后派发的变更详情。 */
export interface FormTableFieldChangePayload<TRow extends TableRow = TableRow> {
  /** 更新后的行对象。 */
  row: TRow
  /** 更新行在最新受控 tableData 中的数据源下标。 */
  index: number
  /** 本次变更的字段路径。 */
  fieldKey: string
  /** 字段更新后的值。 */
  value: FormTableValue
  /** 字段更新前的值。 */
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

/** FormTable 自身事件与透传的常用 Element Table 事件签名。 */
export type FormTableEmits<TRow extends TableRow = TableRow> = {
  /** 受控数据更新；也是根组件 v-model 使用的事件。 */
  'update:tableData': (data: TRow[]) => void
  /** 每个实际发生变化的字段在 update:tableData 后按 patch 顺序派发。 */
  'field-change': (payload: FormTableFieldChangePayload<TRow>) => void
  /** Element Form 单字段校验结果，propPath 对应 tableData 下的数据路径。 */
  'form-validate': (propPath: string, valid: boolean, message: string | null) => void
  /** Element Table 排序条件变化。 */
  'sort-change': (payload: FormTableSortChangePayload) => void
  /** Element Table 筛选条件变化。 */
  'filter-change': (filters: FormTableFilterChangePayload) => void
  /** Element Table 当前行变化。 */
  'current-change': (currentRow: TRow | null, oldCurrentRow: TRow | null) => void
  /** 点击列头。 */
  'header-click': (column: FormTableElementColumn, event: MouseEvent) => void
  /** 右键点击列头。 */
  'header-contextmenu': (column: FormTableElementColumn, event: MouseEvent) => void
  /** 拖动列宽结束。 */
  'header-dragend': (
    newWidth: number,
    oldWidth: number,
    column: FormTableElementColumn,
    event: MouseEvent
  ) => void
  /** 单击单元格。 */
  'cell-click': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  /** 双击单元格。 */
  'cell-dblclick': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  /** 右键点击单元格。 */
  'cell-contextmenu': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  /** 指针进入单元格。 */
  'cell-mouse-enter': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  /** 指针离开单元格。 */
  'cell-mouse-leave': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  /** 单击数据行。 */
  'row-click': (
    row: TRow,
    column: FormTableElementColumn,
    event: MouseEvent
  ) => void
  /** 双击数据行。 */
  'row-dblclick': (
    row: TRow,
    column: FormTableElementColumn,
    event: MouseEvent
  ) => void
  /** 右键点击数据行。 */
  'row-contextmenu': (
    row: TRow,
    column: FormTableElementColumn,
    event: MouseEvent
  ) => void
  /** 展开行状态变化；树形数据返回布尔值，展开行返回当前展开行集合。 */
  'expand-change': (row: TRow, state: boolean | TRow[]) => void
  /** 手动选择或取消选择单行。 */
  select: (selection: TRow[], row: TRow) => void
  /** 全选状态变化。 */
  'select-all': (selection: TRow[]) => void
  /** 当前选择集合变化。 */
  'selection-change': (selection: TRow[]) => void
}
