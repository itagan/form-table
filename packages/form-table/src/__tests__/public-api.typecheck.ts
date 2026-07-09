import type { Component, PluginObject } from 'vue'
import FormTable, {
  FormTable as NamedFormTable,
  FormTablePlugin,
  type ColumnConfig,
  type FormTableExpose,
  type FormTableFieldChangePayload,
  type FormTableProps,
  type TableRow
} from '../index'

const defaultComponent: Component = FormTable
const namedComponent: Component = NamedFormTable
const plugin: PluginObject<undefined> = FormTablePlugin

const rows: TableRow[] = [
  {
    name: 'Alice',
    age: 18
  }
]

const InlineInput: Component = {
  name: 'InlineInput'
}

const columns: ColumnConfig[] = [
  {
    name: '基本信息',
    fieldRow: {
      gutter: 8
    },
    fields: [
      {
        key: 'name',
        type: 'input',
        label: '姓名',
        placeholder: '请输入姓名',
        clearable: true,
        required: true,
        requiredMessage: '请输入姓名'
      },
      {
        key: 'age',
        type: 'number',
        label: '年龄',
        disabled: false,
        behavior: {
          defaultValue: 18
        }
      },
      {
        key: 'inline',
        type: 'custom',
        label: '内联组件',
        component: {
          name: InlineInput
        }
      }
    ]
  }
]

const props: FormTableProps = {
  tableData: rows,
  columns,
  rules: {
    name: [
      {
        required: true,
        message: '请输入姓名',
        trigger: 'blur'
      }
    ]
  }
}

const handleFieldChange = (payload: FormTableFieldChangePayload) => {
  payload.row[payload.fieldKey] = payload.value
}

const useExpose = async (expose: FormTableExpose) => {
  const valid = await expose.validate()
  const firstRow = expose.getRow(0)

  expose.updateRow(0, {
    name: 'Bob'
  })

  return {
    valid,
    firstRow
  }
}

const invalidColumns: ColumnConfig[] = [
  {
    name: '错误配置',
    children: [
      {
        children: [
          {
            key: 'bad',
            // @ts-expect-error public column config only accepts known form item types.
            type: 'unknown'
          }
        ]
      }
    ]
  }
]

void defaultComponent
void namedComponent
void plugin
void props
void handleFieldChange
void useExpose
void invalidColumns
