import type { Component } from 'vue'
import FormTable, {
  FormTable as NamedFormTable,
  createFormTable,
  defineFormTableColumns,
  defineFormTableType,
  defineFormTableTypes,
  type BuiltinFormItemType,
  type CellSlotColumnConfig,
  type ColumnConfig,
  type FieldBindingConfig,
  type FieldBindingMapEntry,
  type FieldComponentConfig,
  type FieldComponentResolver,
  type FieldModelConfig,
  type FormItemConfig,
  type FormTableCellSlotContext,
  type FormTableElementColumn,
  type FormTableEmits,
  type FormTableExpose,
  type FormTableFieldBindingContext,
  type FormTableFieldRenderContext,
  type FormTableFormItemErrorSlotContext,
  type FormTableFormItemSlotContext,
  type FormTableHintValue,
  type FormTableFieldHintFormatter,
  type FormTableFilterChangePayload,
  type FormTableFormItemProps,
  type FormTableFormProps,
  type FormTableHeaderSlotContext,
  type FormTableHintMode,
  type FormTableHintTrigger,
  type FormTableHintTargets,
  type FormTableHintOptions,
  type FormTableProps,
  type FormTableRowPatch,
  type FormTableSortChangePayload,
  type FormTableTableProps,
  type LayoutColumnConfig,
  type NativeColumnConfig,
  type TableRow
} from '../index'

type PublicRuntimeEntry = typeof import('../index')
// @ts-expect-error 严格字段路径助手已从轻量公共入口移除。
type RemovedFieldHelper = PublicRuntimeEntry['createFormTableField']
void (null as unknown as RemovedFieldHelper)
// @ts-expect-error 布局 Row 已收平，不再导出 RowConfig。
type RemovedRowConfig = import('../index').RowConfig
void (null as unknown as RemovedRowConfig)
// @ts-expect-error 字段联合的内部分支类型不再从包入口导出。
type RemovedBuiltinFormItemConfig = import('../index').BuiltinFormItemConfig
// @ts-expect-error 字段联合的内部分支类型不再从包入口导出。
type RemovedComponentFormItemConfig = import('../index').ComponentFormItemConfig
// @ts-expect-error 字段联合的内部分支类型不再从包入口导出。
type RemovedSlotFormItemConfig = import('../index').SlotFormItemConfig
// @ts-expect-error 内部渲染联合不再作为独立公共类型。
type RemovedFormItemType = import('../index').FormItemType
// @ts-expect-error Slot 解析结果通过 FormTableSlotContext 获取，不单独导出。
type RemovedResolvedComponentConfig = import('../index').ResolvedComponentConfig
// @ts-expect-error 字段默认 Hint 通过 FormTableHintOptions['field'] 表达。
type RemovedDefaultFieldHint = import('../index').FormTableDefaultFieldHint
// @ts-expect-error 纯内部表级上下文不再从包入口导出。
type RemovedTableContext = import('../index').FormTableTableContext
// @ts-expect-error 原生 Element 列类型已统一命名为 NativeColumnConfig。
type RemovedPlainColumnConfig = import('../index').PlainColumnConfig
void (null as unknown as RemovedBuiltinFormItemConfig)
void (null as unknown as RemovedComponentFormItemConfig)
void (null as unknown as RemovedSlotFormItemConfig)
void (null as unknown as RemovedFormItemType)
void (null as unknown as RemovedResolvedComponentConfig)
void (null as unknown as RemovedDefaultFieldHint)
void (null as unknown as RemovedTableContext)
void (null as unknown as RemovedPlainColumnConfig)

// Element UI 未默认提供 Tree Select，不允许作为 FormTable 内置类型使用。
// @ts-expect-error tree-select 应通过 type: 'component' 显式接入
const unsupportedBuiltinType: BuiltinFormItemType = 'tree-select'
void unsupportedBuiltinType

// tag-input 是 el-select 的参数组合，不作为独立内置类型维护。
// @ts-expect-error 应使用 type: 'select' 配合 multiple/filterable/allowCreate
const redundantBuiltinAlias: BuiltinFormItemType = 'tag-input'
void redundantBuiltinAlias

// Input 和 DatePicker 的具体模式通过 component.props.type 表达。
// @ts-expect-error textarea 不再是独立内置类型
const removedTextareaAlias: BuiltinFormItemType = 'textarea'
// @ts-expect-error datetime 不再是独立内置类型
const removedDatetimeAlias: BuiltinFormItemType = 'datetime'
void removedTextareaAlias
void removedDatetimeAlias

// el-upload 依赖 file-list、生命周期回调和触发内容，不使用字段默认 v-model 协议。
// @ts-expect-error upload 应通过 type: 'component' 或 type: 'slot' 显式接入
const unsupportedUploadBuiltin: BuiltinFormItemType = 'upload'
void unsupportedUploadBuiltin

