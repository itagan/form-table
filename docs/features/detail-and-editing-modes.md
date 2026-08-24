# 详情与编辑模式

> 配套 Demo：[`text`、字段 Slot 与 `cellSlot` 对照 ↗](http://localhost:5173/cell-slot)

同一份业务数据经常同时用于详情和编辑。FormTable 不要求所有模式复用同一份 Column，也不要求详情全部改用 `cellSlot`；页面应根据是否需要字段语义、Item Label、格式化和自定义结构选择最小渲染入口。

## 先确定页面目标

| 场景 | 推荐方式 | 实际渲染 |
| --- | --- | --- |
| 抽屉内快速查看、编辑切换，组件支持只读 | 复用编辑 Item，动态设置 `readonly/disabled` | 输入组件和 FormItem 都保留 |
| 需要字段布局、Hint 或 Item Label，只展示原值 | Item 切换为 `type: 'text'` | Row → Col → FormItem → span |
| 需要字段布局，但不展示 Item Label | `type: 'text'` + 空 Label | FormItem 仍保留，不显示 Label |
| 单字段纯展示，不需要 FormItem | 原生 Column `props.prop` | Element Table 原生单元格 |
| 标签、图标、派生值或整格组合 | `cellSlot` | Slot 内容直接进入单元格 |
| 整页只读且不需要 FormTable 能力 | 直接使用 `el-table` | 不创建根 Form 和字段链路 |

详情模式通常是混合策略。例如姓名使用原生 Column，带业务说明的编号使用 `text`，状态 Tag 和金额合计使用 `cellSlot`。不要为了统一写法让全部字段经过最重的渲染路径。

## 快速切换时复用组件

详情只是暂时禁止编辑，并且组件有可靠的只读展示时，可以复用同一份 columns：

```ts
const mode = ref<'detail' | 'edit'>('edit')

const columns: ColumnConfig[] = [{
  key: 'supplier-column',
  label: '供应商',
  formItems: [{
    fieldKey: 'supplierId',
    type: 'component',
    component: {
      is: SupplierPickerAdapter,
      props: () => ({ disabled: mode.value === 'detail' })
    }
  }]
}]
```

这种方式适合弹窗或抽屉内即时切换，但详情仍会挂载业务组件和校验链路。自定义组件必须真正支持只读或禁用协议，不能只隐藏按钮却继续发出 model 事件。

## text 保留字段语义

`type: 'text'` 使用 `String(bindingValue ?? '')` 渲染 `span`。它不挂载输入组件，也不进入自动 model，但仍保留：

- `fieldKey` 和完整字段路径。
- FormItem、Hint、动态 `visible` 和 Item Slot。
- Column 内唯一 Row、Item 对应 Col 的 24 栅格布局。

因此 `text` 适合“仍按字段配置组织的只读内容”，不是无表单 DOM 的纯展示模式。

### 不需要 Item Label

Item 没有配置 Label 时本来就不会显示文字；从带 Label 的共享描述生成详情 Item 时，可以显式传空字符串覆盖：

```ts
const detailScoreItem: FormItemConfig = {
  key: 'score-field',
  fieldKey: 'score',
  type: 'text',
  formItemProps: {
    label: '',
    labelWidth: '0'
  }
}
```

`label: ''` 隐藏 Label；如果根 `formProps.labelWidth` 设置了统一宽度，再使用 `labelWidth: '0'` 避免内容仍保留左侧间距。这种写法只改变 Label 展示，不会移除 `el-form-item`。

详情 Item 通常还应移除编辑态 `rules`。不要直接展开整个编辑 Item 后只覆盖 `type`，否则可能遗留组件配置、监听器和校验规则。

### 一列存在多个字段

需要每个字段保持独立 Label、Hint 或栅格位置时，继续配置多个 `text` Item：

```ts
const detailColumn: ColumnConfig = {
  key: 'basic-detail',
  label: '基础信息',
  formItems: [
    {
      fieldKey: 'name',
      type: 'text',
      colProps: { span: 12 },
      formItemProps: { label: '姓名' }
    },
    {
      fieldKey: 'department',
      type: 'text',
      colProps: { span: 12 },
      formItemProps: { label: '部门' }
    }
  ]
}
```

如果多个字段只是组合成一个展示块，不需要各自的 Item 语义，则改用一个 `cellSlot`，避免创建多个 FormItem。

## 原生 Column 用于纯文本详情

一个表格列只显示一个行字段，而且列标题已经表达字段含义时，原生 Column 更轻量：

```ts
const detailNameColumn: ColumnConfig = {
  key: 'name-column',
  label: '姓名',
  props: {
    prop: 'name',
    minWidth: 160,
    showOverflowTooltip: true
  }
}
```

它不创建 Row、Col 和 FormItem。只需要普通字符串格式化时可以使用 Element Column `formatter`；需要 FormTable 字段 Hint、Item 动态配置或字段 Slot 上下文时，再选择 `text`。

## cellSlot 用于整格展示

状态翻译、Tag、头像、多个字段派生金额和操作区不对应单一字段组件，使用 `cellSlot`：

```ts
const amountColumn: ColumnConfig = {
  key: 'amount-column',
  label: '金额',
  cellSlot: 'amount-detail'
}
```

```vue
<template #amount-detail="{ row }">
  ¥ {{ formatMoney(row.quantity * row.unitPrice) }}
</template>
```

`cellSlot` 不提供 `fieldKey/value/propPath`，也不会自动应用 Item Hint 和 rules。公开配置中没有 `colSlot`；一个 Column 不能同时声明 `formItems` 和 `cellSlot`。

## 用配置工厂组合模式

列较多时，共享稳定业务描述，不要强行共享完整渲染结构：

```ts
const editColumns: ColumnConfig[] = [
  {
    key: 'name-column',
    label: '姓名',
    formItems: [{ fieldKey: 'name', type: 'input' }]
  },
  {
    key: 'amount-column',
    label: '金额',
    formItems: [{ fieldKey: 'amount', type: 'number' }]
  }
]

const detailColumns: ColumnConfig[] = [
  {
    key: 'name-column',
    label: '姓名',
    props: { prop: 'name' }
  },
  {
    key: 'amount-column',
    label: '金额',
    cellSlot: 'amount-detail'
  }
]

const columns = computed(() => (
  mode.value === 'edit' ? editColumns : detailColumns
))
```

两种模式保持相同的业务 `key`、标题和宽度即可。输入组件、rules、字段 Slot 和详情 `cellSlot` 分别留在对应配置中，避免大量条件属性组成难以收窄的混合对象。

## 模式切换与校验

替换 columns 后，在 `nextTick` 清理编辑模式遗留的错误展示：

```ts
watch(mode, async () => {
  await nextTick()
  formTableRef.value?.clearValidate()
})
```

- 原生 Column 和 `cellSlot` 不参与 FormItem 校验。
- `type: 'text'` 仍挂载 FormItem；详情配置应明确移除编辑态 rules。
- 提交前应切回编辑配置，或在数据层执行独立校验。
- 模式切换不应直接修改行数据，dirty 状态只反映真实业务值变化。

## 选择检查表

- 详情是否真的需要输入组件的只读样式。
- Item Label 是业务信息，还是已经由列标题表达。
- 是否需要字段 Hint、字段路径或多个 Item 的栅格布局。
- 展示值是原始值、普通 formatter，还是依赖多个字段的自定义结构。
- 详情 columns 是否清除了编辑组件、listeners 和 rules。
- 动态切换后是否清理旧校验状态，并保持稳定 Column key。
- 纯详情页面是否仍需要使用 FormTable，而不是普通 `el-table`。

## 相关文档

[权限与字段可编辑性](./permissions-and-editing.md) · [Element 功能列透传](./native-columns.md) · [`cellSlot` 列级单元格](./cell-slot.md) · [动态显隐与配置更新](./dynamic-configuration.md) · [校验、清理与重置](./validation-reset.md)
