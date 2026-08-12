import type { Component, PluginObject } from 'vue'
import FormTable, {
  FormTable as NamedFormTable,
  FormTablePlugin,
  createFormTable,
  defineFormTableColumns,
  type BuiltinFormItemType,
  type CellSlotColumnConfig,
  type ColumnConfig,
  type FieldModelConfig,
  type FormTableCellSlotContext,
  type FormTableExpose,
  type FormTableFieldHint,
  type FormTableFieldHintFormatter,
  type FormTableDefaultFieldHint,
  type FormTableHeaderSlotContext,
  type FormTableHint,
  type FormTableHintConfig,
  type FormTableHintOptions,
  type FormTableProps,
  type FormTableResolvedFieldContext,
  type LayoutColumnConfig,
  type PlainColumnConfig,
  type ResolvedFormTableHint,
  type ResolvedHeaderConfig,
  type TableRow
} from '../index'

// Element UI 未默认提供 Tree Select，不允许作为 FormTable 内置类型使用。
// @ts-expect-error tree-select 应通过 type: 'component' 显式接入
const unsupportedBuiltinType: BuiltinFormItemType = 'tree-select'
void unsupportedBuiltinType

// tag-input 是 el-select 的参数组合，不作为独立内置类型维护。
// @ts-expect-error 应使用 type: 'select' 配合 multiple/filterable/allowCreate
const redundantBuiltinAlias: BuiltinFormItemType = 'tag-input'
void redundantBuiltinAlias

const CustomInput: Component = { name: 'CustomInput' }
const AlternativeInput: Component = { name: 'AlternativeInput' }
const completeValueHint: FormTableHint = '完整字段值'
const disabledFieldHint: FormTableFieldHint = false
void disabledFieldHint
// @ts-expect-error 字段不再使用 true 强制 formatter。
const invalidFormattedFieldHint: FormTableFieldHint = true
// @ts-expect-error 表头使用的显式 FormTableHint 不接受 true。
const invalidExplicitHint: FormTableHint = true
const customValueHint: FormTableHintConfig = { content: '自行展示', behavior: 'custom' }
const resolvedValueHint: ResolvedFormTableHint = { content: '自行展示', behavior: 'custom' }
const resolvedContextHint: FormTableResolvedFieldContext['hint'] = resolvedValueHint
const objectValueHint: FormTableHint = { content: '自动展示' }
// @ts-expect-error Hint content 必须是字符串。
const invalidHintContent: FormTableHint = { content: 123 }
// @ts-expect-error Hint behavior 只接受 auto 或 custom。
const invalidHintBehavior: FormTableHint = { content: '错误配置', behavior: 'invalid' }
// @ts-expect-error 旧 ownership API 不再接受。
const legacyHintOwnership: FormTableHint = { content: '旧配置', ownership: 'custom' }
const rows: TableRow[] = [{ name: 'Alice', profile: { city: '杭州' } }]

interface PurchaseRow extends TableRow {
  name: string
  amount: number
}

