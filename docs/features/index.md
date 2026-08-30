# 功能专题

本页只提供专题目录，不重复具体规则。属性类型和完整路径以 [API 总览](../api/configuration.md) 为准，整体设计先看[架构总览](../architecture/overview.md)。

如果只知道当前页面任务，不确定属于哪个功能点，先看[开发任务导航](../guide/development-workflows.md)；已有代码出现渲染、更新或校验异常时，直接按[排错指南](../guide/troubleshooting.md)定位。

## 基础能力

这些页面只聚焦一个常见动作，适合在开发过程中直接查询。

| 功能点 | 配置入口 | 调用入口 | 结果 / 事件 |
| --- | --- | --- | --- |
| [数据更新与受控回写](./data-updates.md) | 根 `v-model`、`tableData`、`rowKey` | 自动绑定、`setValue`、`updateRow/updateRows` | 单行或原子多行 `update:tableData`、`field-change` |
| [校验、清理与重置](./validation-reset.md) | Item `formItemProps.rules`、`rowKey` | 整表或字段校验、聚焦、首错定位 | Element Form 校验与焦点状态 |
| [动态显隐与配置更新](./dynamic-configuration.md) | 各层 `visible`、动态 props | 替换 `columns` | 响应式布局与组件配置 |
| [详情与编辑模式](./detail-and-editing-modes.md) | 原生 Column、`text`、只读组件、`cellSlot` | 页面模式和配置工厂 | 空 Label、多 Item、混合详情与校验切换 |
| [权限与字段可编辑性](./permissions-and-editing.md) | `visible`、动态组件 Props、Item `meta`、操作 Slot | 页面或 Store 权限策略 | 隐藏、禁用、审批和行锁定边界 |
| [稳定身份与异步安全](./stable-identity.md) | `rowKey`、Column/Row/Item `key` | 异步 `setValue/updateRow` | 正确定位数据与渲染节点 |
| [Enter 字段导航](./keyboard-navigation.md) | 根 `navigationOptions` | Enter / Shift+Enter、字段 Ref | 当前挂载字段间前进、后退；[`Demo ↗`](http://localhost:5173/row-column-operations) |
| [样式定位与属性透传](./style-props.md) | `rowProps/colProps/formItemProps/component.props` | class、style、动态配置和 scoped CSS | 精确调整 Row、Col、FormItem 与字段组件 |
| [宽表横向滚动与字段定位](./horizontal-scroll.md) | `getTableRef()`、字段业务 class | 首列、末列和指定字段定位 | [`/horizontal-scroll`](http://localhost:5173/horizontal-scroll) |
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

扩展方式的选择顺序和升级条件统一见[扩展模型](../architecture/extension-model.md)。

## 业务组合

| 功能 | 配置入口 | 使用入口 | 可运行演示 |
| --- | --- | --- | --- |
| [完整编辑提交流程](../examples/form-workflow.md) | `tableData`、服务端快照、FormTable Ref | 加载、保存、撤销、dirty 和冲突状态 | [`/form-workflow`](http://localhost:5173/form-workflow) |
| [常见操作列与行增删](./common-row-actions.md) | `cellSlot`、`tableData`、`rowKey` | 末尾新增、后插、复制、删除 | [`/row-column-operations`](http://localhost:5173/row-column-operations) |
| [行列操作与异步提交](./row-column-operations.md) | `tableData`、`columns`、`rowKey` | 页面业务函数 | [`/row-column-operations`](http://localhost:5173/row-column-operations) |
| [分页与跨页编辑](./pagination-and-cross-page-editing.md) | 当前页 `tableData`、稳定 ID、业务 Store | 草稿、选择、校验和批量提交 | 页面或服务端分页器 |
| [多人编辑冲突与未保存离开](./concurrent-editing-and-navigation.md) | 服务端版本、页面快照、dirty | 冲突选择、路由和浏览器离开保护 | [`/form-workflow`](http://localhost:5173/form-workflow) |

## 性能

| 功能点 | 评估入口 | 落地入口 | 结果 |
| --- | --- | --- | --- |
| [性能与大数据量](./performance.md) | 行数、Item 数、渲染模式 | Performance Lab 可调实验 | 渲染、更新、DOM 与回调指标 |
| [性能优化建议](./performance-optimization.md) | 挂载规模、更新频率、校验范围 | 分页、按需编辑、批量回写 | 优化路径与虚拟滚动决策 |

专题页解决单项问题；需要连续教程、完整业务组合或属性定义时，分别进入[配置指南](../guide/configuration-guide.md)、[示例索引](../examples/)或 [API 总览](../api/configuration.md)。
