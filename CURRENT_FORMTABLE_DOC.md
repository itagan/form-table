# FormTable 当前文档

这份文档以当前仓库代码为准，适用于 `Vue 2.7 + Element UI + TypeScript`。

文档站拆分版入口见 `docs/README.md`。当前文件仍保留完整长文，便于集中检索。

## 组件定位

`FormTable` 是一个“表格内嵌表单”组件。

适合这类场景：

- 后台编辑表格
- 每一行都是一组表单字段
- 需要统一校验、动态增删行
- 需要插槽或自定义组件扩展单元格
- 需要透传 Element UI 原生表头渲染能力

组件入口：

- `packages/form-table/src/index.vue`

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

## 能力矩阵

| 能力 | 使用方式 | 说明 |
|------|----------|------|
| FormTable 自有 props | `tableData`、`columns`、`rules`、`formData`、`customComponents`、`loading` | 管理表格内表单的数据、结构、校验和扩展组件 |
| Element Form props | 顶层 attrs，如 `label-width`、`size`、`disabled` | 通过白名单透传给内部 `el-form` |
| Element Table props | 顶层 attrs，如 `border`、`stripe`、`height`、`max-height` | 通过白名单透传给内部 `el-table` |
| Element Table events | 直接监听同名事件，如 `@row-click`、`@selection-change`、`@sort-change` | 参数保持 Element UI 原生格式，同时进入 `@event` 安全归档 |
| Element Form methods | `ref.validate()`、`ref.resetFields()`、`ref.clearValidate()`、`ref.getNativeFormRef()` | FormTable ref 汇总常用方法，也可取原生实例 |
| Element Table methods | `ref.clearSelection()`、`ref.doLayout()`、`ref.sort()`、`ref.getNativeTableRef()` | FormTable ref 汇总常用方法，也可取原生实例 |
| Element Table Column props | `column.props`，如 `width`、`align`、`type`、`renderHeader` | 透传给 `el-table-column`；`type=index/selection/expand` 使用原生列渲染 |
| FormTable 扩展能力 | 字段 slot、表头 slot、`required`、行操作、路径字段、显隐和联动 | 解决表格内表单场景中 Element UI 原生 API 不直接覆盖的部分 |

## 功能语义

- 字段更新统一入口：内置组件、slot、自定义组件都应通过 `dispatch('update:row')` 或 slot 暴露的 `setValue/updateRow` 进入 `commitRowChange`。
- 列头支持 `required`、`headerSlot` 和 `column.props.renderHeader`；原生 `renderHeader` 优先级最高。
- 字段联动保持同步模型：`behavior.onValueChange` 返回当前行 patch，不引入异步联动队列。
- 隐藏字段策略：字段隐藏后保留原值，但会清理 Element UI 上残留的校验状态。
- 路径字段策略：`profile.city` 这类 key 贯穿取值、更新、默认值、联动和校验路径。
- 事件策略：具体业务事件保持原参数，同时 `event` 事件用于日志、埋点或统一调试归档。

### 字段更新边界

| 来源 | 推荐入口 | 行为 |
|------|----------|------|
| 内置组件 | `dispatch('update:row', rowIndex, row, fieldKey, value)` | 更新当前字段，继续执行同步联动，派发 `field-change` |
| slot 字段 | `setValue(value)` / `updateRow(patch)` | 复用内部 dispatch 链路，避免直接改 `row` |
| 自定义组件 | `v-model` / `input` 进入 `ComponentWrapper` | 与内置组件一致，最终收口到 `commitRowChange` |
| ref 行方法 | `updateRow(index, patch)` | 复用字段提交入口，支持路径 patch 和联动 |

不推荐在 slot 或自定义组件里直接修改 `row.xxx`。直接写入虽然可能让当前渲染短暂变化，但会绕过路径 patch、`onValueChange`、`field-change` 和 `update:formData` 同步。

### 索引列

索引列复用 Element UI 原生 `el-table-column` 能力，通过 `column.props.type = 'index'` 配置。FormTable 会跳过单元格表单布局，让 Element UI 自己渲染索引内容。

表格内表单行通常是动态高度，不建议给索引列配置 `fixed`；Element UI 固定列克隆在复杂行高下可能出现高度不同步。

```ts
const columns = [
  {
    name: '序号',
    props: {
      type: 'index',
      width: '70px',
      align: 'center',
      index: (index) => index + 1
    },
    children: []
  }
]
```

### 表头渲染

列头渲染优先级为：`props.renderHeader` > `headerSlot` > 默认表头。默认表头会在 `required: true` 时展示必填标识。

`ColumnConfig.required` 只控制列头必填标识；字段校验可以通过字段顶层 `required`、全局 `rules` 或字段自身 `rules` 配置。

```ts
const columns = [
  {
    name: '姓名',
    required: true,
    headerSlot: 'name-header',
    children: []
  }
]
```

