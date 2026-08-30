import {
  createFormTable,
  defineFormTableColumns,
  defineFormTableType,
  defineFormTableTypes,
  type ColumnConfig,
  type FieldModelConfig,
  type FormItemConfig,
  type FormTableFieldBindingContext,
  type FormTableFieldRenderContext,
  type TableRow
} from '../index'
import { AlternativeInput, CustomInput } from './public-api.fixtures'

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
