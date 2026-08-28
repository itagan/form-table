# 企业复杂组件接入

> 可运行 Demo：[打开企业复杂组件接入页 ↗](http://localhost:5173/enterprise-components)

本示例以采购明细为场景，说明全局公司组件、页面局部组件、非标准 model、复杂事件和纯展示组件如何在同一张 FormTable 中协作。完整可运行实现位于 `playground/src/views/EnterpriseComponentsView.vue`，本文只保留接入决策和关键代码，避免复制整份源码后产生漂移。

## 组件接入清单

| 字段 | 组件来源 | 推荐接入方式 |
| --- | --- | --- |
| 物料 | 页面局部业务组件 | `model: false` + props/listeners 批量写回 |
| 采购组织 | 公司组件库全局注册 | 字符串 `is` + 自定义 model |
| 供应商 | 历史公司组件 + 页面 Adapter | 标准 model + listener + `meta` |
| 数量 | Element UI 内置组件 | 内置 Type，使用默认 model |
| 含税单价 | 页面局部业务组件 | 组件对象 + 自定义 model |
| 附件 | 页面局部业务组件 | 文件列表 model + 动态 props |
| 审批状态 | 公司全局展示组件 | `model: false` |
| 操作 | 页面模板 | `cellSlot` |

FormTable 不导入公司组件，也不维护公司级注册中心。全局组件由宿主应用注册，局部组件直接传组件对象。

## 全局组件与局部组件

公司组件库通过插件注册一次：

```ts
import Vue from 'vue'
import CorpComponentLibrary from '@company/component-library'

Vue.use(CorpComponentLibrary)
```

配置中可以使用全局名称：

```ts
component: {
  is: 'corp-org-selector'
}
```

只在当前页面使用的组件直接导入：

```ts
import MoneyInput from '@/components/MoneyInput.vue'

const item = {
  fieldKey: 'taxPrice',
  type: 'component',
  component: { is: MoneyInput }
}
```

不要把文件路径字符串传给 `is`。字符串只用于原生标签或已经注册到当前 Vue 构造器的组件名称。

## 四种 model 协议

### 标准 Vue 2 model

组件使用 `value/input` 或正确声明自身 `model` 时，无需重复配置：

```ts
{
  fieldKey: 'quantity',
  type: 'number',
  component: { props: { min: 1 } }
}
```

### 非标准 prop 和事件

金额组件使用 `amount/amount-change`，并从复杂事件载荷提取数值：

```ts
{
  fieldKey: 'taxPrice',
  type: 'component',
  component: {
    is: MoneyInput,
    model: {
      prop: 'amount',
      event: 'amount-change',
      valueFromEvent: (_context, ...args) =>
        (args[0] as { amount: number }).amount
    }
  }
}
```

model 事件会先写回当前字段，再调用 Item 中的同名 listener；listener 仍能获得完整原始事件参数。

### 完全关闭自动 model

纯展示组件只接收当前行状态：

```ts
{
  fieldKey: 'approvalStatus',
  type: 'component',
  component: {
    is: 'biz-approval-status',
    model: false,
    props: ({ row }) => ({ status: row.approvalStatus })
  }
}
```

`model: false` 也适合命令型组件，事件由 listener 处理，但组件不会自动接收或写回字段值。

### 手动同步多个关联字段

物料选择器接收当前主字段，选择后一次写回物料名称、规格、单位和税率：

```ts
{
  fieldKey: 'skuId',
  type: 'component',
  component: {
    is: BusinessSkuSelector,
    model: false,
    props: ({ value, row }) => ({
      selectedSkuId: value,
      disabled: row.locked
    }),
    listeners: {
      'select-sku'({ updateRow }, selected) {
        const sku = selected as SkuSelection
        updateRow({
          skuId: sku.id,
          skuName: sku.name,
          specification: sku.specification,
          unit: sku.unit,
          taxRate: sku.taxRate
        })
      }
    }
  }
}
```

一个事件改变多个当前行字段时，使用单个 `updateRow`，避免产生多次数组更新和中间状态。

## 动态业务属性

动态 props 可以读取当前字段上下文，用于权限、行状态和关联字段：

```ts
props: ({ row }) => ({
  disabled: !editable.value || row.locked,
  organizationCode: row.orgCode,
  maxCount: row.attachmentLimit
})
```

动态回调应保持同步和纯计算。搜索请求、上传状态和弹窗草稿由业务组件自己维护，不要在 props 回调中发起请求。

## 级联字段与异步搜索

采购组织是供应商的上游条件。组织改变时，示例在同一个 listener 中清理已经失效的供应商字段：

```ts
listeners: {
  'node-select'({ updateRow }, organization) {
    updateRow({
      orgName: organization?.name || '',
      supplierId: '',
      supplierName: '',
      supplierSource: undefined
    })
  }
}
```

使用一次 `updateRow` 可以避免页面短暂出现“新组织 + 旧供应商”的中间状态。需要联动清理校验展示时，在父页面收到变化后重新计算当前字段路径，调用 `validateField` 或 `clearValidate`；不要缓存包含旧数组下标的路径。

真实供应商组件通常包含远程搜索。请求、防抖、缓存、加载状态和取消逻辑应封装在业务组件或 Adapter 中，并遵守以下规则：

- 每次请求记录搜索词、上游组织和请求序号。
- 响应返回时确认请求仍是最新一次，且当前组织没有变化。
- 组件卸载、组织变化或新搜索开始时取消旧请求，或至少忽略旧响应。
- listener 只接收最终确认的供应商，不管理输入过程中的候选列表。
- 异步确认后更新行时配置稳定 `rowKey`，目标行已删除则停止写回。

`meta` 可以保存 `businessRole`、埋点名等静态注解，不保存当前组织、搜索词、请求序号或 loading；这些值会变化，应留在 `row`、组件或页面状态中。

## 用 meta 标注字段的业务身份

`meta` 适合保存不参与渲染协议的静态业务注解，例如业务角色、权限标识、埋点事件或远程 Schema ID。企业示例的供应商字段同时声明 Adapter、listener 和 `meta`：

```ts
{
  fieldKey: 'supplierId',
  type: 'component',
  meta: {
    businessRole: 'purchase-supplier',
    analyticsEvent: 'purchase_supplier_changed'
  },
  component: {
    is: SupplierPickerAdapter,
    props: ({ row }) => ({ orgCode: row.orgCode }),
    listeners: {
      'supplier-change'({ updateRow, itemConfig }, supplier, source) {
        updateRow({
          supplierName: supplier?.name || '',
          supplierSource: source
        })

        track(String(itemConfig.meta?.analyticsEvent), {
          role: itemConfig.meta?.businessRole,
          supplierId: supplier?.id
        })
      }
    }
  }
}
```

FormTable 原样保留 `meta`，但不会解析它，也不会自动传给实际组件。动态 Props、listener 和字段 Slot 都通过 `itemConfig.meta` 读取。`meta` 不是行数据：需要随行变化的值继续放在 `row` 中；需要传给组件的值仍应在 `component.props` 中明确映射。

## 页面如何组织配置

完整采购页面把职责拆成三层：

```text
页面
├─ tableData、editable、loading、saving
├─ 行增删复制和接口流程
└─ FormTable 与业务 Slot

columns 配置
├─ 字段布局与校验
├─ 组件协议和同步动态 props
└─ 当前行字段联动

业务组件 / Adapter
├─ 搜索、弹窗和内部草稿
├─ 历史协议兼容
└─ 标准化输出事件
```

columns 不应在模板内联创建。页面较小时可以声明为稳定常量；需要接收权限或回调时使用配置工厂：

```ts
const columns = createPurchaseColumns({
  canEdit: () => editable.value,
  onOpenAttachment: file => openAttachment(file)
})
```

工厂负责依赖注入，不负责保存页面状态。

## 什么时候封装 Adapter

出现以下情况时，不要继续扩大 `component.model` 和 listeners：

- 组件内部有异步草稿或确认/取消状态。
- 多个原始事件可能竞争写回同一值。
- 同一公司组件在不同版本中使用不同 Prop 名称。
- 事件载荷需要多步防御性转换。
- 多个页面都要重复相同技术兼容代码。

Adapter 把底层组件统一成标准 Vue 2 model，再由 FormTable 按普通直接组件接入。页面 listener 只保留当前业务联动。

可运行示例中的 `SupplierPickerAdapter.vue` 将历史组件的 `supplierId/supplier-change` 协议转换为 `value/input`，同时透传完整的 `supplier-change` 事件：

```vue
<template>
  <CompanySupplierPicker
    :supplier-id="value"
    :org-code="orgCode"
    @supplier-change="handleSupplierChange"
  />
</template>

<script lang="ts" setup>
const handleSupplierChange = (supplier, source) => {
  emit('input', supplier?.id || '')
  emit('supplier-change', supplier, source)
}
</script>
```

因此 columns 不再了解底层 Prop 名称，也不需要声明自定义 model；同名 listener 只负责供应商名称、来源和税率等当前页面联动。

## 什么时候升级为自定义 Type

只有组件目标、model 和默认 Props 已经跨页面稳定重复，并且业务希望在 columns 中直接表达 `type: 'hr-employee'` 等语义时，才使用实例级自定义 Type。注册名称推荐使用公司、部门或业务域前缀，完整规则见[自定义字段 Type：推荐命名规范](../features/custom-field-types.md#推荐命名规范)。

一次性组件继续使用 `type: 'component'`；协议复杂但仍可能变化时继续使用 Adapter。完整判断见[扩展模型](../architecture/extension-model.md)。

## 可运行 Mock 的作用

Playground 中的企业组件 Mock 覆盖组织级联、供应商联动、物料选择、非标准金额事件、附件限制和审批状态展示。它们只模拟协议，不代表 FormTable 内置这些业务能力。

实际项目应保持 columns 的接入边界，将 Mock 的 `is` 替换为公司组件库或业务模块组件，并在页面层接入真实接口与权限。

## 检查清单

- 组件来源是全局名称还是局部对象，是否清晰可追踪。
- model 的 prop/event 与组件真实协议一致。
- `valueFromEvent` 是否覆盖空值和复杂载荷。
- 多字段联动是否合并为单个 `updateRow`。
- 纯展示组件是否明确设置 `model: false`。
- 动态 props 是否为同步纯计算。
- 异步状态是否留在业务组件、Adapter 或页面。
- `meta` 是否只保存静态业务注解，并通过 `itemConfig.meta` 显式读取。
- 是否真的跨页面稳定后才注册自定义 Type。

相关说明：[自定义字段组件](../features/custom-component.md) · [Slot 与上下文](../api/contexts.md) · [复合字段映射](../features/composite-binding.md) · [开发任务导航](../guide/development-workflows.md) · [排错指南](../guide/troubleshooting.md)
