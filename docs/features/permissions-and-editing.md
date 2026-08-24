# 权限、只读与编辑模式

> 配套 Demo：[企业复杂组件接入 ↗](http://localhost:5173/enterprise-components) · [多需求费用明细 ↗](http://localhost:5173/heterogeneous-demands)

FormTable 不内置权限系统。页面或业务配置层根据当前用户、行状态和服务端策略决定 Column、Item、组件 Props 与操作 Slot；FormTable 只执行最终配置。

## 先区分四种业务语义

| 业务状态 | 推荐处理 | 数据与校验 |
| --- | --- | --- |
| 无查看权限 | Column / Item `visible: false` | 不挂载，也不参与当前表单校验 |
| 可查看但不可编辑 | `type: 'text'`、展示型 `cellSlot`，或组件 `readonly` | 数据保留；是否校验由页面策略决定 |
| 暂时不可操作 | 组件 `disabled: true` | 数据仍保留，Element 组件通常不触发交互 |
| 行已锁定或已审批 | 动态 Props 读取 `row.status` | 每行独立决定，不要隐藏整列 |

隐藏和禁用不是安全措施。提交 DTO 必须按服务端允许的字段构造，接口仍需重新鉴权并拒绝越权修改。

## 页面级编辑模式

页面在浏览和编辑之间切换时，可以把响应式状态下发给所有字段组件：

```ts
const editable = ref(false)

const columns: ColumnConfig[] = [{
  label: '商品',
  formItems: [{
    fieldKey: 'productName',
    type: 'input',
    component: {
      props: () => ({
        readonly: !editable.value
      })
    }
  }]
}]
```

对于 Select、日期选择器和上传等没有一致 `readonly` 语义的组件，通常使用 `disabled`。简单详情字段可以把 Item 切换为 `type: 'text'`；如果浏览态数据量较大，并且完全不需要 FormItem、校验和字段布局，再使用 `cellSlot` 接管整格。切换结构后在 `nextTick` 调用 `clearValidate()` 清理旧校验状态。

## 详情与编辑是否共用配置

详情不是只有“禁用组件”或“全部 cellSlot”两个选择。应按字段复杂度组合使用以下路径：

| 场景 | 推荐方式 | 代价 |
| --- | --- | --- |
| 页面内快速切换，布局和组件基本一致 | 复用 `formItems`，动态设置 `readonly/disabled` | 详情模式仍会创建组件、FormItem 和校验链路 |
| 简单字段直接显示原值 | 详情 Item 使用 `type: 'text'` | 保留 FormItem 和布局，但不挂载输入组件 |
| 一列包含多个简单字段 | 同一 Column 配置多个 `type: 'text'` Item | 通过 `colProps` 控制 24 栅格布局 |
| 标签、图片、派生值或不规则组合 | 详情 Column 使用 `cellSlot` | 不再拥有字段上下文和自动校验 |
| 只有少数复杂字段展示不同 | 大部分使用 `text`，个别列替换为 `cellSlot` | 配置工厂需要支持混合策略 |

公开配置中没有 `colSlot`；列级单元格入口名为 `cellSlot`。一个 Column 不能同时声明 `formItems` 和 `cellSlot`，模式切换时应替换完整 Column 配置。

### 复用组件配置

详情只是暂时禁止编辑，并且业务组件有清晰的只读展示时，可以继续复用同一份 columns：

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
      props: () => ({
        disabled: mode.value === 'detail'
      })
    }
  }]
}]
```

这种方式适合抽屉内“查看/编辑”即时切换，也能保留相同的组件格式和布局。自定义组件必须真正支持只读或禁用协议，不能只隐藏操作按钮但仍发出 model 事件。

### 简单详情使用 text

`type: 'text'` 直接把字段值渲染为 `span`，适合姓名、编号、数量等无需转换的详情内容。它仍处于 Item 字段链路内，因此保留 `fieldKey`、`formItemProps`、Hint 和栅格布局，但不会挂载输入组件。

一列存在多个详情字段时，不需要改用 `cellSlot`，继续配置多个 Item 即可：

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

`type: 'text'` 展示的是原始绑定值的字符串形式。枚举翻译、金额格式化、组合多个字段或插入图标时，使用字段 Slot 或 `cellSlot`，不要把复杂 formatter 塞进字段配置。

### 复杂详情使用 cellSlot

需要整格展示标签、头像、派生金额或完全不同的布局，并且不需要字段 Hint 和 Element Form 校验时，使用共享业务字段描述分别生成两套 Column：

```ts
const scoreColumnBase = {
  key: 'score-column',
  label: '评分',
  props: { minWidth: 180 }
}

const editScoreColumn: ColumnConfig = {
  ...scoreColumnBase,
  formItems: [{
    key: 'score-field',
    fieldKey: 'score',
    type: 'number'
  }]
}

const detailScoreColumn: ColumnConfig = {
  ...scoreColumnBase,
  cellSlot: 'score-detail'
}

const columns = computed(() => [
  mode.value === 'edit' ? editScoreColumn : detailScoreColumn
])
```

```vue
<template #score-detail="{ row }">
  <strong>{{ row.score }}</strong>
