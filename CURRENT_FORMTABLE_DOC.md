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

## 当前架构

`FormTable` 当前按“入口组装 + 分层渲染 + composable 编排”的方式组织。

核心数据流：

```text
props.tableData
  -> el-table / el-form 渲染
  -> 内置组件、slot 或自定义组件触发 dispatch('update:row')
  -> commitRowChange 解析路径 patch 和同步字段联动
  -> emit('update:tableData') + emit('update:formData')
  -> emit('field-change') / row-* / validate 等业务事件
```

渲染链路：

```text
FormTable/index.vue
  -> FormTableColumn
    -> FormTableRow
      -> FormTableItem
        -> ComponentWrapper
```

各层职责：

| 层级 | 职责 |
|------|------|
| `index.vue` | 组装 props/emits、provide、ref API 和各 composable |
| `FormTableColumn` | 渲染 `el-table-column`，展开列内多行布局 |
| `FormTableRow` | 渲染 `el-row` / `el-col`，处理行和字段显隐 |
| `FormTableItem` | 渲染 `el-form-item`，合并规则、slot、tooltip 和字段上下文 |
| `ComponentWrapper` | 根据 `type` 渲染 Element UI 或自定义组件，并统一 v-model 更新 |

内部职责已按模块收口：

| 模块 | 职责 |
|------|------|
| `useFormTableModel` | 维护 `formModel`、运行时上下文、`tableData` 与 `formData.tableData` 同步 |
| `useFormTableSchema` | 归一化 columns，维护字段索引、可见列和校验路径 |
| `useFormTableRows` | 处理字段提交、联动 patch、行增删改移和行级 actions |
| `useFormTableValidation` | 调度隐藏字段校验清理和字段校验 |
| `useFormTableEvents` | 区分内部更新命令和外部业务事件，保留统一 `event` 归档 |

`tableData` 是行编辑的主数据源。组件会在行数据变化后同步发出 `update:formData`，其中 `formData.tableData` 始终使用最新表格数据，方便外层以完整表单模型提交。

## 功能语义

- 字段更新统一入口：内置组件、slot、自定义组件都应通过 `dispatch('update:row')` 或 slot 暴露的 `setValue/updateRow` 进入 `commitRowChange`。
- 字段联动保持同步模型：`behavior.onValueChange` 返回当前行 patch，不引入异步联动队列。
- 隐藏字段策略：字段隐藏后保留原值，但会清理 Element UI 上残留的校验状态。
- 路径字段策略：`profile.city` 这类 key 贯穿取值、更新、默认值、联动和校验路径。
- 事件策略：具体业务事件保持原参数，同时 `event` 事件用于日志、埋点或统一调试归档。

## Demo 能力归类

当前示例页面覆盖以下能力：

- 基础编辑：`src/views/FormTableView.vue`
- 自定义组件：`PhoneInput`、`StatusTag`、`TestComponent`、`SimpleTest`
- slot 操作列：`src/views/FormTableAdvancedView.vue`
- 动态显隐和字段联动：`src/views/DynamicSlotTestView.vue`
- 调试排查：`src/views/DebugView.vue`

后续清理建议：高级示例中仍保留少量开发调试块和 inline style，可在 demo 产品化时统一收敛，但不影响当前组件 API。

## 配置原则

