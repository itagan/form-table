# FormTable 当前文档

这份文档以当前仓库代码为准，适用于 `Vue 2.7 + Element UI + TypeScript`。

## 组件定位

`FormTable` 是一个“表格内嵌表单”组件。

适合这类场景：

- 后台编辑表格
- 每一行都是一组表单字段
- 需要统一校验、动态增删行
- 需要插槽或自定义组件扩展单元格

组件入口：

- `src/components/FormTable/index.vue`

## 配置原则

- 常用字段直接配置，比如 `label`、`placeholder`、`rules`
- 非常见组件属性优先通过 `bind` 透传
- 顶层 `attrs` 继续负责 `el-form` / `el-table` / `el-table-column` 的通用扩展
- 只有 `visible`、`defaultValue`、`formatter`、`colProps` 这类透传本身解决不了的结构能力，才额外提供配置项

## 基础用法

```vue
<template>
  <FormTable
    ref="formTableRef"
    :table-data="tableData"
    :columns="columns"
    :rules="rules"
    :form-data="formData"
    border
    stripe
    @update:tableData="handleTableDataUpdate"
    @update:formData="handleFormDataUpdate"
    @event="handleFormTableEvent"
  />
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import FormTable from '@/components/FormTable/index.vue'
import type { ColumnConfig } from '@/components/FormTable/types'

const tableData = ref([
  { name: '张三', age: 25, level: 'mid' }
])

const formData = reactive({
  tableData: tableData.value
})

const rules = ref({
  'tableData.*.name': [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  'tableData.*.level': [{ required: true, message: '请选择职级', trigger: 'change' }]
})

const columns = ref<ColumnConfig[]>([
  {
    name: '基本信息',
    props: { width: '360px' },
    children: [{
      gutter: 10,
      children: [
        {
          key: 'name',
          type: 'input',
          colSpan: 12,
          placeholder: '请输入姓名'
        },
        {
          key: 'level',
          type: 'select',
          colSpan: 12,
          placeholder: '请选择职级',
          options: [
            { label: '初级', value: 'junior' },
            { label: '中级', value: 'mid' },
            { label: '高级', value: 'senior' }
          ]
        }
      ]
    }]
  }
])

const handleTableDataUpdate = (newData: any[]) => {
  tableData.value = newData
  formData.tableData = newData
}

const handleFormDataUpdate = (newData: Record<string, any>) => {
  Object.assign(formData, newData)
}

const handleFormTableEvent = (payload: { type: string; args: any[] }) => {
  console.log(payload)
}
</script>
```

## Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `tableData` | `TableRow[]` | 表格数据 |
| `columns` | `ColumnConfig[]` | 列配置 |
| `rules` | `Record<string, ValidationRule[]>` | 校验规则 |
| `formData` | `Record<string, any>` | `el-form` 的 model |
| `customComponents` | `CustomComponentConfig[]` | 自定义组件注册表 |
| `loading` | `boolean` | 表格加载态 |

还可以透传部分常用 `el-form` / `el-table` 属性，比如：

- `border`
- `stripe`
- `size`
- `label-width`
- `height`
- `max-height`

## 事件

组件会派发这些事件：

| 事件名 | 参数 | 说明 |
|------|------|------|
| `update:tableData` | `TableRow[]` | 表格数据变更 |
| `update:formData` | `Record<string, any>` | 表单数据变更，`tableData` 变更时会自动同步 |
| `field-change` | `({ row, index, fieldKey, value, previousValue })` | 单个字段值变化 |
| `row-add` | `(row, index)` | 调用 `addRow` 后触发 |
| `row-copy` | `(row, index)` | 调用 `copyRow` 后触发 |
| `row-update` | `(row, index)` | 调用 `updateRow` 后触发 |
| `row-move` | `(row, fromIndex, toIndex)` | 调用 `moveRow` 后触发 |
| `row-remove` | `(row, index)` | 调用 `removeRow` 后触发 |
| `validate` | `(valid, errors)` | 调用 `validate` 后触发 |
| `event` | `({ type, args })` | 统一归档事件 |

推荐外层同时监听：

- 具体事件，做明确处理
- `event`，做日志、埋点或统一调试

如果只是为了保持 `formData.tableData` 同步，可以只处理 `update:formData`，组件内部会在行编辑、增行、删行时自动带上最新 `tableData`。

## Slot 上下文

当 `type: 'slotComponent'` 时，插槽会收到这些参数：

- `row`
- `index`
- `fieldKey`
- `propPath`
- `value`
- `formData`
- `tableData`
- `setValue`
- `updateRow`
- `removeCurrentRow`
- `copyCurrentRow`
- `insertBefore`
- `insertAfter`
- `validateCurrentField`
- `validateCurrentRow`
- `clearCurrentFieldValidate`
- `clearCurrentRowValidate`

推荐优先使用 `value + setValue` 更新字段，而不是直接修改 `row`，这样可以保持和内置组件一致的数据更新链路。

```vue
<template #table-school="{ value, setValue }">
  <el-select :value="value" placeholder="请选择学校" @input="setValue">
    <el-option label="县一小" value="县一小" />
    <el-option label="县二中" value="县二中" />
  </el-select>
</template>
```

## ref 方法