const CustomInput: Component = { name: 'CustomInput' }
const AlternativeInput: Component = { name: 'AlternativeInput' }
const completeValueHint: FormTableHintValue = '完整字段值'
const disabledFieldHint: FormTableHintValue = false
void disabledFieldHint
const disabledHintMode: FormTableHintMode = false
const contentHintTrigger: FormTableHintTrigger = 'content'
const fieldHintTargets: FormTableHintTargets = 'field'
void contentHintTrigger
// @ts-expect-error Hint 不再接受配置对象。
const invalidObjectHint: FormTableHintValue = { content: '自动展示' }
const rows: TableRow[] = [{ name: 'Alice', profile: { city: '杭州' } }]

interface BusinessRow extends TableRow {
  employeeId: string
  employeeName: string
  departmentId: string
}

interface EmployeeTypeProps {
  clearable?: boolean
  departmentId?: string
  disabled?: boolean
}

interface EmployeeSelection {
  id: string
  name: string
}

type EmployeeTypeEvents = {
  'user-confirm': [employee: EmployeeSelection, meta: { source: string }]
  search: [keyword: string]
}

const employeeTypeDefinition = defineFormTableType<BusinessRow>()<
  EmployeeTypeProps,
  EmployeeTypeEvents
>({
  is: CustomInput,
  model: {
    prop: 'selectedId',
    event: 'user-confirm',
    valueToProp: (context, value) => ({
      id: value,
      departmentId: context.row.departmentId
    }),
    valueFromEvent: (context, employee, meta) => {
      const departmentId: string = context.row.departmentId
      const employeeId: string = employee.id
      const source: string = meta.source
      // @ts-expect-error model 转换上下文中的业务行只读。
      context.row.departmentId = 'changed'
      void departmentId
      void source
      return employeeId
    }
  },
  props: ({ row, bindingValue }) => ({
    departmentId: row.departmentId,
    disabled: bindingValue == null
  })
})

const directlyTypedEmployeeItem: FormItemConfig<BusinessRow, {
  employee: typeof employeeTypeDefinition
}> = {
  fieldKey: 'employeeId',
  type: 'employee',
  component: {
    model: {
      event: 'user-confirm',
      valueFromEvent(context, employee, meta) {
        const currentEmployeeId: unknown = context.value
        const employeeName: string = employee.name
        const source: string = meta.source
        void currentEmployeeId
        void employeeName
        void source
        return employee.id
      }
    },
    props: {
      // @ts-expect-error 显式协议不接受未声明属性。
      directUnknownProp: true
    },
    listeners: {
      // @ts-expect-error 已声明事件的原始参数类型来自显式协议。
      search(_context, keyword: number) {
        keyword.toFixed()
      }
    }
  }
}
void directlyTypedEmployeeItem

const invalidEmployeeModel: FieldModelConfig<BusinessRow, EmployeeTypeEvents> = {
  // @ts-expect-error model event 必须来自显式字段事件表。
  event: 'missing-event'
}
void invalidEmployeeModel

const employeeSearchModel: FieldModelConfig<BusinessRow, EmployeeTypeEvents> = {
  event: 'search',
  valueFromEvent(context, keyword) {
    const sourceIndex: number = context.index
    const normalizedKeyword: string = keyword.toUpperCase()
    void sourceIndex
    return normalizedKeyword
  }
}
void employeeSearchModel

const invalidEmployeeSearchModel: FieldModelConfig<BusinessRow, EmployeeTypeEvents> = {
  event: 'search',
  // @ts-expect-error search 事件参数由事件表约束为 string。
  valueFromEvent(_context, keyword: number) {
    return keyword
  }
}
void invalidEmployeeSearchModel

// @ts-expect-error Item 覆盖 model 时仍必须使用注册字段事件。
const invalidEmployeeItemModel: FormItemConfig<BusinessRow, {
  employee: typeof employeeTypeDefinition
}> = {
  fieldKey: 'employeeId',
  type: 'employee',
  component: {
    model: {
      event: 'missing-event'
    }
  }
}
void invalidEmployeeItemModel

type DirectEmployeeItem = Extract<FormItemConfig<BusinessRow, {
  employee: typeof employeeTypeDefinition
}>, { type: 'employee' }>
type DirectEmployeeListeners = NonNullable<NonNullable<DirectEmployeeItem['component']>['listeners']>
// @ts-expect-error listener key 应仅包含显式协议事件。
const invalidDirectEmployeeListenerKey: keyof DirectEmployeeListeners = 'direct-missing-event'
void invalidDirectEmployeeListenerKey

