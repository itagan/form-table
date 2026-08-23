import type {
  FormTableFormProps,
  FormTableTableProps,
  FormTableValue,
  TableRow
} from '../base'
import type { ColumnConfig } from './column'
import type {
  EmptyFieldTypeRegistry,
  FieldTypeRegistry
} from './field'
import type { FormTableHintOptions } from './hint'

/** 行身份配置；字符串按字段路径读取，函数直接返回身份值。 */
export type FormTableRowKey<TRow extends TableRow = TableRow> =
  | string
  | ((row: TRow) => FormTableValue)

interface BaseFormTableProps<
  TRow extends TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow>
> {
  /** 受控表格数据，也是组件 v-model 对应的数据源。 */
  tableData: TRow[]
  /** 按顺序渲染的列配置。 */
  columns: ColumnConfig<TRow, TFieldTypes>[]
  /** 稳定行身份，用于排序、筛选或数据替换后安全定位更新目标。 */
  rowKey?: FormTableRowKey<TRow>
  /** 透传给 el-form 的属性；model 由 FormTable 管理。 */
  formProps?: FormTableFormProps
  /** 透传给 el-table 的属性；data 和 rowKey 由 FormTable 管理。 */
  tableProps?: FormTableTableProps
  /** 字段与表头的统一 Hint 展示策略。 */
  hintOptions?: FormTableHintOptions<TRow>
  /** 是否在表格区域显示 Element UI loading 遮罩。 */
  loading?: boolean
}

type FormTableFieldTypesProp<TFieldTypes> = keyof TFieldTypes extends never
  ? { fieldTypes?: never }
  : {
      /** 当前 FormTable 实例使用的自定义字段类型注册表。 */
      fieldTypes: TFieldTypes
    }

/** FormTable 的完整公共 Props，并将行类型与自定义字段注册表贯穿到列配置。 */
export type FormTableProps<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
> = BaseFormTableProps<TRow, TFieldTypes> & FormTableFieldTypesProp<TFieldTypes>
