import type { Component, PluginObject } from 'vue'
import FormTable, {
  FormTable as NamedFormTable,
  FormTablePlugin,
  type ColumnConfig,
  type FormTableExpose,
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
        component: { is: CustomInput }
      },
      {
        fieldKey: 'actions',
        slot: 'actions'
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

const conflictingModes: ColumnConfig[] = [{
  label: '互斥渲染模式',
  children: [{
    children: [
      // @ts-expect-error typed configs choose one renderer; runtime priority only guards untyped JSON/JS.
      { fieldKey: 'name', type: 'input', component: { is: CustomInput } },
      // @ts-expect-error slot cannot be combined with a type in typed configs.
      { fieldKey: 'actions', slot: 'actions', type: 'text' }
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

void props
void component
void named
void plugin
void useExpose
void invalid
void conflictingModes
void renamedColumn
void renamedItem
void contextBoundaries
