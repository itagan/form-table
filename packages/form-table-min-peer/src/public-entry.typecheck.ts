import FormTable, {
  FormTable as NamedFormTable,
  createFormTable,
  defineFormTableColumns,
  defineFormTableType,
  defineFormTableTypes,
  type FormTableExpose,
  type TableRow
} from '@itagan/form-table'

interface PurchaseRow extends TableRow {
  id: string
  name: string
  amount: number
}

const defaultProps: InstanceType<typeof FormTable>['$props'] = {
  tableData: [],
  columns: []
}
const sameNamedComponent: typeof FormTable = NamedFormTable
void defaultProps
void sameNamedComponent

declare const defaultInstance: InstanceType<typeof FormTable>
declare const namedInstance: InstanceType<typeof NamedFormTable>
const defaultExpose: FormTableExpose = defaultInstance
const namedExpose: FormTableExpose = namedInstance
defaultInstance.$emit('update:tableData', [])
namedInstance.$emit('field-change', {
  row: {},
  index: 0,
  fieldKey: 'name',
  value: 'Bob',
  previousValue: 'Alice'
})
void defaultExpose.validate()
void namedExpose.clearValidate()

const columns = defineFormTableColumns<PurchaseRow>([{
  label: '采购信息',
  formItems: [{
    fieldKey: 'amount',
    type: 'number',
    component: {
      props: ({ row }) => ({ disabled: row.amount <= 0 })
    }
  }]
}])
const timeSelectColumns = defineFormTableColumns<TableRow>([{
  label: '预约时间',
  formItems: [{
    fieldKey: 'appointmentTime',
    type: 'time-select',
    component: { props: { pickerOptions: { start: '08:00', step: '00:30', end: '18:00' } } }
  }]
}])
void timeSelectColumns
const TypedFormTable = createFormTable<PurchaseRow>()
const typedProps: InstanceType<typeof TypedFormTable>['$props'] = {
  tableData: [{ id: 'purchase-1', name: '采购单', amount: 100 }],
  columns,
  rowKey: row => row.id
}
void typedProps

declare const typedInstance: InstanceType<typeof TypedFormTable>
const exposed: FormTableExpose<PurchaseRow> = typedInstance
typedInstance.$emit('update:tableData', typedProps.tableData || [])
typedInstance.$emit('field-change', {
  row: typedProps.tableData![0],
  index: 0,
  fieldKey: 'amount',
  value: 200,
  previousValue: 100
})
void exposed.getFormRef()
void exposed.getTableRef()

const moneyType = defineFormTableType<PurchaseRow>()<
  { disabled?: boolean },
  { 'amount-change': [amount: number] }
>({
    is: 'minimum-money-input',
    model: { prop: 'amount', event: 'amount-change' },
    props: ({ row }) => ({ disabled: row.amount <= 0 })
})
const fieldTypes = defineFormTableTypes<PurchaseRow>()({
  money: moneyType
})
const customColumns = defineFormTableColumns<PurchaseRow, typeof fieldTypes>([{
  label: '自定义类型',
  formItems: [{
    fieldKey: 'amount',
    type: 'money',
    component: {
      listeners: {
        'amount-change'({ row }, value) {
          void row.id
          value.toFixed()
        }
      }
    }
  }]
}])
const CustomTypedFormTable = createFormTable<PurchaseRow, typeof fieldTypes>()
const customTypedProps: InstanceType<typeof CustomTypedFormTable>['$props'] = {
  tableData: [{ id: 'purchase-1', name: '采购单', amount: 100 }],
  columns: customColumns,
  fieldTypes
}
void customTypedProps

// @ts-expect-error 泛型组件的数据行必须保留完整业务类型。
typedInstance.$emit('update:tableData', [
  { id: 'purchase-2', name: '缺少金额' }
])
