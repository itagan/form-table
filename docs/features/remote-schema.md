# 远程 Schema 与本地增强

> 可运行 Demo：[远程 JSON + 本地增强 ↗](http://localhost:5173/remote-schema)

服务端适合返回可序列化的布局和静态组件配置；Vue 组件对象、事件函数与可信 Slot 实现应留在前端代码中。本功能不要求 FormTable 内置业务组件注册表。

## 远程配置示例

```json
[
  {
    "key": "contact-column",
    "label": "联系人",
    "props": { "minWidth": 480 },
    "children": [
      {
        "children": [
          {
            "fieldKey": "name",
            "type": "input",
            "component": {
              "props": { "placeholder": "请输入姓名" }
            }
          },
          {
            "fieldKey": "phone",
            "type": "input",
            "component": {
              "props": { "placeholder": "请输入手机号" }
            }
          }
        ]
      }
    ]
  }
]
```

远程配置可以包含：

- Column / Row / Item 布局和稳定 key。
- 内置 `type`、静态 props、options、optionProps。
- 由前端约定并实现的 Slot 名称。

不应包含可执行函数字符串、Vue 组件对象或服务端下发的任意 HTML。

## 本地增强示例

页面按稳定业务标识把远程占位字段替换为本地可信组件和事件：

```ts
import PhoneInput from './PhoneInput.vue'

const columns = enhanceFormTableColumns(remoteColumns, {
  phone(item) {
    const { type: _fallback, component: remoteComponent, ...layout } = item

    return {
      ...layout,
      type: 'component',
      component: {
        renderer: PhoneInput,
        props: remoteComponent?.props,
        listeners: {
          change(context, value) {
            context.updateRow({
              [context.fieldKey]: value,
              phoneTouched: true
            })
          }
        }
      }
    }
  }
})
```

一个最小的递归增强函数可以放在业务项目中：

```ts
function enhanceFormTableColumns(columns, enhancements) {
  return columns.map(column => Array.isArray(column.children)
    ? {
        ...column,
        children: column.children.map(row => ({
          ...row,
          children: row.children.map(item =>
            enhancements[item.fieldKey]?.(item) || item
          )
        }))
      }
    : column
  )
}
```

实际项目可以使用独立的 `componentKey` 或 `featureKey`，不必把 `fieldKey` 同时当作组件注册标识。

## 页面使用

增强结果仍是普通 `ColumnConfig[]`：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :table-props="{ border: true }"
>
  <template #actions="{ row, updateRow }">
    <el-button @click="updateRow({ enabled: !row.enabled })">
      {{ row.enabled ? '停用' : '启用' }}
    </el-button>
  </template>
</FormTable>
```

## 职责边界

| 层级 | 负责内容 |
| --- | --- |
| 服务端 | 布局、字段标识、内置 type、静态 props/options、版本号 |
| 页面或业务适配层 | 组件映射、事件函数、Slot 实现、权限和数据联动 |
| FormTable | 渲染增强后的 columns、字段绑定、上下文和受控回写 |

远程 Schema 应做版本和结构校验。TypeScript 的 `as ColumnConfig[]` 只影响编译期，不能替代运行时校验；来自不可信来源的配置应先经过白名单解析。字段路径还应明确拒绝 `__proto__`、`prototype` 和 `constructor` 片段；FormTable 核心也会在读取或写入这些路径时立即抛错，作为最后一道安全边界。

## 相关 API

[API 总览](../api/configuration.md) · [Component 配置](../api/component.md)