const businessModel: FieldModelConfig<BusinessRow> = {
  valueToProp(context, value) {
    const departmentId: string = context.row.departmentId
    return { value, departmentId }
  }
}
declare const businessRenderContext: FormTableFieldRenderContext<BusinessRow>
declare const businessBindingContext: FormTableFieldBindingContext<BusinessRow>
businessModel.valueToProp?.(businessRenderContext, 'employee-1')
const businessBindingValue: unknown = businessBindingContext.bindingValue
// @ts-expect-error 组件 Props 上下文中的绑定值只读。
businessBindingContext.bindingValue = 'employee-2'
// @ts-expect-error 组件 Props 上下文只读，不提供更新助手。
businessBindingContext.setBindingValue('employee-2')
// @ts-expect-error 组件 Props 上下文只读，不提供行更新助手。
businessBindingContext.updateRow({ employeeName: 'Bob' })
// @ts-expect-error valueToProp 统一以只读字段上下文作为首参。
businessModel.valueToProp?.('employee-1', businessRenderContext)
void businessBindingValue
void businessModel

const businessTypeRegistry = {
  employee: employeeTypeDefinition,
  statusDisplay: { is: CustomInput, model: false as const }
}
const businessFieldTypes = defineFormTableTypes<BusinessRow>()(businessTypeRegistry)

defineFormTableTypes<BusinessRow>()({
  // @ts-expect-error 内置名称不能注册为自定义 type。
  input: { is: CustomInput }
})

const businessColumns = defineFormTableColumns<BusinessRow, typeof businessFieldTypes>([{
  label: '业务字段',
  formItems: [{
    fieldKey: 'employeeId',
    type: 'employee',
    component: {
      props: ({ row, bindingValue }) => ({
        disabled: !row.departmentId || bindingValue == null
      }),
      listeners: {
        'user-confirm'({ updateRow }, employee, meta) {
          updateRow({ employeeName: employee.name })
          meta.source.toLowerCase()
        },
        search(_context, keyword) {
          keyword.toLowerCase()
        }
      },
      model: { prop: 'selectedId', event: 'user-confirm' }
    }
  }, {
    fieldKey: 'employeeName',
    type: 'statusDisplay'
  }]
}])

defineFormTableColumns<BusinessRow, typeof businessFieldTypes>([{
  label: '错误业务字段协议',
  formItems: [{
    fieldKey: 'employeeId',
    type: 'employee',
    component: {
      listeners: {
        // @ts-expect-error user-confirm 首个原始参数必须是 EmployeeSelection。
        'user-confirm'(_context, employee: string) {
          employee.toLowerCase()
        }
      }
    }
  }]
}])

defineFormTableColumns<BusinessRow, typeof businessFieldTypes>([{
  label: '拼写错误',
  formItems: [{
    fieldKey: 'employeeId',
    // @ts-expect-error 自定义 type 必须来自当前注册表。
    type: 'employe'
  }]
}])

defineFormTableColumns<BusinessRow, typeof businessFieldTypes>([{
  label: '禁止目标覆盖',
  formItems: [
    // @ts-expect-error 自定义 type 的 Item 不允许覆盖组件目标。
    {
      fieldKey: 'employeeId',
      type: 'employee',
      component: {
        is: CustomInput
      }
    }]
}])

const BusinessFormTable = createFormTable<BusinessRow, typeof businessFieldTypes>()
const businessProps: InstanceType<typeof BusinessFormTable>['$props'] = {
  tableData: [{ employeeId: '', employeeName: '', departmentId: '' }],
  columns: businessColumns,
  fieldTypes: businessFieldTypes
}
void businessProps

// @ts-expect-error 使用非空注册表泛型时 fieldTypes 是必填 Prop。
const missingBusinessFieldTypes: InstanceType<typeof BusinessFormTable>['$props'] = {
  tableData: [],
  columns: businessColumns
}
void missingBusinessFieldTypes

const otherFieldTypes = defineFormTableTypes<BusinessRow>()({
  other: { is: CustomInput }
})
const mismatchedBusinessProps: InstanceType<typeof BusinessFormTable>['$props'] = {
  tableData: [],
  columns: businessColumns,
  // @ts-expect-error fieldTypes 必须与组件和 columns 使用同一注册表类型。
  fieldTypes: otherFieldTypes
}
void mismatchedBusinessProps

const componentVariantColumns: ColumnConfig[] = [{
  label: '组件模式',
  formItems: [
    { fieldKey: 'description', type: 'input', component: { props: { type: 'textarea' } } },
    { fieldKey: 'startedAt', type: 'date', component: { props: { type: 'datetime' } } },
    {
      fieldKey: 'appointmentTime',
      type: 'time-select',
      component: { props: { pickerOptions: { start: '08:00', step: '00:30', end: '18:00' } } }
    }
  ]
}]
void componentVariantColumns