</template>
```

这里共享的是稳定 `key`、标题、宽度、业务字段定义和格式化函数，不强行共享渲染结构。编辑列拥有 `fieldKey`、model 和 rules；复杂详情列只读取 `row`，不会创建 FormItem。简单原值则优先使用上一节的 `type: 'text'`。

### 从业务字段描述生成两种模式

列较多时，可以把重复信息收敛为页面自己的字段描述，再由工厂映射到 FormTable 公开配置：

```ts
const fields = [
  {
    key: 'name',
    label: '姓名',
    editItem: { fieldKey: 'name', type: 'input' },
    detailItem: { fieldKey: 'name', type: 'text' }
  },
  {
    key: 'amount',
    label: '金额',
    editItem: { fieldKey: 'amount', type: 'number' },
    detailSlot: 'amount-detail'
  }
]

function createColumns(mode: 'detail' | 'edit'): ColumnConfig[] {
  return fields.map(field => {
    if (mode === 'edit') {
      return { key: field.key, label: field.label, formItems: [field.editItem] }
    }
    return field.detailItem
      ? { key: field.key, label: field.label, formItems: [field.detailItem] }
      : { key: field.key, label: field.label, cellSlot: field.detailSlot }
  })
}
```

字段描述属于页面或业务配置层，不需要扩展 FormTable API，也不要把 Vue VNode 或用户权限状态序列化到远程 Schema。工厂应明确区分直接文本与自定义展示，避免所有详情字段都绕到一个通用 Slot。

模式切换后应在 `nextTick` 调用 `clearValidate()`。`cellSlot` 详情列不参与 `validate()`；`type: 'text'` 仍会挂载 FormItem，因此详情配置通常应移除编辑态 rules。提交前必须切回编辑配置，或者在数据层执行独立校验。

## 行状态控制

已提交、审批中或被其他用户锁定的行，应从当前 `row` 计算组件状态：

```ts
component: {
  props: ({ row }) => ({
    disabled: row.status !== 'draft' || row.locked === true
  })
}
```

操作列使用同一业务判断，避免出现字段不可编辑但删除按钮仍可用的分裂状态：

```vue
<template #row-actions="{ row }">
  <el-button
    v-if="canDelete(row)"
    type="text"
    @click="removeRow(row)"
  >
    删除
  </el-button>
</template>
```

删除确认或接口等待跨越异步边界时，按稳定 `rowKey` 重新定位目标行，不使用旧下标。

## meta 保存静态权限标识

远程 Schema 或配置工厂可以使用 Item `meta` 保存静态权限名称：

```ts
{
  fieldKey: 'taxPrice',
  type: 'number',
  meta: {
    viewPermission: 'purchase:price:view',
    editPermission: 'purchase:price:edit'
  },
  visible: ({ itemConfig }) => hasPermission(
    String(itemConfig.meta?.viewPermission)
  ),
  component: {
    props: ({ row, itemConfig }) => ({
      disabled: row.locked || !hasPermission(
        String(itemConfig.meta?.editPermission)
      )
    })
  }
}
```

`meta` 只保存静态业务注解。FormTable 不解析权限名称，也不会把它自动传给组件。用户权限集合、当前组织和行锁状态仍来自页面或 Store；不要把随用户或行变化的数据复制进 `meta`。

## 动态隐藏与校验

Item 不可见时不会挂载对应 FormItem，因此当前 DOM 表单不会校验该字段。产品需要先明确：

- 隐藏字段是否仍应保留并提交。
- 字段再次出现时是否沿用原值。
- 服务端是否仍要求该字段。
- 切换权限或模式后是否需要清理旧错误展示。

如果隐藏字段必须满足提交规则，应在页面 DTO 校验或服务端校验中处理，不能依赖未挂载的 Element FormItem。

## 配置组织建议

小型页面可直接在动态 Props 中调用权限函数。多个页面共享相同策略时，使用配置工厂注入权限能力：

```ts
const columns = createPurchaseColumns({
  canView: permission => permissionStore.has(permission),
  canEditRow: row => row.status === 'draft' && !row.locked
})
```

工厂只组合配置，不保存登录用户或页面状态。技术协议兼容继续放在 Adapter，当前页面权限判断留在页面或业务 Store。

## 上线检查

- 无查看权限的数据是否同时避免出现在导出、日志和提交载荷中。
- `readonly`、`disabled` 和隐藏是否符合产品语义，而不是互相替代。
- 行状态与操作按钮是否使用同一套业务判断。
- 动态隐藏字段的服务端必填规则是否已明确。
- 权限切换或 columns 替换后是否清理了旧校验状态。
- 服务端是否独立完成字段级和操作级鉴权。

## 相关文档

[动态显隐与配置更新](./dynamic-configuration.md) · [`cellSlot` 列级单元格](./cell-slot.md) · [Slot 与上下文](../api/contexts.md) · [远程 Schema](./remote-schema.md) · [稳定身份](./stable-identity.md)