```vue
<template #name-header="{ label, required }">
  <span v-if="required" class="required-mark">*</span>
  <span>{{ label }}</span>
  <el-tooltip content="按姓名筛选">
    <i class="el-icon-search"></i>
  </el-tooltip>
</template>
```

`headerSlot` 的上下文包含 `column`、`columnIndex`、`label`、`required`、`formData` 和 `tableData`。

FormTable 的 `column.props` 会直接透传给 `el-table-column`，因此也可以使用 Element UI 原生 `render-header` 对应的 camelCase 写法 `renderHeader`：

```ts
const columns = [
  {
    name: '联系方式',
    props: {
      renderHeader: (h, { column }) => h('span', [
        h('span', column.label),
        h('el-tooltip', {
          props: {
            content: '按姓名筛选'
          }
        }, [
          h('i', {
            class: 'el-icon-search'
          })
        ])
      ])
    },
    children: []
  }
]
```

`renderHeader` 的参数保持 Element UI 原生格式：`(h, { column, $index })`。

### 数据同步边界

`tableData` 是行编辑的主数据源。每次行数据变化都会产生新的数组并派发：

1. `update:tableData`
2. `update:formData`，其中 `formData.tableData` 使用同一份最新表格数据

外层可以只监听 `update:tableData` 管理表格，也可以监听 `update:formData` 作为完整表单提交模型。组件内部不会直接修改传入的 `props.tableData` 数组。

### 联动边界

`behavior.onValueChange` 只处理同步联动：

- 入参提供当前字段值、旧值、当前行、行索引、`formData`、`tableData` 和 `getValue(path)`。
- 返回值是当前行 patch；返回 `void` 表示不追加变更。
- patch 支持普通 key 和路径 key，例如 `{ remark: '' }`、`{ 'profile.city': '上海' }`。
- 多字段联动会合并为一次行更新，再逐项派发最终的 `field-change`。

异步请求、远程选项加载、复杂副作用建议放在业务侧事件或字段组件内部处理，避免把表格提交链路变成不可预测的异步队列。

### 校验和显隐边界

动态显隐只影响渲染和校验状态，不改变行数据里的字段值：

- `visible: false` 后，字段值会保留。
- 组件会在 `nextTick` 合并清理隐藏字段的 Element UI 校验状态。
- 行级校验只检查当前可见字段。
- 规则路径支持精确索引和通配索引：`tableData.0.name`、`tableData.*.name`。

这意味着隐藏字段重新显示时，仍会拿到隐藏前的值；如需清空值，应通过 `onValueChange` 或业务侧显式 patch 完成。

### 事件归档边界

内部命令只负责组件内部更新，不进入统一 `event` 归档：

- `update:row`
- `update:row-data`

公开业务事件会保持原参数派发，并额外进入 `event`：

- `field-change`
- `row-add`
- `row-copy`
- `row-update`
- `row-move`
- `row-remove`
- `validate`
- Element UI Table 原生事件：`select`、`select-all`、`selection-change`、`cell-mouse-enter`、`cell-mouse-leave`、`cell-click`、`cell-dblclick`、`row-click`、`row-contextmenu`、`row-dblclick`、`header-click`、`header-contextmenu`、`sort-change`、`filter-change`、`current-change`、`header-dragend`、`expand-change`

## Demo 能力归类

当前示例页面覆盖以下能力：

- 基础编辑：`playground/src/views/FormTableView.vue`
- 自定义组件：`PhoneInput`、`StatusTag`、`TestComponent`、`SimpleTest`
- slot 操作列：`playground/src/views/FormTableAdvancedView.vue`
- 动态显隐和字段联动：`playground/src/views/DynamicSlotTestView.vue`
- 调试排查：`playground/src/views/DebugView.vue`

后续清理建议：高级示例中仍保留少量开发调试块和 inline style，可在 demo 产品化时统一收敛，但不影响当前组件 API。

## 配置原则

- 常用字段直接配置，比如 `label`、`placeholder`、`required`、`options`
- 组件高级属性通过 `component.bind` 配置，并可覆盖顶层常用字段
- 结构能力按职责分组到 `layout`、`component`、`display`、`behavior`
- 顶层 `attrs` 继续负责 `el-form` / `el-table` / `el-table-column` 的通用扩展
- 只有 `visible`、`defaultValue`、`formatter`、`layout.colProps` 这类透传本身解决不了的结构能力，才额外提供配置项

## 基础用法

`@itagan/form-table` 包入口只导出业务侧稳定使用的公开类型。内部 provide/inject key、dispatch 和内部事件命令保留在源码内部，不作为 npm 包 API 承诺。

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
import FormTable from '@itagan/form-table'
import type {
  ColumnConfig,
  FormTableEventPayload,
  FormTableRecord,
  TableRow
} from '@itagan/form-table'

