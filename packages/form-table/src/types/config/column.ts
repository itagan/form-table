import type {
  ComponentProps,
  DynamicValue,
  FormTableHintValue,
  FormTableRowPatch,
  TableRow
} from '../base'
import type {
  FormTableColumnContext,
  FormTableRowContext
} from '../context'
import type {
  EmptyFieldTypeRegistry,
  FieldTypeRegistry,
  FormItemConfig
} from './field'

interface BaseColumnConfig<TRow extends TableRow = TableRow> {
  /** 稳定列标识；动态增删或重排列时用于保持组件实例身份。 */
  key?: string
  /** 默认表头文本；也会作为 headerSlot 上下文中的回退 label。 */
  label: string
  /** 根 FormTable 上用于渲染表头内容的具名 Slot。 */
  headerSlot?: string
  /** 透传给 FormTable 管理的表头容器，可按当前列上下文动态计算。 */
  headerProps?: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
  /** 当前列表头的 Hint 内容；是否展示由全局 hintOptions 控制。 */
  headerHint?: DynamicValue<FormTableHintValue, FormTableColumnContext<TRow>>
  /** 是否渲染当前列，可按表数据和列配置动态计算。 */
  visible?: DynamicValue<boolean, FormTableColumnContext<TRow>>
  /** 透传给 el-table-column 的属性，可按当前列上下文动态计算。 */
  props?: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
}

/** 由 FormTableRow 和多个字段配置组成的表单布局列。 */
export interface LayoutColumnConfig<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
> extends BaseColumnConfig<TRow> {
  /** 透传给当前单元格 el-row 的属性。 */
  rowProps?: DynamicValue<ComponentProps, FormTableRowContext<TRow>>
  /** 当前列内按顺序渲染的字段配置。 */
  formItems: FormItemConfig<TRow, TFieldTypes>[]
  cellSlot?: never
}

/** 完全交给 Element UI 渲染的原生列，不创建 FormTable 单元格布局。 */
export interface NativeColumnConfig<TRow extends TableRow = TableRow> {
  /** 稳定列标识；未提供时会根据配置生成内部身份。 */
  key?: string
  /** 可选的表头文本；也可通过 props.label 直接交给 Element UI。 */
  label?: string
  /** 是否渲染当前列，可按表数据和列配置动态计算。 */
  visible?: DynamicValue<boolean, FormTableColumnContext<TRow>>
  /** 透传给 el-table-column 的属性；该字段用于区分原生列。 */
  props: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
  formItems?: never
  cellSlot?: never
  headerSlot?: never
  headerProps?: never
  headerHint?: never
  rowProps?: never
}

/** 使用根 FormTable 具名 Slot 完全接管单元格内容的列。 */
export interface CellSlotColumnConfig<TRow extends TableRow = TableRow> extends BaseColumnConfig<TRow> {
  /** 根 FormTable 上用于渲染每个单元格的具名 Slot。 */
  cellSlot: string
  formItems?: never
  rowProps?: never
}

export interface FormTableCellSlotContext<TRow extends TableRow = TableRow> {
  /** 当前数据行的只读视图。 */
  row: Readonly<TRow>
  /** 当前行在受控 tableData 中的数据源下标。 */
  index: number
  /** 当前行经过 Element Table 排序或筛选后的显示下标。 */
  displayIndex: number
  /** 当前 cellSlot 所属的列配置。 */
  columnConfig: Readonly<CellSlotColumnConfig<TRow>>
  /** 不可变地更新当前行；patch 的 key 支持字段路径。 */
  updateRow: (patch: FormTableRowPatch<TRow>) => void
}

/** FormTable 支持的三种列模式：表单布局列、单元格 Slot 列和原生 Element 列。 */
export type ColumnConfig<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
> =
  | LayoutColumnConfig<TRow, TFieldTypes>
  | CellSlotColumnConfig<TRow>
  | NativeColumnConfig<TRow>