const typedColumns = defineFormTableColumns<PurchaseRow>([{
  label: '采购信息',
  visible: ({ tableData }) => {
    tableData[0]?.amount.toFixed(2)
    // @ts-expect-error known business fields keep their declared value types.
    tableData[0]?.name.toFixed(2)
    return true
  },
  children: [{
    children: [{
      fieldKey: 'amount',
      type: 'input',
      component: {
        props: ({ row }) => ({ placeholder: row.name }),
        listeners: {
          change(context) {
            context.updateRow({ amount: 100 })
            // @ts-expect-error updateRow preserves known business field value types.
            context.updateRow({ amount: 'invalid' })
          }
        }
      }
    }]
  }]
}])
const TypedFormTable = createFormTable<PurchaseRow>()
const typedComponent: Component = TypedFormTable
void typedComponent
type TypedFormTableProps = InstanceType<typeof TypedFormTable>['$props']
const typedComponentProps: TypedFormTableProps = {
  tableData: [{ name: '采购单', amount: 10 }],
  columns: typedColumns,
  rowKey: row => row.amount
}
if (typeof typedComponentProps.rowKey === 'function') {
  typedComponentProps.rowKey({ name: '采购单', amount: 10 })
}
const invalidTypedComponentProps: TypedFormTableProps = {
  // @ts-expect-error generic component tableData must use PurchaseRow.
  tableData: [{ name: '缺少金额' }],
  columns: typedColumns
}
void invalidTypedComponentProps
declare const typedFormTableInstance: InstanceType<typeof TypedFormTable>
typedFormTableInstance.$emit('update:tableData', [{ name: '更新', amount: 20 }])
typedFormTableInstance.$emit('field-change', {
  row: { name: '更新', amount: 20 },
  index: 0,
  fieldKey: 'amount',
  value: 20,
  previousValue: 10
})
// @ts-expect-error field-change rows must preserve the generic business row shape.
typedFormTableInstance.$emit('field-change', { row: { name: '缺少金额' }, index: 0 })
const columns: ColumnConfig[] = [{
  label: '基本信息',
  headerHint: ({ tableData, columnConfig }) => `${columnConfig.label}：${tableData.length} 条`,
  headerProps: ({ columnConfig }) => ({ 'aria-label': columnConfig.label }),
  children: [{
    props: { gutter: 8 },
    children: [
      {
        fieldKey: 'name',
        type: 'input',
        hint: ({ value }) => value ? String(value) : completeValueHint,
        colProps: { span: 8 },
        formItemProps: { label: '姓名', rules: [{ required: true }] },
        component: { props: ({ value }) => ({ clearable: true, title: String(value ?? '') }) }
      },
      {
        fieldKey: 'profile.city',
        type: 'component',
        component: { renderer: CustomInput }
      },
      {
        fieldKey: 'actions',
        type: 'slot',
        hint: ({ row }) => ({ content: String(row.name || ''), behavior: 'custom' }),
        component: {
          renderer: 'actions',
          props: ({ row }) => ({ disabled: Boolean(row.locked) })
        }
      }
    ]
  }]
}]
void customValueHint
void invalidFormattedFieldHint
void invalidExplicitHint
void resolvedValueHint
void resolvedContextHint
void objectValueHint
void invalidHintContent
void invalidHintBehavior
void legacyHintOwnership

const cellSlotColumn: CellSlotColumnConfig = {
  key: 'actions-column',
  label: '操作',
  cellSlot: 'row-actions',
  props: { width: 120 }
}
const layoutColumn: LayoutColumnConfig = {
  label: '姓名',
  children: [{ children: [{ fieldKey: 'name', type: 'input' }] }]
}
const plainColumns: PlainColumnConfig[] = [
  { props: { type: 'selection', width: 48 } },
  { label: '序号', props: { type: 'index', width: 64 } }
]
const expandSlotColumn: CellSlotColumnConfig = {
  label: '详情',
  props: { type: 'expand' },
  cellSlot: 'row-detail'
}
// @ts-expect-error plain columns require props to explicitly select passthrough mode.
const emptyPlainColumn: PlainColumnConfig = {}
// @ts-expect-error plain columns do not enter the Row/Item rendering chain.
const plainColumnWithChildren: PlainColumnConfig = { props: { type: 'index' }, children: [] }
// @ts-expect-error native Element column props stay inside props.
const topLevelNativeType: ColumnConfig = { type: 'selection', props: { width: 48 } }
// @ts-expect-error cellSlot columns do not accept Row/Item children.
const mixedColumnModes: ColumnConfig = {
  label: '错误列模式',
  cellSlot: 'row-actions',
  children: []
}

const customModel: FieldModelConfig = {
  prop: 'selectedId',
  event: 'select',
  valueFromEvent: (...args) => (args[0] as { id: string }).id
}

const modelVariants: ColumnConfig[] = [{
  label: '组件绑定协议',
  children: [{
    children: [
      {
        fieldKey: 'ownerId',
        type: 'component',
        component: { renderer: CustomInput, model: customModel }
      },
      {
        fieldKey: 'enabled',
        type: 'component',
        component: { renderer: CustomInput, model: true }
      },
      {
        fieldKey: 'summary',
        type: 'component',
        component: { renderer: CustomInput, model: false }
      }
    ]
  }]
}]

const dynamicRendererVariants: ColumnConfig[] = [{
  label: '按行解析组件',
  children: [{
    children: [
      {
        fieldKey: 'profile',
        type: 'component',
        component: {
          resolveRenderer: ({ row, fieldKey, value }) => {
            void fieldKey
            void value
            return row.kind === 'alternative' ? AlternativeInput : CustomInput
          }
        }
      },
      {
        fieldKey: 'name',
        type: 'component',
        component: {
          renderer: CustomInput,
          resolveRenderer: ({ row }) => row.useDefault ? undefined : AlternativeInput
        }
      }
    ]
  }]
}]

