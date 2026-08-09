# 功能专题

功能专题用于说明可以独立采用的能力。每一页都包含最小配置、页面使用方式、适用边界和可运行演示；按属性路径查询时仍以 [API 总览](../api/configuration.md) 为准。

## 基础能力

这些页面只聚焦一个常见动作，适合在开发过程中直接查询。

| 功能点 | 配置入口 | 调用入口 | 结果 / 事件 |
| --- | --- | --- | --- |
| [数据更新与受控回写](./data-updates.md) | 根 `v-model`、`tableData`、`rowKey` | 自动字段绑定、`setValue`、`updateRow` | `update:tableData`、`field-change` |
| [校验、清理与重置](./validation-reset.md) | Item `formItemProps.rules` | `validate/clearValidate/resetFields` | Element Form 校验状态 |
| [动态显隐与配置更新](./dynamic-configuration.md) | 各层 `visible`、动态 props | 替换 `columns` | 响应式布局与组件配置 |
| [稳定身份与异步安全](./stable-identity.md) | `rowKey`、Column/Row/Item `key` | 异步 `setValue/updateRow` | 正确定位数据与渲染节点 |
| [原生 title 提示](./native-title.md) | `columns[].headerHint`、Item `hint` | 默认表头与字段外层自动应用 | 浏览器原生提示 |

## 渲染扩展

| 功能 | 配置入口 | 使用入口 | 可运行演示 |
| --- | --- | --- | --- |
| [自定义表头](./custom-header.md) | `columns[].headerSlot` | 父组件同名 scoped Slot | [`/form-table-advanced`](http://localhost:5173/form-table-advanced) |
| [`cellSlot` 列级单元格](./cell-slot.md) | `columns[].cellSlot` | 父组件同名 scoped Slot | [`/cell-slot`](http://localhost:5173/cell-slot) |
| [自定义字段组件](./custom-component.md) | Item `type: 'component'` | `component.renderer/model/props/listeners` | [`/enterprise-components`](http://localhost:5173/enterprise-components) |

## 配置来源与业务组合

| 功能 | 配置入口 | 使用入口 | 可运行演示 |
| --- | --- | --- | --- |
| [远程 Schema 与本地增强](./remote-schema.md) | 可序列化 `ColumnConfig[]` | 页面增强组件、事件和 Slot | [`/remote-schema`](http://localhost:5173/remote-schema) |
| [行列操作与异步提交](../guide/row-column-operations.md) | `tableData`、`columns`、`tableProps.rowKey` | 页面业务函数 | [`/row-column-operations`](http://localhost:5173/row-column-operations) |

## 文档分层

- **API 参考**：回答属性的完整路径、类型和上下文。
- **功能专题**：回答一项能力如何配置、如何在页面中使用。
- **业务示例**：回答多项能力如何组合完成具体业务。
- **完整配置指南**：适合希望连续理解全部设计的读者。

功能专题不会重复列出完整 API。示例中出现的属性可以通过首列完整路径返回对应 API 页查询。
