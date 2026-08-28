# 共享插槽与循环 FormTable

> 可运行 Demo：[打开共享插槽与循环表格 ↗](http://localhost:5173/shared-slot-loop)

业务页面经常按需求类型循环渲染多个 FormTable，并让所有实例共享同一份列配置和操作插槽。例如会场、酒店和用餐板块具有相同字段，只是各自维护独立行数据。

这个场景可以安全共享配置。需要分别稳定四类身份：

| 身份 | 推荐值 | 作用 |
| --- | --- | --- |
| 板块组件 | `:key="section.type"` | 同一业务板块复用同一个 FormTable 实例 |
| 数据行 | `row-key="id"` | 排序、异步更新和行替换后定位原行 |
| 共享列 | `columns[].key` | 多实例和动态列更新时保持列语义 |
| Slot 名称 | `cellSlot: 'row-actions'` | 让共享操作列解析父组件同名模板 |

## 直接绑定循环项

当 `section.tableData` 就是该表格的唯一数据源时，可以直接使用 `v-model`：

```vue
<section v-for="section in sections" :key="section.type">
  <h2>{{ section.label }}</h2>

  <FormTable
    v-model="section.tableData"
    :columns="sharedColumns"
    row-key="id"
  >
    <template #row-actions="{ index }">
      <el-button type="text" @click="appendRow(section)">新增</el-button>
      <el-button type="text" @click="removeRow(section, index)">删除</el-button>
    </template>
  </FormTable>
</section>
```

```ts
const actionColumn: ColumnConfig = {
  key: 'actions',
  label: '操作',
  cellSlot: 'row-actions',
  props: { width: 150, fixed: 'right' }
}

// 所有 FormTable 有意共享同一个数组和 actionColumn 对象。
const sharedColumns: ColumnConfig[] = [nameColumn, quantityColumn, actionColumn]

function appendRow(section: DemandSection) {
  section.tableData = [...section.tableData, createRow(section.type)]
}

function removeRow(section: DemandSection, index: number) {
  section.tableData = section.tableData.filter((_, rowIndex) => rowIndex !== index)
}
```

共享列应当作为只读描述使用。不要在某个板块中原地修改 `actionColumn.props` 或 `sharedColumns`；实例之间需要不同配置时，使用配置工厂返回独立对象。

## 整体重建板块对象

接口刷新、表单重置或深层 watch 可能替换整个数组，同时保留相同业务 key：

```ts
function rebuildSections() {
  sections.value = selectedTypes.value.map(type => ({
    type,
    label: resolveLabel(type),
    tableData: [createRow(type)]
  }))
}
```

此时旧、新板块对象身份不同，但 `section.type` 相同，因此 Vue 会复用对应的 FormTable 实例。FormTable 会在每次渲染时解析父组件最新的 cellSlot、headerSlot、字段 Slot、Label Slot 和 Error Slot；无需克隆共享列，也不需要通过随机 key 强制重挂载。

可运行 Demo 会显示每个板块的对象代数。点击“重建全部板块”后，再操作任意非最后板块，最近操作中的“插槽捕获对象”仍应显示为当前循环对象。

## 异步操作使用稳定标识

同步点击可以直接使用当前 `section`。如果操作跨越 `await`，等待期间板块可能再次被接口刷新，此时应传稳定标识，并在写入前重新查找当前对象：

```vue
<template #row-actions="{ row }">
  <el-button @click="approve(section.type, row.id)">通过</el-button>
</template>
```

```ts
async function approve(type: DemandType, rowId: string) {
  await saveApproval(rowId)

  const section = sections.value.find(item => item.type === type)
  if (!section) return

  section.tableData = section.tableData.map(row => (
    row.id === rowId ? { ...row, status: 'approved' } : row
  ))
}
```

这不是共享 Slot 的补丁，而是通用的异步数据规则：任何对象引用经过 `await` 后都可能已经不再属于当前受控数据源。

## 派生列表不要直接 v-model

如果循环变量来自过滤、分组或排序副本，表达式并不是唯一数据源，应显式接收更新并回写源数据：

```vue
<FormTable
  :table-data="section.visibleRows"
  :columns="sharedColumns"
  row-key="id"
  @update:tableData="replaceVisibleRows(section.type, $event)"
>
  <template #row-actions="{ row }">
    <el-button @click="removeSourceRow(section.type, row.id)">删除</el-button>
  </template>
</FormTable>
```

结构操作只修改唯一数据源，再由 computed 或 watch 重新派生视图。不要同时修改源数组和过滤副本。

## 不推荐的规避方式

- 不要为刷新 Slot 使用随机 `:key`；它会销毁表格内部状态和校验状态。
- 不要每次渲染深克隆 `columns`；共享静态配置本身是合法用法。
- 不要使用循环下标作为板块 key 或 row-key。
- `fixed: 'right'` 只控制 Element UI 固定列布局，不决定 Slot 数据是否最新。
- 不要直接修改 Slot scope 中只读的 `row`；字段更新使用 `updateRow`，数组增删由页面替换 `tableData`。

## 相关文档

[`cellSlot` 列级单元格](../features/cell-slot.md) · [稳定身份与异步安全](../features/stable-identity.md) · [受控数据流](../architecture/controlled-data-flow.md) · [常见操作列与行增删](../features/common-row-actions.md)
