# 事件与 Ref API

FormTable 同时透出业务事件、Element UI table 事件和 ref 方法。

## 数据事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:tableData` | `TableRow[]` | 行数据更新 |
| `update:formData` | `FormTableRecord` | 表单上下文数据更新 |
| `field-change` | `FormTableFieldChangePayload` | 字段值变化 |
| `validate` | `valid, errors` | 整体校验结果 |

## 行操作事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `row-add` | `row, index` | 新增行 |
| `row-copy` | `row, index` | 复制行 |
| `row-update` | `row, index` | 更新行 |
| `row-move` | `row, fromIndex, toIndex` | 移动行 |
| `row-remove` | `row, index` | 删除行 |

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

## Ref 方法

```ts
import type { FormTableExpose } from 'formtable'

const formTableRef = ref<FormTableExpose>()
```

表单方法：

- `validate`
- `resetFields`
- `validateField`
- `validateRow`
- `clearValidate`

行操作：

- `addRow`
- `insertRow`
- `copyRow`
- `updateRow`
- `moveRow`
- `getRow`
- `removeRow`

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
