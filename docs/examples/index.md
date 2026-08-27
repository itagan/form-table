# 示例索引

示例按学习成本和开发任务分类，不再把基础接入、高级协议和完整业务场景平铺在同一层。第一次使用请从基础编辑开始；自定义 Type、远程 Schema 和复合绑定属于高级扩展。

## 运行方式

```bash
pnpm site:dev
```

- Playground：[打开本地示例中心 ↗](http://localhost:5173/)
- 文档站：`http://localhost:5174`

Playground 直接引用组件源码。示例名称、路由、分类、难度、关联文档和源文件统一维护在 `playground/examples.json`；生产构建会把 Playground 合并到文档站的 `/playground/` 路径。

## 基础使用

| Demo | 难度 | 解决的问题 |
| --- | --- | --- |
| [基础编辑 ↗](http://localhost:5173/form-table) | 基础 | `formItems`、内置 Type、校验和受控数据 |
| [Element 功能列透传 ↗](http://localhost:5173/element-columns) | 基础 | selection、index、expand、排序筛选事件及根级 Slot |

完成这两页后，应能够建立普通表格表单并使用 Element Table 原生能力。

## 常用渲染扩展

| Demo | 难度 | 解决的问题 |
| --- | --- | --- |
| [Hint 多场景 ↗](http://localhost:5173/hint-scenarios) | 进阶 | title、单实例 Tooltip、表头和 FormItem Slot |
| [`cellSlot` 列级单元格 ↗](http://localhost:5173/cell-slot) | 进阶 | 多字段 text 详情、状态与派生值，以及详情/编辑渲染切换 |
| [字段 Slot 与动态显隐 ↗](http://localhost:5173/dynamic-slot-test) | 进阶 | 字段 Slot、更新助手和多层动态配置 |

需要组合多个渲染入口时，先按[扩展模型](../architecture/extension-model.md)选择最小方案，再组合对应的独立示例。
浏览态需要在原生 Column、空 Label `text` 和 `cellSlot` 之间选择时，直接查看[详情与编辑模式](../features/detail-and-editing-modes.md)。

## 高级扩展

| Demo | 使用前提 | 解决的问题 |
| --- | --- | --- |
| [复合字段映射 ↗](http://localhost:5173/composite-binding) | 一个组件稳定映射多个字段 | 对象、数组、fallback 和原子写回 |
| [企业复杂组件接入 ↗](http://localhost:5173/enterprise-components) | 已有非标准业务组件协议 | Adapter、自定义 model、事件联动和手动同步 |
| [实例级自定义字段 Type ↗](http://localhost:5173/custom-field-types) | 组件协议已跨页面稳定重复 | 注册名称、精确类型、默认 Props 和诊断 |
| [远程 Schema ↗](http://localhost:5173/remote-schema) | 已建立结构校验和可信白名单 | 纯 JSON 配置与本地组件、函数、Slot 增强 |

推荐顺序是先直接组件或 Adapter，再考虑自定义 Type；不要为了单个页面减少配置行数就建立注册协议。

## 业务场景

| Demo | 难度 | 业务重点 |
| --- | --- | --- |
| [完整编辑提交流程 ↗](http://localhost:5173/form-workflow) | 进阶 | 加载保存、异常重试、字段错误、版本冲突和未保存离开 |
| [行列操作与异步提交 ↗](http://localhost:5173/row-column-operations) | 进阶 | 行增删复制移动、批量选择、动态列和成功后提交 |
| [多需求共享固定操作列 ↗](http://localhost:5173/shared-operation-column) | 进阶 | 勾选需求循环渲染、共享列配置、固定操作列和跨表数据隔离 |
| [单元格合并 ↗](http://localhost:5173/cell-merge) | 高级 | 纵横合并、稳定列定位、共享字段和校验 |
| [多需求费用明细 ↗](http://localhost:5173/heterogeneous-demands) | 高级 | 异构组件、差异数据和提交归一化 |
| [多日议程编排 ↗](http://localhost:5173/itinerary-simple) | 高级 | 分组字段、拖拽、行操作和分组提交 |

业务示例用于展示多项能力的组合方式，不替代 API 参考。复制代码前应先确认自己的行身份、校验和提交边界。

## 工程验证

| 工具 | 用途 |
| --- | --- |
| [大数据量性能实验 ↗](http://localhost:5173/performance) | 对比展示、编辑和动态配置的渲染及更新指标 |

性能实验应在 production build 和固定环境中重复测量；单次开发模式耗时不是容量结论。

## 选择下一步

- 普通字段与校验：[快速开始](../guide/quick-start.md)
- 接口加载、保存和撤销：[完整编辑提交流程](./form-workflow.md)
- 不确定使用组件还是 Slot：[扩展模型](../architecture/extension-model.md)
- 行增删与异步流程：[行列操作与异步提交](../features/row-column-operations.md)
- 企业组件协议：[企业复杂组件接入](./enterprise-components.md)
- 性能问题：[性能优化建议](../features/performance-optimization.md)
- 行为异常：[排错指南](../guide/troubleshooting.md)
- 业务配置测试：[业务配置测试指南](../guide/business-testing.md)
