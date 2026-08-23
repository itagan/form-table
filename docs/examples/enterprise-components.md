# 企业复杂组件接入

> 可运行 Demo：[打开企业复杂组件接入页 ↗](http://localhost:5173/enterprise-components)

本示例以采购明细为场景，说明全局公司组件、页面局部组件、非标准 model、复杂事件和纯展示组件如何在同一张 FormTable 中协作。完整可运行实现位于 `playground/src/views/EnterpriseComponentsView.vue`，本文只保留接入决策和关键代码，避免复制整份源码后产生漂移。

## 组件接入清单

| 字段 | 组件来源 | 推荐接入方式 |
| --- | --- | --- |
| 物料 | 页面局部业务组件 | `model: false` + props/listeners 批量写回 |
| 采购组织 | 公司组件库全局注册 | 字符串 `is` + 自定义 model |
| 供应商 | 公司组件库全局注册 | 字符串 `is` + 复杂事件载荷 |
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

## 什么时候升级为自定义 Type

只有组件目标、model 和默认 Props 已经跨页面稳定重复，并且业务希望在 columns 中直接表达 `type: 'employee'` 等语义时，才使用实例级自定义 Type。

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
- 是否真的跨页面稳定后才注册自定义 Type。

相关说明：[自定义字段组件](../features/custom-component.md) · [复合字段映射](../features/composite-binding.md) · [开发任务导航](../guide/development-workflows.md) · [排错指南](../guide/troubleshooting.md)