const separatedDynamicContexts = defineFormTableColumns<BusinessRow>([{
  label: '动态上下文边界',
  formItems: [{
    fieldKey: 'employeeId',
    type: 'component',
    component: {
      is: CustomInput,
      resolveComponent(context) {
        // @ts-expect-error 组件解析只读取字段渲染上下文。
        void context.bindingValue
        return AlternativeInput
      },
      props({ bindingValue }) {
        return { selection: bindingValue }
      }
    }
  }, {
    fieldKey: 'departmentId',
    type: 'select',
    component: {
      options(context) {
        // @ts-expect-error 选项解析不扩展复合绑定值。
        void context.bindingValue
        return []
      },
      optionProps(context) {
        // @ts-expect-error 选项属性解析不扩展复合绑定值。
        void context.bindingValue
        return { value: 'value', label: 'label' }
      }
    }
  }]
}])
void separatedDynamicContexts

const contentHintColumns: ColumnConfig[] = [{
  label: '紧凑提示',
  formItems: [{ fieldKey: 'enabled', type: 'switch', hint: '是否启用', hintTrigger: 'content' }]
}]
void contentHintColumns
const invalidHintTriggerColumns: ColumnConfig[] = [{
  label: '错误触发区域',
  formItems: [{
    fieldKey: 'enabled', type: 'switch', hint: '是否启用',
    // @ts-expect-error Hint 触发区域只接受 item/content。
    hintTrigger: 'component'
  }]
}]
void invalidHintTriggerColumns

interface PurchaseRow {
  name: string
  amount: number
  profile?: {
    city: string
  }
  items?: Array<{
    name: string
  }>
}

