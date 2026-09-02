import type { Component } from 'vue'
import {
  createFormTable,
  defineFormTableColumns,
  type FormTableElementColumn,
  type FormTableEmits,
  type FormTableFilterChangePayload,
  type FormTableNavigationOptions,
  type FormTableNativeFieldListeners,
  type FormTableRowPatch,
  type FormTableRowUpdate,
  type FormTableSortChangePayload
} from '../index'

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

const nativeFieldListeners: FormTableNativeFieldListeners<PurchaseRow> = {
  click(context, event) {
    context.row.amount.toFixed(2)
    event.clientX.toFixed(0)
    // @ts-expect-error click is inferred as MouseEvent, not KeyboardEvent.
    event.key.toLowerCase()
  },
  keydown(context, event) {
    context.updateRow({ amount: 100 })
    event.key.toLowerCase()
  }
}

export const typedColumns = defineFormTableColumns<PurchaseRow>([{
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
        nativeListeners: nativeFieldListeners,
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
const typedNavigationOptions: FormTableNavigationOptions = { enabled: true }
const typedComponentProps: TypedFormTableProps = {
  tableData: [{ name: '采购单', amount: 10 }],
  columns: typedColumns,
  rowKey: row => row.amount,
  navigationOptions: typedNavigationOptions
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
const typedRowUpdates: FormTableRowUpdate<PurchaseRow>[] = [{
  row: typedTargetRow,
  patch: { amount: 40 }
}]
const typedRowsUpdated: boolean = typedFormTableInstance.updateRows(typedRowUpdates)
void [typedFieldProp, typedFieldValid, typedFieldFocused, typedFirstErrorFocused, typedRowsUpdated]
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
