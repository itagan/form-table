# 自定义字段组件

> 可运行 Demo：[企业复杂组件接入 ↗](http://localhost:5173/enterprise-components)

Element UI 内置组件之外的日期范围、人员选择器、组织树和业务选择器，通过 `type: 'component'` 接入。FormTable 只适配数据绑定和事件上下文，不维护业务组件注册表。

## 标准 v-model

### 配置

```ts
import UserSelector from './UserSelector.vue'

const columns: ColumnConfig[] = [{
  label: '负责人',
  children: [{
    children: [{
      fieldKey: 'ownerId',
      type: 'component',
      formItemProps: {
        rules: [{ required: true, message: '请选择负责人' }]
      },
      component: {
        renderer: UserSelector,
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

省略 `component.model` 时使用组件原生 Vue 2 v-model，包括组件自身声明的 `model.prop/model.event`。

## 非标准绑定协议

组件使用 `selectedId` 接收值并通过 `select-user` 发出整个用户对象时，可以声明适配协议：

```ts
component: {
  renderer: UserSelector,
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

## 按行选择组件

同一字段在不同行使用不同组件时，使用同步 `resolveRenderer`：

```ts
const editors = {
  venue: VenueDemandEditor,
  hotel: HotelDemandEditor,
  meal: MealDemandEditor
}

component: {
  renderer: DefaultDemandEditor,
  resolveRenderer: ({ row }) => editors[row.type],
  props: ({ row }) => ({ readonly: row.locked })
}
```

解析器返回 `undefined` 时回退到静态 `renderer`。它应保持同步和无副作用，不在其中请求接口、修改数据或创建新的组件定义。

## 关闭自动绑定

纯展示或完全手动同步的组件使用 `model: false`：

```ts
component: {
  renderer: StatusDisplay,
  model: false,
  props: ({ value }) => ({ status: value })
}
```

如果仍需手动更新字段，可组合动态 props 和 listener：

```ts
component: {
  renderer: SkuSelector,
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
| 模板结构完全由页面控制，但仍需字段校验 | `type: 'slot'` 字段 Slot |
| 不对应单一字段的整格展示或操作 | [`columns[].cellSlot`](./cell-slot.md) |

更完整的组件 Mock、类型声明、columns 工厂和提交示例见[企业复杂组件接入示例](../examples/enterprise-components.md)。

## 相关 API

[Component 配置](../api/component.md) · [Slot 与上下文](../api/contexts.md)
