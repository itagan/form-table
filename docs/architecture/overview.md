# 架构总览

FormTable 是 Vue 2.7 与 Element UI 2 之上的配置式表格表单。它不替代 Element Table、Element Form 或业务状态管理，而是把三者之间重复的布局、字段渲染、校验路径和受控更新协议集中起来。

## 职责边界

| 层级 | 负责内容 | 不负责内容 |
| --- | --- | --- |
| FormTable | 列与字段布局、组件解析、校验路径、不可变行更新、Hint 展示 | 行增删业务规则、接口请求、权限系统、远程代码执行 |
| Element UI | Table/Form/FormItem 和具体字段组件行为 | FormTable 的受控数据协议与业务字段映射 |
| 页面或 Store | `tableData/columns` 状态、行操作、异步流程、保存与审计 | 修改 FormTable 内部状态或注入 key |
| 业务组件与 Adapter | 稳定的组件协议、内部草稿、复杂交互 | 直接持有整张 FormTable 数据 |

这个边界决定了一个基本原则：字段值由 FormTable 帮助写回，数组结构和业务流程由调用方维护。

## 运行时结构

```text
FormTable
├─ el-form                         统一校验模型 { tableData }
│  └─ el-table                     使用受控 tableData
│     └─ FormTableColumn           归一化列渲染模式
│        ├─ Native Column          Element UI 原生列
│        ├─ cellSlot               整格自定义内容
│        └─ FormTableRow           字段布局列
│           └─ FormTableItem       字段上下文与校验
│              └─ FieldRenderer    函数式字段渲染器
└─ FormTableHintTooltip            tooltip 模式下整表单例
```

根组件是组合入口；列、字段上下文、受控更新和 Hint 分别由独立模块维护。公共类型只描述使用方可见协议，内部注入 key、Patch 工具和 Tooltip 状态不从包入口导出。

## 四条核心链路

| 链路 | 入口 | 结果 |
| --- | --- | --- |
| 渲染 | `columns` | 原生列、布局列或 `cellSlot` 列 |
| 字段 | `formItems[].type/component` | 内置组件、直接组件、字段 Slot 或高级自定义 Type |
| 数据 | `tableData` + 更新助手 | 新数组、目标新行、字段事件 |
| 校验 | `fieldKey` + 数据源下标 | `tableData.{index}.{fieldKey}` |

详细过程分别见[渲染架构](./rendering-pipeline.md)和[受控数据流](./controlled-data-flow.md)。

## 扩展层级

扩展应从成本最低、依赖最明显的方式开始：

```text
内置 Type
→ 直接组件
→ 字段 Slot / cellSlot
→ 配置工厂或 Adapter
→ 自定义 Type
→ 远程 Schema 与类型化注册
```

自定义 Type 位于高级扩展层。只有组件、model 和默认 Props 已经稳定，并且在多个字段或页面重复时，才值得注册成业务名称。完整决策见[扩展模型](./extension-model.md)。

## 架构约束

- 根数据始终受控，组件不直接修改传入的 `tableData`。
- `columns` 描述渲染配置，不承载异步请求或长期业务状态。
- `rowKey` 是稳定身份，不是可编辑业务字段。
- 动态回调保持同步、纯计算，异步行为进入 listener、Slot、Adapter 或页面函数。
- Element UI 原生能力优先通过透传和 Ref 使用，不在 FormTable 内重复包装。
- 不为远程 Schema 执行函数或组件代码；可信前端负责白名单增强。

## 阅读路径

| 目标 | 下一页 |
| --- | --- |
| 理解列和字段如何生成组件 | [渲染架构](./rendering-pipeline.md) |
| 理解更新、事件、异步与校验 | [受控数据流](./controlled-data-flow.md) |
| 理解独立 CSS、加载顺序和覆盖方式 | [样式加载与覆盖](./style-loading.md) |
| 选择组件、Slot、Adapter 或自定义 Type | [扩展模型](./extension-model.md) |
| 查询具体属性 | [API 总览](../api/configuration.md) |
| 直接解决开发任务 | [功能指南](../features/) |
