import type {
  CellSlotColumnConfig,
  ColumnConfig,
  FieldBindingConfig,
  FieldBindingMapEntry,
  FieldComponentConfig,
  FieldComponentResolver,
  FieldModelConfig,
  LayoutColumnConfig,
  NativeColumnConfig
} from '../index'
import { AlternativeInput, CustomInput, completeValueHint } from './public-api.fixtures'

export const columns: ColumnConfig[] = [{
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

void [
  cellSlotColumn,
  layoutColumn,
  nativeColumns,
  expandSlotColumn,
  emptyNativeColumn,
  nativeColumnWithFormItems,
  topLevelNativeType,
  mixedColumnModes,
  modelVariants
]