const props: FormTableProps = {
  tableData: rows,
  columns,
  rowKey: 'id',
  formProps: { size: 'small' },
  tableProps: { border: true },
  hintOptions: {
    mode: 'tooltip',
    props: { placement: 'top', openDelay: 200 }
  }
}
const functionRowKeyProps: FormTableProps<PurchaseRow> = {
  tableData: [{ name: '采购单', amount: 10 }],
  columns: typedColumns,
  rowKey: row => row.name
}
const legacyRowKeyProps: FormTableProps = {
  tableData: rows,
  columns,
  tableProps: {
    // @ts-expect-error rowKey is a top-level FormTable prop.
    rowKey: 'id'
  }
}
const titleHintOptions: FormTableHintOptions = { mode: 'title' }
const tooltipHintOptions: FormTableHintOptions = {
  mode: 'tooltip',
  props: { placement: 'bottom' }
}
const typedFieldFormatter: FormTableFieldHintFormatter<PurchaseRow> = ({ value, row }) => (
  `${row.name}:${String(value)}`
)
const typedDefaultFieldHint: FormTableDefaultFieldHint<PurchaseRow> = typedFieldFormatter
const typedHintOptions: FormTableHintOptions<PurchaseRow> = {
  mode: 'tooltip',
  field: typedDefaultFieldHint
}
const defaultStringHintOptions: FormTableHintOptions<PurchaseRow> = { field: true }
const disabledGlobalHintOptions: FormTableHintOptions<PurchaseRow> = { field: false }
void defaultStringHintOptions
void disabledGlobalHintOptions
const legacyFieldHintOptions: FormTableHintOptions<PurchaseRow> = {
  // @ts-expect-error 旧 field.enabled/formatter 对象不再接受。
  field: { enabled: true, formatter: typedFieldFormatter }
}
void legacyFieldHintOptions
void typedHintOptions
// @ts-expect-error title 模式不接受 Tooltip 属性。
const invalidTitleHintOptions: FormTableHintOptions = { mode: 'title', props: {} }
const legacyHintModeProps: FormTableProps = {
  tableData: rows,
  columns,
  // @ts-expect-error hintMode 已由 hintOptions 替代。
  hintMode: 'tooltip'
}
const legacyHintTooltipProps: FormTableProps = {
  tableData: rows,
  columns,
  // @ts-expect-error hintTooltipProps 已收敛到 hintOptions.props。
  hintTooltipProps: { placement: 'top' }
}
void titleHintOptions
void tooltipHintOptions
void invalidTitleHintOptions
void legacyHintModeProps
void legacyHintTooltipProps
const component: Component = FormTable
const named: Component = NamedFormTable
const plugin: PluginObject<undefined> = FormTablePlugin

async function useExpose(expose: FormTableExpose) {
  await expose.validate()
  expose.clearValidate()
  return expose.getTableRef()
}

const invalid: ColumnConfig[] = [{
  label: '错误配置',
  children: [{
    children: [{
      fieldKey: 'bad',
      // @ts-expect-error unknown type aliases are rejected.
      type: 'unknown'
    }]
  }]
}]

const invalidModes: ColumnConfig[] = [{
  label: '渲染模式约束',
  children: [{
    children: [
      // @ts-expect-error builtin modes resolve their own renderer.
      { fieldKey: 'name', type: 'input', component: { renderer: CustomInput } },
      // @ts-expect-error component mode requires renderer or resolveRenderer.
      { fieldKey: 'custom', type: 'component', component: { props: {} } },
      // @ts-expect-error builtin modes cannot dynamically replace their renderer.
      { fieldKey: 'dynamic-input', type: 'input', component: { resolveRenderer: () => CustomInput } },
      // @ts-expect-error slot renderer must be a string name.
      { fieldKey: 'actions', type: 'slot', component: { renderer: CustomInput } },
      // @ts-expect-error slot names remain static and do not use component resolution.
      { fieldKey: 'dynamic-slot', type: 'slot', component: { renderer: 'actions', resolveRenderer: () => CustomInput } },
      // @ts-expect-error component resolution is synchronous and does not accept Promise results.
      { fieldKey: 'async-renderer', type: 'component', component: { resolveRenderer: async () => CustomInput } }
    ]
  }]
}]