const tableData = ref<TableRow[]>([
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
          placeholder: '请输入姓名',
          required: true,
          requiredMessage: '请输入姓名'
        },
        {
          key: 'level',
          type: 'select',
          layout: { span: 12 },
          placeholder: '请选择职级',
          required: true,
          requiredMessage: '请选择职级',
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

const handleTableDataUpdate = (newData: TableRow[]) => {
  tableData.value = newData
  formData.tableData = newData
}

const handleFormDataUpdate = (newData: FormTableRecord) => {
  Object.assign(formData, newData)
}

const eventLog = ref<FormTableEventPayload[]>([])
const handleFormTableEvent = (payload: FormTableEventPayload) => {
  eventLog.value = [payload, ...eventLog.value].slice(0, 8)
}
</script>
```

## Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `tableData` | `TableRow[]` | 表格数据 |
| `columns` | `ColumnConfig[]` | 列配置 |
| `rules` | `Record<string, ValidationRule[]>` | 校验规则 |
| `formData` | `FormTableRecord` | `el-form` 的 model |
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
| `update:formData` | `FormTableRecord` | 表单数据变更，`tableData` 变更时会自动同步 |
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
- `clearSelection()`
- `toggleRowSelection(row, selected?)`
- `toggleAllSelection()`
- `toggleRowExpansion(row, expanded?)`
- `setCurrentRow(row?)`
- `clearSort()`
- `clearFilter(columnKeys?)`
- `doLayout()`
- `sort(prop, order)`
- `getNativeFormRef()`
- `getNativeTableRef()`

TypeScript 中推荐这样标注：

```ts
import type { FormTableExpose } from '@itagan/form-table'

const formTableRef = ref<FormTableExpose>()
```

## 配置结构

### ColumnConfig

```ts
interface ColumnConfig {
  name: string
  visible?: boolean | ((context) => boolean)
  props?: ComponentBind | ((context) => ComponentBind)
  fieldRow?: Omit<RowConfig, 'children'>
  fields?: FormItemConfig[]
  children?: RowConfig[]
}
```

简单单行字段可以使用 `fields`；它等价于 `children: [{ ...fieldRow, children: fields }]`。需要单元格内多行布局时使用 `children`。

### RowConfig

```ts
interface RowConfig {
  visible?: boolean | ((context) => boolean)
  bind?: ComponentBind | ((context) => ComponentBind)
  props?: ComponentBind | ((context) => ComponentBind)
  gutter?: number
  children: FormItemConfig[]
}
```

### FormItemConfig

```ts
interface FormItemConfig {
  key: string
  type: FormItemType
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  readonly?: boolean
  options?: FormItemOption[] | ((context) => FormItemOption[])
  optionProps?: OptionPropsConfig | ((context) => OptionPropsConfig)
  required?: boolean
  requiredMessage?: string
  trigger?: string | string[]
  layout?: {
    span?: number | string
    colProps?: ComponentBind | ((context) => ComponentBind)
  }
  component?: {
    name?: string
    slotName?: string
    bind?: ComponentBind | ((context) => ComponentBind)
    listeners?: Record<string, FormTableFieldListener>
    options?: FormItemOption[] | ((context) => FormItemOption[])
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
      props?: ComponentBind | ((context) => ComponentBind)
    }
    formatter?: (value, context) => FormTableValue
    emptyText?: string
  }
  behavior?: {
    visible?: boolean | ((context) => boolean)
    defaultValue?: FormTableValue | ((context) => FormTableValue)
    onValueChange?: (context) => Partial<TableRow> | void
  }
  rules?: ValidationRule[]
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

- 常用字段可直接放在顶层，高级组件属性放进 `component.bind`
- 行列显隐、默认值、文本展示这类结构能力再使用独立配置

组件属性覆盖优先级为：组件默认值 < 顶层常用字段 < `component.bind`。

### 组件属性

```ts
{
  key: 'name',
  type: 'input',
  placeholder: '请输入姓名',
  disabled: false,
  component: {
    bind: {
      clearable: true
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

推荐直接传当前页面导入的组件对象：

```ts
import PhoneInput from './PhoneInput.vue'
```

配置：

```ts
{
  key: 'phone',
  type: 'custom',
  component: {
    name: PhoneInput,
    bind: {
      placeholder: '请输入手机号',
      clearable: true
    }
  }
}
```

如果 columns 来自远端 JSON 或需要多表格共享组件，也可以用字符串配合 `customComponents` 注册表：

```ts
const customComponents = [
  { name: 'PhoneInput', component: PhoneInput }
]

const columns = [{
  name: '手机号',
  children: [{
    children: [{
      key: 'phone',
      type: 'custom',
      component: {
        name: 'PhoneInput'
      }
    }]
  }]
}]
```

字符串没有命中 `customComponents` 时，会交给 Vue 动态组件按全局组件名解析。

## 当前推荐参考

如果你要看现成示例，优先看：

- `playground/src/views/FormTableView.vue`
- `playground/src/views/FormTableAdvancedView.vue`
- `playground/src/views/DynamicSlotTestView.vue`

如果你要看实现，优先看：

- `packages/form-table/src/index.vue`
- `packages/form-table/src/FormTableItem.vue`
- `packages/form-table/src/ComponentWrapper.vue`
- `packages/form-table/src/types.ts`