const typedColumns = defineFormTableColumns<PurchaseRow>([{
  label: '采购信息',
  visible: ({ tableData }) => {
    tableData[0]?.amount.toFixed(2)
    // @ts-expect-error known business fields keep their declared value types.
    tableData[0]?.name.toFixed(2)
    return true
  },
  formItems: [{
      fieldKey: 'amount',
      type: 'input',
      component: {
        props: ({ row }) => ({ placeholder: row.name }),
        listeners: {
          change(context) {
            context.updateRow({ amount: 100 })
            context.updateRow({ 'profile.city': '杭州' })
            context.updateRow({ 'items[0].name': '采购项' })
            // @ts-expect-error updateRow preserves known business field value types.
            context.updateRow({ amount: 'invalid' })
            // @ts-expect-error unknown top-level keys remain rejected for typed rows.
            context.updateRow({ ammount: 100 })
          }
        }
      }
    }]
}])
const typedRowPatch: FormTableRowPatch<PurchaseRow> = {
  amount: 20,
  'profile.city': '上海',
  'items[0].name': '物料'
}
void typedRowPatch
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
const invalidValueAliasProps: TypedFormTableProps = {
  tableData: [{ name: '模板模型', amount: 30 }],
  // @ts-expect-error FormTable 运行时不声明 value Prop；v-model 使用 tableData。
  value: [{ name: '模板模型', amount: 30 }],
  columns: typedColumns
}
void invalidValueAliasProps
declare const typedFormTableInstance: InstanceType<typeof TypedFormTable>
typedFormTableInstance.$emit('update:tableData', [{ name: '更新', amount: 20 }])
typedFormTableInstance.$emit('field-change', {
  row: { name: '更新', amount: 20 },
  index: 0,
  fieldKey: 'amount',
  value: 20,
  previousValue: 10
})
const typedTableRef = typedFormTableInstance.getTableRef()
typedTableRef?.clearSelection?.()
typedTableRef?.toggleRowSelection?.(typedComponentProps.tableData![0], true)
typedTableRef?.toggleAllSelection?.()
typedTableRef?.setCurrentRow?.(typedComponentProps.tableData![0])
typedTableRef?.toggleRowExpansion?.(typedComponentProps.tableData![0], true)
typedTableRef?.clearSort?.()
typedTableRef?.clearFilter?.()
typedTableRef?.doLayout?.()
typedTableRef?.sort?.('amount', 'ascending')
void typedTableRef?.height
void typedTableRef?.data[0]?.amount
// @ts-expect-error table ref row methods preserve the business row type.
typedTableRef?.toggleRowSelection?.({ name: '缺少金额' })
// @ts-expect-error table ref sort only accepts Element UI's stable orders.
typedTableRef?.sort?.('amount', 'up')
const typedFormRef = typedFormTableInstance.getFormRef()
typedFormRef?.resetFields()
typedFormRef?.validateField('tableData.0.amount', () => undefined)
void typedFormRef?.model
const typedTargetRow = typedComponentProps.tableData![0]
const typedFieldProp: string | undefined = typedFormTableInstance.getFieldProp(typedTargetRow, 'amount')
const typedFieldValid: Promise<boolean> = typedFormTableInstance.validateField(typedTargetRow, 'amount')
typedFormTableInstance.clearFieldValidate(typedTargetRow, 'amount')
const typedFieldFocused: Promise<boolean> = typedFormTableInstance.focusField(typedTargetRow, 'amount')
const typedFirstErrorFocused: Promise<boolean> = typedFormTableInstance.scrollToFirstError()
void [typedFieldProp, typedFieldValid, typedFieldFocused, typedFirstErrorFocused]
// @ts-expect-error field target rows preserve the business row type.
typedFormTableInstance.focusField({ name: '缺少金额' }, 'amount')
const elementColumn: FormTableElementColumn = {
  id: 'el-table_1_column_1',
  columnKey: 'amount-column',
  label: '金额',
  property: 'amount'
}
const sortChangePayload: FormTableSortChangePayload = {
  column: elementColumn,
  prop: 'amount',
  order: 'ascending'
}
const filterChangePayload: FormTableFilterChangePayload = { status: ['enabled'] }
const typedTableEmits: FormTableEmits<PurchaseRow> = {} as FormTableEmits<PurchaseRow>
const typedCell = document.createElement('td')
const typedRow: PurchaseRow = { name: '采购单', amount: 10 }
typedTableEmits['sort-change'](sortChangePayload)
typedTableEmits['filter-change'](filterChangePayload)
typedTableEmits['form-validate']('tableData.0.amount', false, '请输入金额')
typedTableEmits['current-change'](typedRow, null)
typedTableEmits['header-click'](elementColumn, new MouseEvent('click'))
typedTableEmits['header-contextmenu'](elementColumn, new MouseEvent('contextmenu'))
typedTableEmits['header-dragend'](180, 120, elementColumn, new MouseEvent('mouseup'))
typedTableEmits['cell-click'](typedRow, elementColumn, typedCell, new MouseEvent('click'))
typedTableEmits['cell-dblclick'](typedRow, elementColumn, typedCell, new MouseEvent('dblclick'))
typedTableEmits['cell-contextmenu'](typedRow, elementColumn, typedCell, new MouseEvent('contextmenu'))
typedTableEmits['cell-mouse-enter'](typedRow, elementColumn, typedCell, new MouseEvent('mouseenter'))
typedTableEmits['cell-mouse-leave'](typedRow, elementColumn, typedCell, new MouseEvent('mouseleave'))
typedTableEmits['row-click'](typedRow, elementColumn, new MouseEvent('click'))
typedTableEmits['row-dblclick'](typedRow, elementColumn, new MouseEvent('dblclick'))
typedTableEmits['row-contextmenu'](typedRow, elementColumn, new MouseEvent('contextmenu'))
typedTableEmits['expand-change'](typedRow, true)
typedTableEmits['expand-change'](typedRow, [typedRow])
typedTableEmits.select([typedRow], typedRow)
typedTableEmits['select-all']([typedRow])
typedTableEmits['selection-change']([typedRow])
// @ts-expect-error sort order follows Element Table's public values.
typedTableEmits['sort-change']({ column: elementColumn, prop: 'amount', order: 'up' })
// @ts-expect-error selection rows preserve the FormTable business row type.
typedTableEmits['selection-change']([{ name: '缺少金额' }])
// @ts-expect-error field-change rows must preserve the generic business row shape.
typedFormTableInstance.$emit('field-change', { row: { name: '缺少金额' }, index: 0 })
const columns: ColumnConfig[] = [{
  label: '基本信息',
  headerHint: ({ tableData, columnConfig }) => `${columnConfig.label}：${tableData.length} 条`,
  headerProps: ({ columnConfig }) => ({ 'aria-label': columnConfig.label }),
  rowProps: { gutter: 8 },
  formItems: [
      {
        fieldKey: 'name',
        type: 'input',
        labelSlot: 'name-label',
        errorSlot: 'name-error',
        hint: ({ value }) => value ? String(value) : completeValueHint,
        colProps: { span: 8 },
        formItemProps: { label: '姓名', rules: [{ required: true }] },
        component: { props: ({ value }) => ({ clearable: true, title: String(value ?? '') }) }
      },
      {
        fieldKey: 'profile.city',
        type: 'component',
        component: { is: CustomInput }
      },
      {
        fieldKey: 'actions',
        type: 'slot',
        hint: ({ row }) => String(row.name || ''),
        component: {
          slot: 'actions',
          props: ({ row }) => ({ disabled: Boolean(row.locked) })
        }
      }
  ]
}]
void disabledHintMode
void fieldHintTargets
void invalidObjectHint

