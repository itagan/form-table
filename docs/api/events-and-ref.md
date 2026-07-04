# 事件与 Ref API

FormTable 同时透出业务事件、Element UI table 事件和 ref 方法。

## 数据事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:tableData` | `TableRow[]` | 行数据更新 |
| `update:formData` | `FormTableRecord` | 表单上下文数据更新 |
| `field-change` | `FormTableFieldChangePayload` | 字段值变化 |
| `validate` | `valid, errors` | 整体校验结果 |

```vue
<FormTable
  :table-data="tableData"
  :columns="columns"
  :rules="rules"
  @update:tableData="tableData = $event"
  @field-change="handleFieldChange"
  @validate="handleValidate"
/>
```

`field-change` payload：

```ts
interface FormTableFieldChangePayload {
  row: TableRow
  index: number
  fieldKey: string
  value: unknown
  previousValue: unknown
}
```

## 行操作事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `row-add` | `row, index` | 新增行 |
| `row-copy` | `row, index` | 复制行 |
| `row-update` | `row, index` | 更新行 |
| `row-move` | `row, fromIndex, toIndex` | 移动行 |
| `row-remove` | `row, index` | 删除行 |

这些事件由 ref 方法、插槽上下文方法或内部行操作统一触发，适合做审计日志、外部状态同步和埋点。

## Element Table 事件

FormTable 会保持 Element UI table 原始事件参数，并额外进入统一 `event` 归档。

常用事件：

- `select`
- `select-all`
- `selection-change`
- `cell-click`
- `cell-dblclick`
- `row-click`
- `row-dblclick`
- `sort-change`
- `filter-change`
- `current-change`
- `expand-change`

统一归档事件：

```ts
function handleFormTableEvent(payload: FormTableEventPayload) {
  console.log(payload.type, payload.args)
}
```

`@event` 不替代原始事件监听。需要 Element UI 原始参数时直接监听同名事件；需要统一收敛日志时监听 `@event`。

## Ref 方法

```ts
import type { FormTableExpose } from '@itagan/form-table'

const formTableRef = ref<FormTableExpose>()
```

表单方法：

- `validate`
- `resetFields`
- `validateField`
- `validateRow`
- `clearValidate`

```ts
const submit = async () => {
  const valid = await formTableRef.value?.validate()
  if (!valid) return
  // submit tableData
}

const validateFirstRow = async () => {
  await formTableRef.value?.validateRow(0)
}
```

行操作：

- `addRow`
- `insertRow`
- `copyRow`
- `updateRow`
- `moveRow`
- `getRow`
- `removeRow`

```ts
formTableRef.value?.addRow({ name: '', age: 0 })
formTableRef.value?.insertRow(1, { name: '新行' })
formTableRef.value?.copyRow(0, { name: '复制行' })
formTableRef.value?.moveRow(2, 0)
formTableRef.value?.removeRow(1)
```

表格方法：

- `clearSelection`
- `toggleRowSelection`
- `toggleAllSelection`
- `toggleRowExpansion`
- `setCurrentRow`
- `clearSort`
- `clearFilter`
- `doLayout`
- `sort`

原生实例：

- `getNativeFormRef`
- `getNativeTableRef`

当公开方法无法覆盖某个 Element UI 原生能力时，可以通过原生实例兜底：

```ts
formTableRef.value?.getNativeTableRef()?.doLayout?.()
formTableRef.value?.getNativeFormRef()?.clearValidate?.()
```

## 插槽上下文方法

字段插槽会收到当前行上下文和行操作方法：

```vue
<template
  #table-actions="{
    value,
    setValue,
    updateRow,
    removeCurrentRow,
    copyCurrentRow,
    insertAfter,
    moveUp,
    moveDown,
    validateCurrentRow
  }"
>
  <el-button @click="copyCurrentRow()">复制</el-button>
  <el-button @click="insertAfter({ name: '' })">插入</el-button>
  <el-button type="danger" @click="removeCurrentRow()">删除</el-button>
</template>
```

字段值更新请优先使用 `setValue`，需要同时更新多个字段时使用 `updateRow`。避免直接修改 `row`，否则可能绕过统一事件和校验清理。
