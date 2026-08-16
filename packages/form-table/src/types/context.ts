import type {
  ColumnConfig,
  FormItemConfig
} from './config'
import type { FormTableRowPatch, FormTableValue, TableRow } from './base'

export interface FormTableTableContext<TRow extends TableRow = TableRow> {
  /** 当前受控表格数据，只读以避免动态配置直接修改 props。 */
  tableData: ReadonlyArray<TRow>
}

export interface FormTableColumnContext<TRow extends TableRow = TableRow> extends FormTableTableContext<TRow> {
  /** 当前列配置。 */
  columnConfig: Readonly<ColumnConfig<TRow>>
}

export interface FormTableRowContext<TRow extends TableRow = TableRow> extends FormTableColumnContext<TRow> {
  /** 当前数据行。 */
  row: Readonly<TRow>
  /** 当前数据行在 tableData 中的渲染下标。 */
  index: number
}

export interface FormTableFieldRenderContext<TRow extends TableRow = TableRow> extends FormTableRowContext<TRow> {
  /** 支持点路径和数组下标的字段路径。 */
  fieldKey: string
  /** 按 fieldKey 从当前行读取的字段值。 */
  value: FormTableValue
  /** 当前字段配置。 */
  itemConfig: Readonly<FormItemConfig<TRow>>
}

export interface FormTableFieldContext<TRow extends TableRow = TableRow> extends FormTableFieldRenderContext<TRow> {
  /** 不可变地更新当前字段。 */
  setValue: (value: FormTableValue) => void
  /** 不可变地批量更新当前行，patch 的 key 支持字段路径。 */
  updateRow: (patch: FormTableRowPatch<TRow>) => void
}

export interface FormTableUpdateApi<TRow extends TableRow = TableRow> {
  /** 组件内部更新入口；通过行身份重新定位，不依赖可能过期的渲染下标。 */
  setValue: (row: TRow, fieldKey: string, value: FormTableValue) => void
  updateRow: (row: TRow, patch: FormTableRowPatch<TRow>) => void
}