const cellSlotColumn: CellSlotColumnConfig = {
  key: 'actions-column',
  label: '操作',
  cellSlot: 'row-actions',
  props: { width: 120 }
}
const layoutColumn: LayoutColumnConfig = {
  label: '姓名',
  formItems: [{ fieldKey: 'name', type: 'input' }]
}
const nativeColumns: NativeColumnConfig[] = [
  { props: { type: 'selection', width: 48 } },
  { label: '序号', props: { type: 'index', width: 64 } }
]
const expandSlotColumn: CellSlotColumnConfig = {
  label: '详情',
  props: { type: 'expand' },
  cellSlot: 'row-detail'
}
// @ts-expect-error native columns require props to explicitly select passthrough mode.
const emptyNativeColumn: NativeColumnConfig = {}
// @ts-expect-error native columns do not enter the Row/Item rendering chain.
const nativeColumnWithFormItems: NativeColumnConfig = { props: { type: 'index' }, formItems: [] }
// @ts-expect-error native Element column props stay inside props.
const topLevelNativeType: ColumnConfig = { type: 'selection', props: { width: 48 } }
// @ts-expect-error cellSlot columns do not accept formItems.
const mixedColumnModes: ColumnConfig = {
  label: '错误列模式',
  cellSlot: 'row-actions',
  formItems: []
}

const legacyNestedRows: ColumnConfig = {
  label: '旧嵌套布局',
  formItems: [
    // @ts-expect-error formItems 直接接收 FormItemConfig，不再接收 RowConfig。
    { formItems: [{ fieldKey: 'name', type: 'input' }] }
  ]
}
void legacyNestedRows

const customModel: FieldModelConfig = {
  prop: 'selectedId',
  event: 'select',
  valueFromEvent: (_context, ...args) => (args[0] as { id: string }).id
}

const fieldBindingEntry: FieldBindingMapEntry = {
  fieldPath: 'profile.id',
  valuePath: 'selection.id',
  fallbackValue: null
}
const fieldBinding: FieldBindingConfig = {
  map: [fieldBindingEntry]
}

const compositeBindingColumns: ColumnConfig[] = [{
  label: '复合字段',
  formItems: [{
    fieldKey: 'profile.id',
    binding: fieldBinding,
    type: 'component',
    component: { is: CustomInput }
  }]
}]
void compositeBindingColumns

const directComponentOptionsUseProps: ColumnConfig[] = [{
  label: '自定义组件选项',
  formItems: [{
    fieldKey: 'ownerId',
    type: 'component',
    component: {
      is: CustomInput,
      props: { options: [{ label: 'Alice', value: 'employee-1' }] }
    }
  }]
}]
void directComponentOptionsUseProps

const invalidDirectComponentOptions: ColumnConfig[] = [{
  label: '错误的自定义组件选项入口',
  formItems: [{
    fieldKey: 'ownerId',
    type: 'component',
    component: {
      resolveComponent: () => CustomInput,
      // @ts-expect-error type: 'component' 的 options 不会传给实际组件，应使用 props.options。
      options: [{ label: 'Alice', value: 'employee-1' }]
    }
  }]
}]
void invalidDirectComponentOptions

const invalidFieldBinding: FieldBindingConfig = {
  map: [{
    // @ts-expect-error fieldPath must be a string path.
    fieldPath: 1,
    valuePath: 'id'
  }]
}
void invalidFieldBinding

const invalidTrueModelConfig: FieldComponentConfig = {
  // @ts-expect-error 原生 v-model 通过省略 model 表达，不再接受 true。
  model: true
}
void invalidTrueModelConfig

const modelVariants: ColumnConfig[] = [{
  label: '组件绑定协议',
  formItems: [{
        fieldKey: 'ownerId',
        type: 'component',
        component: { is: CustomInput, model: customModel }
      },
      {
        fieldKey: 'enabled',
        type: 'component',
        component: { is: CustomInput }
      },
      {
        fieldKey: 'summary',
        type: 'component',
        component: { is: CustomInput, model: false }
      }]
}]

const componentResolver: FieldComponentResolver = ({ row, fieldKey, value }) => {
  void fieldKey
  void value
  return row.kind === 'alternative' ? AlternativeInput : CustomInput
}

const dynamicComponentVariants: ColumnConfig[] = [{
  label: '按行解析组件',
  formItems: [{
        fieldKey: 'profile',
        type: 'component',
        component: {
          resolveComponent: componentResolver
        }
      },
      {
        fieldKey: 'name',
        type: 'component',
        component: {
          is: CustomInput,
          resolveComponent: ({ row }) => row.useDefault ? undefined : AlternativeInput
        }
      }]
}]
void dynamicComponentVariants