const renamedColumn: ColumnConfig = {
  label: '新字段名',
  // @ts-expect-error ColumnConfig uses label; legacy name is not accepted.
  name: '旧字段名',
  children: []
}

const renamedItem: ColumnConfig = {
  label: '字段路径',
  children: [{
    children: [
      // @ts-expect-error key is only the render identity; fieldKey remains required.
      { key: 'name', type: 'input' }
    ]
  }]
}

const keyedItem: ColumnConfig = {
  label: '稳定字段身份',
  children: [{
    children: [{ key: 'primary-name', fieldKey: 'name', type: 'input' }]
  }]
}

const legacySlotString: ColumnConfig = {
  label: '旧 slot 写法',
  children: [{
    children: [
      // @ts-expect-error standalone slot field was replaced by type: 'slot' + component.renderer.
      { fieldKey: 'actions', slot: 'actions' }
    ]
  }]
}

const legacyComponentIs: ColumnConfig = {
  label: '旧组件写法',
  children: [{
    children: [
      // @ts-expect-error component mode requires type: 'component' + component.renderer.
      { fieldKey: 'custom', component: { is: CustomInput } }
    ]
  }]
}

const contextBoundaries: ColumnConfig[] = [{
  label: '上下文边界',
  visible: (tableContext) => {
    void tableContext.tableData
    void tableContext.columnConfig
    // @ts-expect-error configuration references are read-only.
    tableContext.columnConfig.label = '修改'
    // @ts-expect-error column callbacks do not have a current row.
    void tableContext.row
    return true
  },
  children: [{
    visible: (rowContext) => {
      void rowContext.row
      void rowContext.index
      void rowContext.columnConfig
      void rowContext.rowConfig
      // @ts-expect-error row callbacks do not have a current field.
      void rowContext.fieldKey
      return true
    },
    children: [{
      fieldKey: 'name',
      type: 'input',
      visible: (fieldContext) => {
        void fieldContext.row
        void fieldContext.index
        void fieldContext.fieldKey
        void fieldContext.value
        void fieldContext.columnConfig
        void fieldContext.rowConfig
        void fieldContext.itemConfig
        // @ts-expect-error configuration references are read-only.
        fieldContext.itemConfig.fieldKey = 'other'
        return true
      },
      component: {
        listeners: {
          change(fieldContext) {
            // @ts-expect-error callback rows are read-only; use updateRow instead.
            fieldContext.row.name = 'Bob'
            fieldContext.updateRow({ name: 'Bob' })
          }
        }
      }
    }]
  }]
}]

declare const headerContext: FormTableHeaderSlotContext
void headerContext.columnIndex
void headerContext.columnConfig.key
const resolvedHeader: ResolvedHeaderConfig = headerContext.header
void resolvedHeader.props
void resolvedHeader.hint
// @ts-expect-error header slot column configuration is read-only.
headerContext.columnConfig.label = '新表头'
// @ts-expect-error legacy column alias is not exposed.
void headerContext.column

declare const cellSlotContext: FormTableCellSlotContext
void cellSlotContext.row
void cellSlotContext.index
void cellSlotContext.columnConfig.cellSlot
cellSlotContext.updateRow({ name: 'Bob' })
// @ts-expect-error cellSlot rows are read-only; use updateRow instead.
cellSlotContext.row.name = 'Bob'
// @ts-expect-error cellSlot context has no field binding semantics.
void cellSlotContext.fieldKey
// @ts-expect-error cellSlot column configuration is read-only.
cellSlotContext.columnConfig.label = '新操作'

void props
void functionRowKeyProps
void legacyRowKeyProps
void typedColumns
void cellSlotColumn
void layoutColumn
void plainColumns
void expandSlotColumn
void emptyPlainColumn
void plainColumnWithChildren
void topLevelNativeType
void mixedColumnModes
void modelVariants
void dynamicRendererVariants
void component
void named
void plugin
void useExpose
void invalid
void invalidModes
void renamedColumn
void renamedItem
void keyedItem
void legacySlotString
void legacyComponentIs
void contextBoundaries
