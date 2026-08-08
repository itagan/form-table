import type { Component, PluginObject } from 'vue'
import FormTable, {
  FormTable as NamedFormTable,
  FormTablePlugin,
  type ColumnConfig,
  type FormTableExpose,
  type FormTableHeaderSlotContext,
  type FormTableProps,
  type TableRow
} from '../index'

const CustomInput: Component = { name: 'CustomInput' }
const rows: TableRow[] = [{ name: 'Alice', profile: { city: '杭州' } }]
const columns: ColumnConfig[] = [{
  label: '基本信息',
  children: [{
    props: { gutter: 8 },
    children: [
      {
        fieldKey: 'name',
        type: 'input',
        colProps: { span: 8 },
        formItemProps: { label: '姓名', rules: [{ required: true }] },
        component: { props: { clearable: true } }
      },
      {
        fieldKey: 'profile.city',
        type: 'component',
        component: { renderer: CustomInput }
      },
      {
        fieldKey: 'actions',
        type: 'slot',
        component: {
          renderer: 'actions',
          props: ({ row }) => ({ disabled: Boolean(row.locked) })
        }
      }
    ]
  }]
}]

const props: FormTableProps = {
  tableData: rows,
  columns,
  formProps: { size: 'small' },
  tableProps: { border: true }
}
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
      // @ts-expect-error component mode requires component.renderer.
      { fieldKey: 'custom', type: 'component', component: { props: {} } },
      // @ts-expect-error slot renderer must be a string name.
      { fieldKey: 'actions', type: 'slot', component: { renderer: CustomInput } }
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
      // @ts-expect-error FormItemConfig uses fieldKey; legacy key is not accepted.
      { key: 'name', type: 'input' }
    ]
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
    // @ts-expect-error column callbacks do not have a current row.
    void tableContext.row
    return true
  },
  children: [{
    visible: (rowContext) => {
      void rowContext.row
      void rowContext.index
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
void headerContext.column.key
// @ts-expect-error header slot column configuration is read-only.
headerContext.column.label = '新表头'

void props
void component
void named
void plugin
void useExpose
void invalid
void invalidModes
void renamedColumn
void renamedItem
void legacySlotString
void legacyComponentIs
void contextBoundaries