const props: FormTableProps = {
  tableData: rows,
  columns,
  rowKey: 'id',
  formProps: { size: 'small' },
  tableProps: { border: true },
  hintOptions: {
    mode: 'tooltip',
    targets: 'all',
    tooltipProps: { placement: 'top', openDelay: 200 }
  }
}
const formProps: FormTableFormProps = { size: 'small', disabled: false }
const tableProps: FormTableTableProps = { border: true, maxHeight: 480 }
const formItemProps: FormTableFormItemProps = {
  label: '姓名',
  rules: [{ required: true }]
}
const managedTableDataProps: FormTableTableProps = {
  // @ts-expect-error data is managed by the top-level tableData prop.
  data: rows
}
const managedTableRowKeyProps: FormTableTableProps = {
  // @ts-expect-error rowKey is managed by the top-level rowKey prop.
  rowKey: 'id'
}
const managedFormModelProps: FormTableFormProps = {
  // @ts-expect-error model is fixed to the internal { tableData } object.
  model: { tableData: rows }
}
const managedFormItemProp: FormTableFormItemProps = {
  // @ts-expect-error prop is generated from the row index and fieldKey.
  prop: 'tableData.0.name'
}
void formProps
void tableProps
void formItemProps
void managedTableDataProps
void managedTableRowKeyProps
void managedFormModelProps
void managedFormItemProp
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
const managedNestedProps: FormTableProps = {
  tableData: rows,
  columns: [{
    label: '姓名',
    formItems: [{
      fieldKey: 'name',
      type: 'input',
      formItemProps: {
        // @ts-expect-error FormItem prop is always generated by FormTable.
        prop: 'name'
      }
    }]
  }],
  formProps: {
    // @ts-expect-error Form model is always generated by FormTable.
    model: { tableData: rows }
  },
  tableProps: {
    // @ts-expect-error Table data is provided by the top-level tableData prop.
    data: rows
  }
}
void managedNestedProps
const titleHintOptions: FormTableHintOptions = { mode: 'title' }
const tooltipHintOptions: FormTableHintOptions = {
  mode: 'tooltip',
  targets: 'header',
  tooltipProps: { placement: 'bottom' }
}
const typedFieldFormatter: FormTableFieldHintFormatter<PurchaseRow> = ({ value, row }) => (
  `${row.name}:${String(value)}`
)
const typedDefaultFieldHint: FormTableHintOptions<PurchaseRow>['field'] = typedFieldFormatter
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
const disabledHintOptions: FormTableHintOptions = { mode: false }
// @ts-expect-error 旧 props 入口不再接受。
const invalidTooltipProps: FormTableHintOptions = { mode: 'tooltip', props: {} }
const legacyHintModeProps: FormTableProps = {
  tableData: rows,
  columns,
  // @ts-expect-error hintMode 已由 hintOptions 替代。
  hintMode: 'tooltip'
}
const legacyHintTooltipProps: FormTableProps = {
  tableData: rows,
  columns,
  // @ts-expect-error hintTooltipProps 已收敛到 hintOptions.tooltipProps。
  hintTooltipProps: { placement: 'top' }
}
void titleHintOptions
void tooltipHintOptions
void disabledHintOptions
void invalidTooltipProps
void legacyHintModeProps
void legacyHintTooltipProps
const component: Component = FormTable
const named: Component = NamedFormTable

async function useExpose(expose: FormTableExpose) {
  await expose.validate()
  expose.clearValidate()
  const row = { id: 'default-row' }
  void expose.getFieldProp(row, 'name')
  await expose.validateField(row, 'name')
  expose.clearFieldValidate(row, 'name')
  await expose.focusField(row, 'name')
  await expose.scrollToFirstError()
  return expose.getTableRef()
}

const invalid: ColumnConfig[] = [{
  label: '错误配置',
  formItems: [{
      fieldKey: 'bad',
      // @ts-expect-error unknown type aliases are rejected.
      type: 'unknown'
    }]
}]

const invalidModes: ColumnConfig[] = [{
  label: '渲染模式约束',
  formItems: [// @ts-expect-error builtin modes resolve their own component target.
      { fieldKey: 'name', type: 'input', component: { is: CustomInput } },
      // @ts-expect-error component mode requires is or resolveComponent.
      { fieldKey: 'custom', type: 'component', component: { props: {} } },
      // @ts-expect-error builtin modes cannot dynamically replace their component target.
      { fieldKey: 'dynamic-input', type: 'input', component: { resolveComponent: () => CustomInput } },
      // @ts-expect-error slot must be a string name.
      { fieldKey: 'actions', type: 'slot', component: { slot: CustomInput } },
      // @ts-expect-error slot mode does not accept a component target.
      { fieldKey: 'legacy-slot-target', type: 'slot', component: { is: 'actions' } },
      // @ts-expect-error slot names remain static and do not use component resolution.
      { fieldKey: 'dynamic-slot', type: 'slot', component: { slot: 'actions', resolveComponent: () => CustomInput } },
      // @ts-expect-error component mode does not accept a slot target.
      { fieldKey: 'component-slot', type: 'component', component: { slot: 'actions' } },
      // @ts-expect-error renderer was replaced by is.
      { fieldKey: 'legacy-renderer', type: 'component', component: { renderer: CustomInput } },
      // @ts-expect-error resolveRenderer was replaced by resolveComponent.
      { fieldKey: 'legacy-resolver', type: 'component', component: { resolveRenderer: () => CustomInput } },
      // @ts-expect-error component resolution is synchronous and does not accept Promise results.
      { fieldKey: 'async-is', type: 'component', component: { resolveComponent: async () => CustomInput } }]
}]

