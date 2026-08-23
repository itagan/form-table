# 扩展模型

FormTable 提供多种渲染入口，但它们不是同一复杂度等级。实际开发应先选择依赖最清晰、运行时协议最少的方式。

## 决策顺序

```text
Element UI 标准字段？
├─ 是 → 内置 Type
└─ 否
   ├─ 单个 Vue 组件即可完成？ → 直接 component
   ├─ 需要自定义模板但仍是一个字段？ → 字段 Slot
   ├─ 不需要字段和校验语义？ → cellSlot
   ├─ 历史协议复杂或带内部状态？ → Adapter 组件
   └─ 稳定协议已跨页面重复？ → 自定义 Type
```

## 能力对比

| 入口 | 字段值 | 校验 | 动态上下文 | 复用成本 | 推荐层级 |
| --- | --- | --- | --- | --- | --- |
| 内置 Type | 自动 | 支持 | 支持 | 最低 | 基础 |
| 直接组件 | 自动或自定义 model | 支持 | 支持 | 低 | 常用扩展 |
| 字段 Slot | 手动调用更新助手 | 支持 | 完整字段上下文 | 中 | 常用扩展 |
| `cellSlot` | 只提供 `updateRow` | 不提供 | 精简行上下文 | 低 | 常用扩展 |
| Adapter | 由 Adapter 统一 | 支持 | 取决于外层配置 | 中 | 业务复用 |
| 自定义 Type | 注册协议自动复用 | 支持 | 支持 | 高 | 高级扩展 |

## 直接组件优先

一次性业务组件直接使用 `type: 'component'`。标准 Vue 2 model 无需额外配置；非标准 prop/event 使用 `component.model` 描述，同步输入输出差异使用 `valueToProp/valueFromEvent`。

页面特有的联动继续放在 listener 中，不要为了隐藏几行配置就建立全局或实例注册协议。

## Slot 的两种层级

- 字段 Slot 保留 `fieldKey`、校验路径、`setValue`、复合绑定和解析后的组件配置。
- `cellSlot` 接管整个单元格，只提供行、下标、列配置和 `updateRow`。

一个单元格包含多个 FormItem 时可用 `cellSlot` 手写布局，但调用方同时承担完整校验路径和结构维护。

## Adapter 解决协议复杂度

组件存在异步草稿、多事件竞争、旧版 Prop 命名或跨页面差异时，优先封装 Adapter，把底层协议统一成标准 Vue 2 model。Adapter 负责技术兼容，页面 listener 负责当前业务联动。

## 自定义 Type 是高级能力

满足以下条件时再使用自定义 Type：

- 同一业务字段在多个页面或模块重复。
- 组件目标、model 和默认 Props 已经稳定。
- 希望 columns 直接表达 `type: 'employee'` 等业务语义。
- 团队愿意维护注册名称、泛型协议和实例级注册表。

注册定义只包含稳定的 `is/model/props`。字段路径、页面事件、权限和关联字段仍留在具体 Item 或页面。自定义 Type 不提供继承、全局合并或远程代码执行。

`defineFormTableType` 用于增强 Props 和事件的 TypeScript 提示；`defineFormTableTypes` 保存注册名称并拒绝保留名称；`createFormTable` 与 `defineFormTableColumns` 将注册表类型贯穿组件和配置。它们属于高级 TypeScript 接入，不应进入快速开始主流程。

## 远程 Schema

远程 Schema 只描述可序列化布局、静态 Props、options、业务 Type 名称和 `binding.map`。组件对象、函数、listener、Slot、权限与异步行为必须由可信前端白名单增强。

```text
远程 JSON
→ 结构和版本校验
→ 业务 Type 白名单
→ 本地组件、函数和 Slot 增强
→ ColumnConfig[]
```

远程数据不能因为最终断言成 `ColumnConfig[]` 就跳过运行时校验。

## 不进入核心的能力

- 行增删、复制、移动和确认流程。
- 公司级组件全局注册治理。
- 异步请求、缓存、权限和状态机。
- 远程函数执行或任意组件名称解析。
- 虚拟滚动、多级表头等不同渲染内核。

这些能力可在页面、Store、Adapter、Schema 转换层或独立组件中组合。

## 相关文档

[自定义字段组件](../features/custom-component.md) · [字段 Slot 与 cellSlot](../api/contexts.md) · [业务配置最佳实践](../guide/business-configuration-best-practices.md) · [自定义 Type（高级）](../features/custom-field-types.md)

