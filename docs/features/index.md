# 功能专题

功能专题按实际开发任务组织。每一页说明问题、推荐入口、业务写法、失败边界和可运行演示；属性类型和完整路径仍以 [API 总览](../api/configuration.md) 为准，整体设计先看[架构总览](../architecture/overview.md)。

如果只知道当前页面任务，不确定属于哪个功能点，先看[开发任务导航](../guide/development-workflows.md)；已有代码出现渲染、更新或校验异常时，直接按[排错指南](../guide/troubleshooting.md)定位。

## 基础能力

这些页面只聚焦一个常见动作，适合在开发过程中直接查询。

| 功能点 | 配置入口 | 调用入口 | 结果 / 事件 |
| --- | --- | --- | --- |
| [数据更新与受控回写](./data-updates.md) | 根 `v-model`、`tableData`、`rowKey` | 自动字段绑定、`setValue`、`updateRow` | `update:tableData`、`field-change` |
| [校验、清理与重置](./validation-reset.md) | Item `formItemProps.rules` | `validate/clearValidate/getFormRef` | Element Form 校验状态 |
| [动态显隐与配置更新](./dynamic-configuration.md) | 各层 `visible`、动态 props | 替换 `columns` | 响应式布局与组件配置 |
| [权限、只读与编辑模式](./permissions-and-editing.md) | `visible`、动态组件 Props、Item `meta`、操作 Slot | 页面或 Store 权限策略 | 隐藏、浏览、禁用和行锁定边界 |
| [稳定身份与异步安全](./stable-identity.md) | `rowKey`、Column/Row/Item `key` | 异步 `setValue/updateRow` | 正确定位数据与渲染节点 |
| [Element UI 能力边界与处理方案](./element-ui-boundaries.md) | `tableProps`、`formProps`、Column props | 排序筛选、树形数据、Form Ref 与 Slot | 透传边界和当前可用替代方案 |
| [Hint 提示体系](./hint.md) | `hintOptions`、`columns[].headerHint`、Item `hint` | 全局默认、字段覆盖、title/Tooltip 与自定义展示 | [`/hint-scenarios`](http://localhost:5173/hint-scenarios) |

## 常用扩展

| 功能 | 配置入口 | 使用入口 | 可运行演示 |
| --- | --- | --- | --- |
| [Element 功能列透传](./native-columns.md) | 纯 `columns[].props` | 列事件、`empty/append`、Element Column props | [`/element-columns`](http://localhost:5173/element-columns) |
| [自定义表头](./custom-header.md) | `columns[].headerSlot` | 父组件同名 scoped Slot | [`/hint-scenarios`](http://localhost:5173/hint-scenarios) |
| [`cellSlot` 列级单元格](./cell-slot.md) | `columns[].cellSlot` | 父组件同名 scoped Slot | [`/cell-slot`](http://localhost:5173/cell-slot) |
| [自定义字段组件](./custom-component.md) | Item `type: 'component'` | `component.is/model/props/listeners` | [`/enterprise-components`](http://localhost:5173/enterprise-components) |

这些入口适合单个页面或少量字段。只有组件协议已经跨页面稳定重复时，才升级到下方的自定义 Type。

## 高级扩展

| 功能 | 配置入口 | 使用前提 | 可运行演示 |
| --- | --- | --- | --- |
| [复合字段映射](./composite-binding.md) | Item `binding.map` | 一个组件值稳定映射多个行字段 | [`/composite-binding`](http://localhost:5173/composite-binding) |
| [自定义字段 Type](./custom-field-types.md) | 根 `fieldTypes` + Item `type` | 组件、model、默认 Props 已跨页面稳定重复 | [`/custom-field-types`](http://localhost:5173/custom-field-types) |
| [远程 Schema 与本地增强](./remote-schema.md) | 可序列化 `ColumnConfig[]` | 已建立版本、结构和业务 Type 白名单 | [`/remote-schema`](http://localhost:5173/remote-schema) |

推荐演进顺序是：内置 Type → 直接组件 → Slot → 配置工厂或 Adapter → 自定义 Type → 远程 Schema。选择依据见[扩展模型](../architecture/extension-model.md)。

## 业务组合

| 功能 | 配置入口 | 使用入口 | 可运行演示 |
| --- | --- | --- | --- |
| [完整编辑提交流程](../examples/form-workflow.md) | `tableData`、服务端快照、FormTable Ref | 加载、保存、撤销和 dirty 状态 | [`/form-workflow`](http://localhost:5173/form-workflow) |
| [常见操作列与行增删](./common-row-actions.md) | `cellSlot`、`tableData`、`rowKey` | 末尾新增、后插、复制、删除 | [`/row-column-operations`](http://localhost:5173/row-column-operations) |
| [行列操作与异步提交](./row-column-operations.md) | `tableData`、`columns`、`rowKey` | 页面业务函数 | [`/row-column-operations`](http://localhost:5173/row-column-operations) |

## 性能

| 功能点 | 评估入口 | 落地入口 | 结果 |
| --- | --- | --- | --- |
| [性能与大数据量](./performance.md) | 行数、Item 数、渲染模式 | Performance Lab 可调实验 | 渲染、更新、DOM 与回调指标 |
| [性能优化建议](./performance-optimization.md) | 挂载规模、更新频率、校验范围 | 分页、按需编辑、批量回写 | 优化路径与虚拟滚动决策 |

## 文档分层

- **API 参考**：回答属性的完整路径、类型和上下文。
- **架构说明**：回答能力为什么这样分层、数据和渲染如何流动。
- **功能专题**：回答一项开发任务如何配置、如何在页面中使用。
- **业务示例**：回答多项能力如何组合完成具体业务。
- **完整配置指南**：适合希望连续理解全部设计的读者。

功能专题不会重复列出完整 API。示例中出现的属性可以通过首列完整路径返回对应 API 页查询。