const renamedColumn: ColumnConfig = {
  label: '新字段名',
  // @ts-expect-error ColumnConfig uses label; legacy name is not accepted.
  name: '旧字段名',
  formItems: []
}

const renamedItem: ColumnConfig = {
  label: '字段路径',
  formItems: [// @ts-expect-error key is only the render identity; fieldKey remains required.
      { key: 'name', type: 'input' }]
}

const keyedItem: ColumnConfig = {
  label: '稳定字段身份',
  formItems: [{ key: 'primary-name', fieldKey: 'name', type: 'input' }]
}

const itemMetaVariants: ColumnConfig[] = [{
  label: '静态字段元数据',
  formItems: [
    { fieldKey: 'name', type: 'input', meta: { role: 'builtin' } },
    {
      fieldKey: 'custom',
      type: 'component',
      meta: { role: 'component' },
      visible: ({ itemConfig }) => itemConfig.meta?.role === 'component',
      component: {
        is: CustomInput,
        props: ({ itemConfig }) => ({ role: itemConfig.meta?.role }),
        listeners: {
          change({ itemConfig }) {
            void itemConfig.meta?.role
          }
        }
      }
    },
    {
      fieldKey: 'actions',
      type: 'slot',
      meta: { role: 'slot', permission: 'row:update' },
      component: { slot: 'actions' }
    }
  ]
}]

const invalidDynamicItemMeta: ColumnConfig = {
  label: '动态字段元数据',
  formItems: [{
    fieldKey: 'name',
    type: 'input',
    // @ts-expect-error meta is static metadata and does not accept a resolver.
    meta: () => ({ role: 'dynamic' })
  }]
}

const legacySlotString: ColumnConfig = {
  label: '旧 slot 写法',
  formItems: [// @ts-expect-error standalone slot field was replaced by type: 'slot' + component.slot.
      { fieldKey: 'actions', slot: 'actions' }]
}

const legacyComponentIs: ColumnConfig = {
  label: '旧组件写法',
  formItems: [// @ts-expect-error component mode requires type: 'component' + component.is.
      { fieldKey: 'custom', component: { is: CustomInput } }]
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
  rowProps: (rowContext) => {
    void rowContext.row
    void rowContext.index
    void rowContext.columnConfig
    // @ts-expect-error row callbacks do not have a current field.
    void rowContext.fieldKey
    return { gutter: 8 }
  },
  formItems: [{
      fieldKey: 'name',
      type: 'input',
      visible: (fieldContext) => {
        void fieldContext.row
        void fieldContext.index
        void fieldContext.fieldKey
        void fieldContext.value
        void fieldContext.columnConfig
        // @ts-expect-error 字段上下文不再包含已删除的布局 Row 配置。
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
            void fieldContext.bindingValue
            fieldContext.setBindingValue({ name: 'Bob' })
          }
        }
      }
  }]
}]

declare const headerContext: FormTableHeaderSlotContext
void headerContext.columnIndex
void headerContext.columnConfig.key
// @ts-expect-error headerProps 已由包装节点应用，不再重复暴露解析结果。
void headerContext.header
// @ts-expect-error header slot column configuration is read-only.
headerContext.columnConfig.label = '新表头'
// @ts-expect-error legacy column alias is not exposed.
void headerContext.column

declare const formItemSlotContext: FormTableFormItemSlotContext
void formItemSlotContext.bindingValue
formItemSlotContext.setBindingValue('Bob')
void formItemSlotContext.propPath
void formItemSlotContext.displayIndex
void formItemSlotContext.value
formItemSlotContext.setValue('Bob')
// @ts-expect-error unresolved duplicate rows can omit the validation path.
const requiredPropPath: string = formItemSlotContext.propPath
void requiredPropPath
if (formItemSlotContext.propPath) {
  const resolvedPropPath: string = formItemSlotContext.propPath
  void resolvedPropPath
}

declare const formItemErrorSlotContext: FormTableFormItemErrorSlotContext
void formItemErrorSlotContext.error
void formItemErrorSlotContext.itemConfig.errorSlot

declare const cellSlotContext: FormTableCellSlotContext
void cellSlotContext.row
void cellSlotContext.index
void cellSlotContext.displayIndex
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
void nativeColumns
void expandSlotColumn
void emptyNativeColumn
void nativeColumnWithFormItems
void topLevelNativeType
void mixedColumnModes
void modelVariants
void component
void named
void useExpose
void invalid
void invalidModes
void renamedColumn
void renamedItem
void keyedItem
void itemMetaVariants
void invalidDynamicItemMeta
void legacySlotString
void legacyComponentIs
void contextBoundaries
