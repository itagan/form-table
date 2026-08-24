# 权限、只读与编辑模式

> 配套 Demo：[企业复杂组件接入 ↗](http://localhost:5173/enterprise-components) · [多需求费用明细 ↗](http://localhost:5173/heterogeneous-demands)

FormTable 不内置权限系统。页面或业务配置层根据当前用户、行状态和服务端策略决定 Column、Item、组件 Props 与操作 Slot；FormTable 只执行最终配置。

## 先区分四种业务语义

| 业务状态 | 推荐处理 | 数据与校验 |
| --- | --- | --- |
| 无查看权限 | Column / Item `visible: false` | 不挂载，也不参与当前表单校验 |
| 可查看但不可编辑 | 文本 `cellSlot`，或组件 `readonly` | 数据保留；是否校验由页面策略决定 |
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

对于 Select、日期选择器和上传等没有一致 `readonly` 语义的组件，通常使用 `disabled`。如果浏览态数据量较大，并且不需要 FormItem、校验和编辑组件，可提供另一份稳定的只读 columns，使用 `cellSlot` 展示文本；切换结构后在 `nextTick` 调用 `clearValidate()` 清理旧校验状态。

## 详情与编辑是否共用配置

两种方式都合理，应根据详情页是否还需要字段组件来选择：

| 场景 | 推荐方式 | 代价 |
| --- | --- | --- |
| 页面内快速切换，布局和组件基本一致 | 复用 `formItems`，动态设置 `readonly/disabled` | 详情模式仍会创建组件、FormItem 和校验链路 |
| 独立详情页、数据量较大或展示结构不同 | 详情 Column 使用 `cellSlot`，编辑 Column 使用 `formItems` | 需要分别描述展示和编辑渲染 |
| 只有少数复杂字段展示不同 | 大部分复用组件，个别列按模式替换为 `cellSlot` | 配置工厂需要支持混合策略 |

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

### 详情使用 cellSlot

真正的详情页不需要输入组件、字段 Hint 或 Element Form 校验时，使用共享业务字段描述分别生成两套 Column：

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

这里共享的是稳定 `key`、标题、宽度、业务字段定义和格式化函数，不强行共享渲染结构。编辑列拥有 `fieldKey`、model 和 rules；详情列只读取 `row`，不会创建空的 FormItem。

### 从业务字段描述生成两种模式

列较多时，可以把重复信息收敛为页面自己的字段描述，再由工厂映射到 FormTable 公开配置：

```ts
const fields = [{
  key: 'amount',
  label: '金额',
  editItem: { fieldKey: 'amount', type: 'number' },
  format: row => `¥ ${row.amount.toFixed(2)}`
}]

function createColumns(mode: 'detail' | 'edit'): ColumnConfig[] {
  return fields.map(field => mode === 'edit'
    ? {
        key: field.key,
        label: field.label,
        formItems: [field.editItem]
      }
    : {
        key: field.key,
        label: field.label,
        cellSlot: 'detail-cell'
      })
}
```

通用 `detail-cell` Slot 可以通过 `columnConfig.key` 找到字段描述并调用对应 formatter。字段描述属于页面或业务配置层，不需要扩展 FormTable API，也不要把 Vue VNode 或用户权限状态序列化到远程 Schema。

模式切换后应在 `nextTick` 调用 `clearValidate()`。详情模式没有挂载的 FormItem 不参与 `validate()`；提交前必须切回编辑配置，或者在数据层执行独立校验。

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
