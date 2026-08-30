import type {
  ColumnConfig,
  FormTableCellSlotContext,
  FormTableFormItemErrorSlotContext,
  FormTableFormItemSlotContext,
  FormTableHeaderSlotContext
} from '../index'

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

void contextBoundaries