- 结构字段直接配置，比如 `label`、`rules`
- 组件属性统一通过 `component.bind` 配置
- 结构能力按职责分组到 `layout`、`component`、`display`、`behavior`
- 顶层 `attrs` 继续负责 `el-form` / `el-table` / `el-table-column` 的通用扩展
- 只有 `visible`、`defaultValue`、`formatter`、`layout.colProps` 这类透传本身解决不了的结构能力，才额外提供配置项

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
          layout: { span: 12 },
          component: {
            bind: {
              placeholder: '请输入姓名'
            }
          }
        },
        {
          key: 'level',
          type: 'select',
          layout: { span: 12 },
          component: {
            bind: {
              placeholder: '请选择职级'
            },
            options: [
              { label: '初级', value: 'junior' },
              { label: '中级', value: 'mid' },
              { label: '高级', value: 'senior' }
            ]
          }
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

动态隐藏的字段会自动清理已有校验错误，避免界面上残留不可见字段的报错状态。

## Slot 上下文

当 `type: 'slot'` 时，插槽会收到这些参数：

- `row`
- `index`
- `rowCount`
- `isFirstRow`
- `isLastRow`
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
- `moveCurrentRow`
- `moveUp`
- `moveDown`
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
  props?: Record<string, any> | ((context) => Record<string, any>)
  children: RowConfig[]
}
```

### RowConfig

```ts
interface RowConfig {
  visible?: boolean | ((context) => boolean)
  bind?: Record<string, any> | ((context) => Record<string, any>)
  props?: Record<string, any> | ((context) => Record<string, any>)
  gutter?: number
  children: FormItemConfig[]
}
```

### FormItemConfig

```ts
interface FormItemConfig {
  key: string
  type: FormItemType
  layout?: {
    span?: number | string
    colProps?: Record<string, any> | ((context) => Record<string, any>)
  }
  component?: {
    customComponent?: string
    slotName?: string
    bind?: Record<string, any> | ((context) => Record<string, any>)
    listeners?: Record<string, (context, ...args) => void>
    options?: Array<{ label: string; value: any }> | ((context) => Array<{ label: string; value: any }>)
    optionProps?: {
      label?: string
      value?: string
      disabled?: string
      key?: string
    } | ((context) => {
      label?: string
      value?: string
      disabled?: string
      key?: string
    })
  }
  display?: {
    tooltip?: boolean | {
      enabled?: boolean
      props?: Record<string, any> | ((context) => Record<string, any>)
    }
    formatter?: (value, context) => any
    emptyText?: string
  }
  behavior?: {
    visible?: boolean | ((context) => boolean)
    defaultValue?: any | ((context) => any)
    onValueChange?: (context) => Partial<TableRow> | void
  }
  rules?: any[]
  label?: string
  labelWidth?: string
}
```

推荐写法：

```ts
{
  key: 'name',
  type: 'input',
  label: '姓名',
  layout: {
    span: 12
  },
  component: {
    bind: ({ row }) => ({
      disabled: row.status === false,
      placeholder: row.status === false ? '当前已停用' : '请输入姓名'
    }),
    listeners: {
      blur: ({ value, setValue }) => setValue(String(value || '').trim())
    }
  },
  display: {
    tooltip: true,
    emptyText: '-'
  },
  behavior: {
    defaultValue: ''
  }
}
```

其中 `key` 支持路径写法，比如：

- `name`
- `profile.city`
- `contact.phone`

`component.listeners` 用来监听具体字段组件抛出的事件，适合处理 `blur`、`focus`、`change` 这类组件级交互。

`component.bind`、`layout.colProps`、`display.tooltip.props`、`component.options`、`component.optionProps` 也支持函数写法，会按当前 `row / index / fieldKey / formData / tableData` 动态解析。

```ts
{
  key: 'department',
  type: 'input',
  component: {
    bind: ({ row }) => ({
      disabled: row.status === false,
      placeholder: row.status === false ? '当前已停用，部门不可编辑' : '请输入部门'
    })
  }
}
```

`behavior.onValueChange` 用来处理字段联动。它会在字段值真正变更后执行，如果返回一个 patch，组件会继续把 patch 合并回当前行，并沿用同一条更新链路。

通过 `addRow`、`insertRow`、`copyRow` 新增行时，默认值和传入的种子值也会触发这套联动逻辑。

```ts
{
  key: 'level',
  type: 'select',
  behavior: {
    onValueChange: ({ value }) => {
      if (value === 'junior') {
        return { remark: '' }
      }
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
- `slot`
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

- 组件属性统一放进 `component.bind`
- 行列显隐、默认值、文本展示这类结构能力再使用独立配置

### 组件属性

```ts
{
  key: 'name',
  type: 'input',
  component: {
    bind: {
      placeholder: '请输入姓名',
      disabled: false
    }
  }
}
```

## 校验规则说明

支持这两种规则写法：

- 精确路径：`tableData.0.name`
- 通配路径：`tableData.*.name`

推荐在动态行场景中优先使用通配路径，组件内部会按当前行索引自动匹配到对应字段。

### 更多组件属性

```ts
{
  key: 'remark',
  type: 'textarea',
  component: {
    bind: {
      rows: 3,
      maxlength: 100,
      showWordLimit: true
    }
  }
}
```

## 插槽扩展

如果某个单元格需要完全自定义，可以用 `slot`。

配置：

```ts
{
  key: 'school',
  type: 'slot',
  layout: {
    span: 24
  },
  component: {
    slotName: 'table-school'
  }
}
```

模板：

```vue
<FormTable ...>
  <template #table-school="{ value, setValue }">
    <el-select :value="value" placeholder="请选择学校" @input="setValue">
      <el-option label="县一小" value="县一小" />
      <el-option label="县二中" value="县二中" />
    </el-select>
  </template>
</FormTable>
```

插槽参数：

- `row`
- `index`
- `rowCount`
- `isFirstRow`
- `isLastRow`
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
- `moveCurrentRow`
- `moveUp`
- `moveDown`
- `validateCurrentField`
- `validateCurrentRow`
- `clearCurrentFieldValidate`
- `clearCurrentRowValidate`

推荐使用 `value` / `setValue` 更新当前字段，避免直接改 `row` 绕过内部联动和事件链路。

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
  component: {
    customComponent: 'PhoneInput',
    bind: {
      placeholder: '请输入手机号',
      clearable: true
    }
  }
}
```

## 当前推荐参考

如果你要看现成示例，优先看：

- `src/views/FormTableView.vue`
- `src/views/FormTableAdvancedView.vue`
- `src/views/DynamicSlotTestView.vue`

如果你要看实现，优先看：

- `src/components/FormTable/index.vue`
- `src/components/FormTable/FormTableItem.vue`
- `src/components/FormTable/ComponentWrapper.vue`
- `src/components/FormTable/types.ts`
