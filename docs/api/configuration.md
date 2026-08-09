# API 总览

API 参考按配置对象拆分，表格首列始终使用完整属性路径。数组层级使用 `[]`，对象属性使用 `.`，例如：

```text
columns[].children[].children[].component.props
```

## 配置树

```text
FormTable
├─ tableData
├─ formProps
├─ tableProps
├─ loading
└─ columns[]
   ├─ key / label / visible / props
   ├─ headerSlot / headerProps / headerHint
   ├─ cellSlot
   └─ children[]                         RowConfig
      ├─ key / visible / props
      └─ children[]                      FormItemConfig
         ├─ key / fieldKey / visible / type
         ├─ colProps / formItemProps / hint
         └─ component
            ├─ renderer / resolveRenderer
            ├─ model
            │  ├─ prop
            │  ├─ event
            │  └─ valueFromEvent
            ├─ props / listeners / options
            └─ optionProps
               ├─ label / value
               └─ disabled / key
```

`columns[].cellSlot` 与 `columns[].children[]` 是两条互斥的单元格渲染路径。前者直接渲染列级 Slot，后者进入 Row → Item → Component 的字段链路。

根组件 `v-model` 对应 `tableData/update:tableData`，不改变配置树结构。基础用法见 [FormTable Props](./form-table.md)。

## 参考页

| 参考页 | 主要路径 | 内容 |
| --- | --- | --- |
| [FormTable Props](./form-table.md) | `tableData`、`columns`、`formProps`、`tableProps` | 顶层 props、受控数据和 Element UI 透传 |
| [Column / Row / Item](./columns.md) | `columns[]...` | 列、布局行、字段路径、校验和提示 |
| [Component 配置](./component.md) | `columns[].children[].children[].component...` | 渲染器、model、props、listeners 和 options |
| [Slot 与上下文](./contexts.md) | 动态回调和 scoped Slot | 上下文矩阵、快照语义和更新能力 |
| [事件与 Ref](./events-and-ref.md) | `update:tableData`、`field-change`、Ref | 受控回写、原生事件和实例方法 |
| [公开类型](./types.md) | 包入口导出 | TypeScript 联合类型和公开接口 |

## 功能专题

高频单一能力可直接查询：[数据更新](../features/data-updates.md)、[校验与重置](../features/validation-reset.md)、[动态配置](../features/dynamic-configuration.md)、[稳定身份](../features/stable-identity.md)。

大数据量边界、测量方式和优化建议见[性能与大数据量](../features/performance.md)，可运行实验位于 [`/performance`](http://localhost:5173/performance)。

| 功能 | 文档 | 可运行演示 |
| --- | --- | --- |
| 原生 title 提示 | [配置与使用](../features/native-title.md) | [`/form-table`](http://localhost:5173/form-table) |
| 自定义表头 | [配置与使用](../features/custom-header.md) | [`/form-table-advanced`](http://localhost:5173/form-table-advanced) |
| 列级单元格 Slot | [`cellSlot` 专题](../features/cell-slot.md) | [`/cell-slot`](http://localhost:5173/cell-slot) |
| 自定义字段组件 | [配置与使用](../features/custom-component.md) | [`/enterprise-components`](http://localhost:5173/enterprise-components) |
| 远程 Schema | [配置与本地增强](../features/remote-schema.md) | [`/remote-schema`](http://localhost:5173/remote-schema) |
| 行列动态操作 | [行、列与延迟提交](../guide/row-column-operations.md) | [`/row-column-operations`](http://localhost:5173/row-column-operations) |
| 企业自定义组件 | [复杂组件接入](../examples/enterprise-components.md) | [`/enterprise-components`](http://localhost:5173/enterprise-components) |
| 单元格合并 | [合并业务处理](../examples/cell-merge.md) | [`/cell-merge`](http://localhost:5173/cell-merge) |

## 连续阅读

希望从布局到动态组件按顺序阅读时，参考 [完整配置指南](../guide/configuration-guide.md)。API 参考与配置指南分工如下：

- API 参考：快速确认属性路径、类型、默认值和回调上下文。
- 完整配置指南：解释不同模式如何组合、为什么这样配置。

所有独立能力及其配置、使用和演示入口见[功能专题索引](../features/index.md)。