通过 `ref` 可调用：

- `validate(callback?)`
- `resetFields()`
- `clearValidate(props?)`
- `addRow(rowData?)`
- `insertRow(index, rowData?)`
- `copyRow(index, patch?)`
- `updateRow(index, patch)`
- `moveRow(fromIndex, toIndex)`
- `getRow(index)`
- `validateField(props)`
- `validateRow(index)`
- `removeRow(index)`
- `getFormData()`
- `setFormData(data)`

## 配置结构

### ColumnConfig

```ts
interface ColumnConfig {
  name: string
  visible?: boolean | ((context) => boolean)
  props?: Record<string, any>
  children: RowConfig[]
}
```

### RowConfig

```ts
interface RowConfig {
  visible?: boolean | ((context) => boolean)
  bind?: Record<string, any>
  props?: Record<string, any>
  gutter?: number
  children: FormItemConfig[]
}
```

### FormItemConfig

```ts
interface FormItemConfig {
  key: string
  type: FormItemType
  visible?: boolean | ((context) => boolean)
  colSpan?: number | string
  colProps?: Record<string, any>
  bind?: Record<string, any>
  listeners?: Record<string, (context, ...args) => void>
  onValueChange?: (context) => Partial<TableRow> | void
  rules?: any[]
  label?: string
  labelWidth?: string
  isUseTooltip?: boolean
  tooltipProps?: Record<string, any>
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
  size?: 'large' | 'default' | 'small'
  customComponent?: string
  slotName?: string
  options?: Array<{ label: string; value: any }>
  remote?: boolean
  remoteMethod?: Function
  min?: number
  max?: number
  step?: number
  format?: string
  valueFormat?: string
  props?: Record<string, any>
  data?: any[]
  fetchSuggestions?: Function
  action?: string
  rows?: number
  defaultValue?: any | ((context) => any)
  formatter?: (value, context) => any
  emptyText?: string
  optionProps?: {
    label?: string
    value?: string
    disabled?: string
    key?: string
  }
}
```

其中 `key` 支持路径写法，比如：

- `name`
- `profile.city`
- `contact.phone`

`listeners` 用来监听具体字段组件抛出的事件，适合处理 `blur`、`focus`、`change` 这类组件级交互。

`onValueChange` 用来处理字段联动。它会在字段值真正变更后执行，如果返回一个 patch，组件会继续把 patch 合并回当前行，并沿用同一条更新链路。

```ts
{
  key: 'level',
  type: 'select',
  onValueChange: ({ value }) => {
    if (value === 'junior') {
      return { remark: '' }
    }
  }
}
```

这个能力适合处理：

- 某个字段变化后清空另一个字段
- 自动补默认值
- 联动更新嵌套字段，比如 `profile.city`

## type 支持

当前支持这些 `type`：

- `input`
- `select`
- `date`
- `datetime`
- `time`
- `textarea`
- `number`
- `switch`
- `radio`
- `checkbox`
- `text`
- `slotComponent`
- `custom`
- `rate`
- `slider`
- `color`
- `upload`
- `cascader`
- `tree-select`
- `autocomplete`
- `tag-input`

## 配置建议

建议按这个规则使用：

- 常见配置直接写在表单项上
- 非常见配置统一放进 `bind`
- 行列显隐、默认值、文本展示这类结构能力再使用独立配置

### 常见配置直写

```ts
{
  key: 'name',
  type: 'input',
  placeholder: '请输入姓名',
  disabled: false
}
```

## 校验规则说明

支持这两种规则写法：

- 精确路径：`tableData.0.name`
- 通配路径：`tableData.*.name`

推荐在动态行场景中优先使用通配路径，组件内部会按当前行索引自动匹配到对应字段。

### 非常见配置走 bind

```ts
{
  key: 'remark',
  type: 'textarea',
  bind: {
    rows: 3,
    maxlength: 100,
    showWordLimit: true
  }
}
```

## 插槽扩展

如果某个单元格需要完全自定义，可以用 `slotComponent`。

配置：

```ts
{
  key: 'school',
  type: 'slotComponent',
  slotName: 'table-school',
  colSpan: 24
}
```

模板：

```vue
<FormTable ...>
  <template #table-school="{ row, index }">
    <el-select v-model="row.school" placeholder="请选择学校">
      <el-option label="县一小" value="县一小" />
      <el-option label="县二中" value="县二中" />
    </el-select>
  </template>
</FormTable>
```

插槽参数：

- `row`
- `index`

## 自定义组件扩展

注册：

```ts
const customComponents = [
  { name: 'PhoneInput', component: PhoneInput }
]
```

配置：

```ts
{
  key: 'phone',
  type: 'custom',
  customComponent: 'PhoneInput',
  placeholder: '请输入手机号',
  bind: {
    clearable: true
  }
}
```

## 当前推荐参考

如果你要看现成示例，优先看：

- `src/views/FormTableView.vue`
- `src/views/FormTableAdvancedView.vue`
- `src/views/DebugView.vue`

如果你要看实现，优先看：

- `src/components/FormTable/index.vue`
- `src/components/FormTable/FormTableItem.vue`
- `src/components/FormTable/ComponentWrapper.vue`
- `src/components/FormTable/types.ts`
