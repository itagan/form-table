# 自定义字段组件

> 可运行 Demo：[企业复杂组件接入 ↗](http://localhost:5173/enterprise-components)

Element UI 内置组件之外的日期范围、人员选择器、组织树和业务选择器，通过 `type: 'component'` 接入。FormTable 只适配数据绑定和事件上下文，不维护业务组件注册表。

## `is` 的两种推荐形式

页面直接引入的局部组件使用组件对象；已经由组件库插件或 `Vue.component` 注册的全局组件使用字符串名称：

```ts
import UserSelector from './UserSelector.vue'

component: { is: UserSelector }
component: { is: 'corp-user-selector' }
```

`is` 与 Vue 动态组件语义一致，字符串也可能被 Vue 解析为原生 HTML 标签。但 FormTable 的自动 model 面向 Vue 组件协议，原生表单节点应改用内置 `type` 或字段 Slot。具体限制见 [Component 配置](../api/component.md#is-目标与原生标签边界)。

## 标准 v-model

### 配置

```ts
import UserSelector from './UserSelector.vue'

const columns: ColumnConfig[] = [{
  label: '负责人',
  formItems: [{
    fieldKey: 'ownerId',
    type: 'component',
    formItemProps: {
      rules: [{ required: true, message: '请选择负责人' }]
    },
    component: {
      is: UserSelector,
      props: ({ row }) => ({
        departmentId: row.departmentId,
        clearable: true
      }),
      listeners: {
        change({ updateRow }, user) {
          updateRow({ ownerName: user?.name || '' })
        }
      }
    }
  }]
}]
```

### 页面使用

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  @field-change="handleFieldChange"
/>
```

省略 `component.model` 时按 Vue 2 组件的 v-model/model 选项绑定，包括组件自身声明的 `model.prop/model.event`。

## 非标准与非对称绑定协议

组件使用 `selectedId` 接收值并通过 `select-user` 发出整个用户对象时，可以声明适配协议：

```ts
component: {
  is: UserSelector,
  model: {
    prop: 'selectedId',
    event: 'select-user',
    valueFromEvent: user => user.id
  },
  listeners: {
    'select-user'({ updateRow }, user) {
      updateRow({ ownerName: user.name })
    }
  }
}
```

同一个事件同时承担 model 写回和业务 listener 时，FormTable 先更新 `ownerId`，再把 `ActionContext, user` 传给 listener。

如果行字段只保存 ID，但组件 model prop 需要完整用户对象，可以增加同步输入转换：

```ts
model: {
  prop: 'selectedUser',
  event: 'select-user',
  valueToProp: (ownerId, { row }) =>
    findUser(ownerId, row.departmentId) || null,
  valueFromEvent: user => user?.id || ''
}
```

`valueToProp` 不执行异步查询或副作用；需要请求数据、缓存状态或更新其他字段时，继续使用 Adapter 或 listener。

## 按行选择组件

同一字段在不同行使用不同组件时，使用同步 `resolveComponent`：

```ts
const editors = {
  venue: VenueDemandEditor,
  hotel: HotelDemandEditor,
  meal: MealDemandEditor
}

component: {
  is: DefaultDemandEditor,
  resolveComponent: ({ row }) => editors[row.type],
  props: ({ row }) => ({ readonly: row.locked })
}
```

解析器返回 `undefined` 时回退到静态 `is`。它应保持同步和无副作用，不在其中请求接口、修改数据或创建新的组件定义。

## 关闭自动绑定

纯展示或完全手动同步的组件使用 `model: false`：

```ts
component: {
  is: StatusDisplay,
  model: false,
  props: ({ value }) => ({ status: value })
}
```

如果仍需手动更新字段，可组合动态 props 和 listener：

```ts
component: {
  is: SkuSelector,
  model: false,
  props: ({ value }) => ({ selectedSkuId: value }),
  listeners: {
    'select-sku'({ setValue, updateRow }, sku) {
      setValue(sku.id)
      updateRow({ skuName: sku.name })
    }
  }
}
```

## 选择方式

| 需求 | 推荐方式 |
| --- | --- |
| 标准 Element UI 字段 | 内置 `type` |
| 自定义组件且绑定明确字段 | `type: 'component'` |
| 分组选项、自定义选项内容或复杂禁用逻辑 | [`type: 'slot'` 组合原生 Option](../api/component.md#复杂-option-接入) |
| 模板结构完全由页面控制，但仍需字段校验 | `type: 'slot'` 字段 Slot |
| 不对应单一字段的整格展示或操作 | [`columns[].cellSlot`](./cell-slot.md) |

更完整的组件 Mock、类型声明、columns 工厂和提交示例见[企业复杂组件接入示例](../examples/enterprise-components.md)。

同一种业务组件配置在多个页面重复时，优先提取配置工厂或 Adapter。何时继续保持业务封装、何时才值得评估组件预设或开放自定义 type，见[业务配置最佳实践](../guide/business-configuration-best-practices.md)。

## 相关 API

[Component 配置](../api/component.md) · [复杂 Option 接入](../api/component.md#复杂-option-接入) · [Slot 与上下文](../api/contexts.md)
