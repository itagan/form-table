# cellSlot 列级单元格

> 可运行 Demo：[打开 cellSlot 专项页 ↗](http://localhost:5173/cell-slot)

`cellSlot` 是与 Item 字段链路并列的列级渲染入口。它适合操作按钮、状态、图片、派生值和多字段组合展示。

公开配置中没有 `colSlot`；列级内容使用 `cellSlot`，自定义表头使用 `headerSlot`。

## 配置示例

```ts
const columns: ColumnConfig[] = [{
  key: 'actions-column',
  label: '操作',
  cellSlot: 'row-actions',
  props: { width: 180, fixed: 'right' }
}]
```

## 使用示例

这里只展示最小的当前行更新和删除；末尾新增、当前行后插入、复制与删除的完整组合见[常见操作列与行增删](./common-row-actions.md)。

```vue
<template #row-actions="{ row, index, updateRow }">
  <el-button @click="updateRow({ enabled: !row.enabled })">切换</el-button>
  <el-button @click="removeRow(index)">删除</el-button>
</template>
```

## 渲染路径

```text
cellSlot 列
el-table-column → scoped Slot

字段列
el-table-column → el-row → el-col → el-form-item → Component / Field Slot
```

`cellSlot` 不创建 FormTable 内部的 `el-row/el-col/el-form-item`，Slot 返回的 VNode 直接进入 Element UI 单元格。

## 配置路径

| 路径 | 类型 | 说明 |
| --- | --- | --- |
| `columns[].cellSlot` | `string` | 父组件具名 scoped Slot |
| `columns[].formItems` | `never` | 与 `cellSlot` 互斥 |
| `columns[].key` | `string` | 建议为动态列提供稳定身份 |
| `columns[].props` | `DynamicValue<ComponentProps, ColumnContext>` | 透传 `el-table-column` |
| `columns[].headerSlot/headerProps/headerHint` | 列级配置 | 与字段列共用表头能力 |

## Slot scope

```ts
interface FormTableCellSlotContext {
  row: Readonly<TableRow>
  index: number
  displayIndex: number
  columnConfig: Readonly<CellSlotColumnConfig>
  updateRow: (patch: FormTableRowPatch<TableRow>) => void
}
```

| 字段 | 时效 | 说明 |
| --- | --- | --- |
| `row` | 渲染快照 | 当前行，不要直接修改 |
| `index` | 渲染快照 | 当前行在受控 `tableData` 中的数据源下标 |
| `displayIndex` | 渲染快照 | 排序或筛选后的显示下标，仅用于界面位置 |
| `columnConfig` | 配置快照 | 当前列原始配置 |
| `updateRow` | 绑定当前行 | 不可变更新，patch key 支持嵌套路径 |

不提供：

```text
tableData / columnIndex / fieldKey / value / setValue
itemConfig / propPath / component
```

## 与字段 Slot 的选择

| 问题 | 选择 |
| --- | --- |
| 只从 `row` 读取展示值或执行行操作 | `cellSlot` |
| 需要 `fieldKey/value/setValue` | `type: 'slot'` |
| 需要自动解析 `formItemProps.rules` 或 `propPath` | `type: 'slot'` |
| 需要已解析 `component.props/options/listeners` | `type: 'slot'` |
| 原生选择或序号列 | `column.type` |

`cellSlot` 内可以放置交互组件。单字段编辑优先使用字段 Slot；需要不规则多 Row 布局时，可以手写 Element Form 组件并接入根表单。

## 详情与编辑模式

详情和编辑布局一致、组件本身支持 `readonly/disabled` 时，可以复用同一份 `formItems`。这种方式切换简单，但详情模式仍然挂载输入组件、FormItem 和校验链路。

简单字段只需展示原值时，优先把 Item 改为 `type: 'text'`。同一列有多个字段也继续使用多个 `formItems`，不需要因为是详情模式就改成 `cellSlot`：

```ts
{
  key: 'basic-detail',
  label: '基础信息',
  formItems: [
    { fieldKey: 'name', type: 'text', colProps: { span: 12 } },
    { fieldKey: 'department', type: 'text', colProps: { span: 12 } }
  ]
}
```

`type: 'text'` 保留字段路径、FormItem、Hint 和 Row/Col 布局。只有标签、图片、派生值、多个字段组合成一个整体或详情结构明显不同时，才需要 `cellSlot`。

详情展示结构明显不同时，可为同一个业务列准备两份互斥配置：

```ts
const editColumn: ColumnConfig = {
  key: 'score-column',
  label: '评分',
  formItems: [{ fieldKey: 'score', type: 'number' }]
}

const detailColumn: ColumnConfig = {
  key: 'score-column',
  label: '评分',
  cellSlot: 'score-detail'
}

const columns = computed(() => [
  mode.value === 'edit' ? editColumn : detailColumn
])
```

```vue
<template #score-detail="{ row }">
  <strong>{{ row.score }}</strong>
</template>
```

两份配置可以共享稳定 key、标题、列宽和业务 formatter，但不能在一个对象上同时保留 `formItems` 与 `cellSlot`。结构切换后在 `nextTick` 调用 `clearValidate()`，避免编辑模式的旧校验展示残留。更完整的模式选择和配置工厂见[权限、只读与编辑模式](./permissions-and-editing.md)。

## 手写多 Row 表单

```vue
<template #contact-fields="{ row, index, updateRow }">
  <div>
    <el-row :gutter="8">
      <el-col :span="12">
        <el-form-item
          label="姓名"
          :prop="`tableData.${index}.name`"
          :rules="[{ required: true, message: '请输入姓名' }]"
        >
          <el-input :value="row.name" @input="updateRow({ name: $event })" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :prop="`tableData.${index}.phone`" label="手机">
          <el-input :value="row.phone" @input="updateRow({ phone: $event })" />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item :prop="`tableData.${index}.address`" label="地址">
          <el-input :value="row.address" @input="updateRow({ address: $event })" />
        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>
```

只要 `el-form-item` 仍在 FormTable 根 `el-form` 内，且 `prop` 使用 `tableData.${index}.${fieldKey}` 完整路径，`validate/clearValidate/getFormRef` 仍能管理它。`cellSlot` 不会自动提供字段 Hint、`setValue`、`propPath`、`component` 或 FormItem 配置解析；值写回统一使用 `updateRow()`。

## updateRow 与事件

```vue
<template #row-actions="{ updateRow }">
  <el-button @click="updateRow({
    status: 'approved',
    'audit.operatorId': currentUser.id
  })">通过</el-button>
</template>
```

一次 `updateRow` 最多发出一个 `update:tableData`，并为每个实际变化的 patch key 发出 `field-change`。相同值会跳过；所有值都未变时不发出事件。

使用根组件 `v-model` 会自动立即回写：

```vue
<FormTable v-model="tableData" :columns="columns">
  <!-- cellSlot 模板 -->
</FormTable>
```

需要显式监听 `update:tableData` 时，处理器也必须先同步父组件状态。

## 异步操作与 rowKey

```ts
const rowKey = 'id'

async function approve(context: FormTableCellSlotContext) {
  await save(context.row.id)
  context.updateRow({ status: 'approved' })
}
```

`index` 在异步结束后可能已过期。`updateRow` 会使用绑定的原行身份；配置唯一稳定的 rowKey 后，会在最新 `tableData` 中重新定位。目标已删除、rowKey 缺失或重复时忽略更新。

## 约束与空内容

- 未找到 `cellSlot` 对应的具名 Slot 时渲染空单元格。
- `cellSlot` 不与 `formItems` 混用，TypeScript 联合类型会拒绝该配置。
- `selection/index/expand` 等 Element 功能列通过纯透传列的 `props` 配置，不与 `cellSlot` 混用。
- 固定列仍使用 `columns[].props.fixed`，其 DOM 复制行为遵循 Element UI。

## 完整示例

Playground [`/cell-slot`](http://localhost:5173/cell-slot) 同时演示：

- 多字段基础详情使用多个 `type: 'text'` Item。
- 状态和派生金额。
- `updateRow` 和 `field-change`。
- 异步更新与 rowKey。
- 字段 Slot 的对照展示。
- 评分列在编辑字段 Slot 与详情 `type: 'text'` 之间切换。
- 实际 `FormTableCellSlotContext` 检视面板。

## 相关 API

[Column / Item](../api/columns.md) · [Slot 与上下文](../api/contexts.md) · [事件与 Ref](../api/events-and-ref.md)
