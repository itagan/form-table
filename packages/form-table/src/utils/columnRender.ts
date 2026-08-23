import type { TableRow } from '../types/base'
import type {
  CellSlotColumnConfig,
  ColumnConfig,
  LayoutColumnConfig,
  NativeColumnConfig
} from '../types/config/column'

interface PlainColumnRenderConfig<TRow extends TableRow> {
  kind: 'plain'
  column: NativeColumnConfig<TRow>
}

interface LayoutColumnRenderConfig<TRow extends TableRow> {
  kind: 'layout'
  column: LayoutColumnConfig<TRow>
  items: LayoutColumnConfig<TRow>['formItems']
  rowProps: LayoutColumnConfig<TRow>['rowProps']
}

interface CellSlotColumnRenderConfig<TRow extends TableRow> {
  kind: 'cell-slot'
  column: CellSlotColumnConfig<TRow>
  slotName: string
}

export type ColumnRenderConfig<TRow extends TableRow = TableRow> =
  | PlainColumnRenderConfig<TRow>
  | LayoutColumnRenderConfig<TRow>
  | CellSlotColumnRenderConfig<TRow>

const isCellSlotColumn = <TRow extends TableRow>(
  column: ColumnConfig<TRow>
): column is CellSlotColumnConfig<TRow> => 'cellSlot' in column

const isLayoutColumn = <TRow extends TableRow>(
  column: ColumnConfig<TRow>
): column is LayoutColumnConfig<TRow> => 'formItems' in column

/** 将公开列联合类型归一化为模板可直接消费的三种内部渲染模式。 */
export function resolveColumnRenderConfig<TRow extends TableRow>(
  column: ColumnConfig<TRow>
): ColumnRenderConfig<TRow> {
  if (isCellSlotColumn(column)) {
    return { kind: 'cell-slot', column, slotName: column.cellSlot }
  }
  if (isLayoutColumn(column)) {
    return {
      kind: 'layout',
      column,
      items: column.formItems || [],
      rowProps: column.rowProps
    }
  }
  return { kind: 'plain', column }
}
