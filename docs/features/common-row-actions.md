# 常见操作列与行增删

> 可运行 Demo：[打开行列操作示例 ↗](http://localhost:5173/row-column-operations)

新增、插入、复制和删除会改变整张表的数据结构，应由页面直接替换受控的 `tableData`。操作按钮不对应字段值，也不参与校验，推荐使用列级 [`cellSlot`](./cell-slot.md)，不需要为操作列虚构 `fieldKey`。

## 完整示例

下面的例子包含：

- 工具栏在表格末尾新增空行。
- 操作列在当前行后插入空行。
- 复制当前行业务字段，并生成新的行标识。
- 删除当前行。
- 行结构变化后清理基于旧数组下标的校验状态。

```vue
<template>
  <div>
    <el-button type="primary" @click="appendRow">末尾新增</el-button>

    <FormTable
      ref="formTableRef"
      v-model="tableData"
      :columns="columns"
      row-key="_rowKey"
      :table-props="{ border: true }"
    >
      <template #row-actions="{ row, index }">
        <el-button type="text" @click="insertAfter(index)">后插一行</el-button>
        <el-button type="text" @click="copyRow(row, index)">复制</el-button>
        <el-button type="text" class="danger" @click="removeRow(row)">删除</el-button>
      </template>
    </FormTable>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import FormTable from '@itagan/form-table'
import type {
  ColumnConfig,
  FormTableExpose,
  TableRow
} from '@itagan/form-table'

type ContactRow = TableRow & {
  _rowKey: string
  id?: number
  name: string
  phone: string
  enabled: boolean
}

let clientSequence = 0
const createRowKey = () => `client:${Date.now()}:${++clientSequence}`
const createEmptyRow = (): ContactRow => ({
  _rowKey: createRowKey(),
  name: '',
  phone: '',
  enabled: true
})

const tableData = ref<ContactRow[]>([
  {
    _rowKey: 'server:1',
    id: 1,
    name: '张三',
    phone: '13800000000',
    enabled: true
  }
])
const formTableRef = ref<FormTableExpose>()

const columns: ColumnConfig[] = [
  {
    key: 'name-column',
    label: '姓名',
    formItems: [{
      key: 'name-field',
      fieldKey: 'name',
      type: 'input',
      formItemProps: {
        rules: [{ required: true, message: '请输入姓名' }]
      }
    }]
  },
  {
    key: 'phone-column',
    label: '手机号',
    formItems: [{
      key: 'phone-field',
      fieldKey: 'phone',
      type: 'input'
    }]
  },
  {
    key: 'actions-column',
    label: '操作',
    cellSlot: 'row-actions',
    props: { minWidth: 220, fixed: 'right' }
  }
]

const clearStructureValidation = async () => {
  await nextTick()
  formTableRef.value?.clearValidate()
}

// 在表格最后新增。
const appendRow = () => {
  tableData.value = [...tableData.value, createEmptyRow()]
  clearStructureValidation()
}

// Slot 的 index 来自本次同步点击，可用于确定插入位置。
const insertAfter = (index: number) => {
  tableData.value = [
    ...tableData.value.slice(0, index + 1),
    createEmptyRow(),
    ...tableData.value.slice(index + 1)
  ]
  clearStructureValidation()
}

const copyRow = (source: ContactRow, index: number) => {
  const copy: ContactRow = {
    _rowKey: createRowKey(),
    name: `${source.name}（复制）`,
    phone: source.phone,
    enabled: source.enabled
  }
  tableData.value = [
    ...tableData.value.slice(0, index + 1),
    copy,
    ...tableData.value.slice(index + 1)
  ]
  clearStructureValidation()
}

// 使用稳定身份删除，避免确认框或接口等待期间行顺序变化后删错。
const removeRow = (target: ContactRow) => {
  tableData.value = tableData.value.filter(
    row => row._rowKey !== target._rowKey
  )
  clearStructureValidation()
}
</script>
```

## 操作列配置

操作列只负责渲染按钮，配置保持很小：

```ts
const actionColumn: ColumnConfig = {
  key: 'actions-column',
  label: '操作',
  cellSlot: 'row-actions',
  props: { minWidth: 220, fixed: 'right' }
}
```

`cellSlot` 直接提供 `row/index/updateRow`。增删复制属于数组级操作，应调用页面函数替换 `tableData`；只有修改当前行字段时才使用 `updateRow`。

## 抽成可复用按钮组件

多个页面使用相同按钮布局时，可以只把按钮视图抽成组件，数据操作仍由页面负责：

```vue
<template #row-actions="{ row, index }">
  <RowActions
    :disable-delete="tableData.length <= 1"
    @insert-after="insertAfter(index)"
    @copy="copyRow(row, index)"
    @remove="removeRow(row)"
  />
</template>
```

`RowActions` 只发出 `insert-after/copy/remove` 事件，不直接接收或修改整张 `tableData`。这样组件可以复用，行标识、默认值、删除确认和接口调用仍留在了解业务规则的页面中。

## 使用边界

- `index` 适合同步点击后的插入和复制；经过 `await` 后应重新按稳定 `rowKey` 查找目标行。
- 复制行时不能沿用后端 `id` 或前端 `_rowKey`。嵌套对象应按业务字段继续复制，不能只依赖浅展开。
- 删除需要确认或调用接口时，应在成功后再替换 `tableData`，并按稳定身份删除。
- 行结构变化会改变 Element Form 的数组下标校验路径，应在 `nextTick` 后调用 `clearValidate()`。
- 页面直接增删行不会触发 FormTable 的 `update:tableData` 或 `field-change`；保存、埋点等副作用由页面同时处理。

确认后删除、校验通过后新增、移动行和异步提交的更多模式见[行列操作与异步提交](./row-column-operations.md)。

## 相关 API

[Column / Item](../api/columns.md) · [事件与 Ref](../api/events-and-ref.md)
