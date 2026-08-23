# FormTable

Vue 2.7 + Element UI 的轻量表格内表单组件。

> 本地调试：[打开 Playground ↗](http://localhost:5173/)。调试台右上角可随时返回文档总站。

## 从这里开始

| 目标 | 入口 |
| --- | --- |
| 第一次接入 | [快速开始](./guide/quick-start.md) |
| 理解组件边界和数据流 | [架构总览](./architecture/overview.md) |
| 选择内置 Type、组件或 Slot | [扩展模型](./architecture/extension-model.md) |
| 按完整属性路径查配置 | [API 总览](./api/configuration.md) |
| 连续理解布局和渲染模式 | [完整配置指南](./guide/configuration-guide.md) |
| 复用业务组件和高级字段协议 | [业务配置最佳实践](./guide/business-configuration-best-practices.md) |
| 查动态回调与 Slot 参数 | [Slot 与上下文](./api/contexts.md) |
| 查事件、Ref 和公开类型 | [事件与 Ref](./api/events-and-ref.md) · [公开类型](./api/types.md) |
| 查看独立功能和业务示例 | [功能专题](./features/) · [演示索引](./examples/) |
| 直接运行和搜索 API | [打开 Playground 调试台 ↗](http://localhost:5173/) |

核心原则：`formItems` 负责字段布局，`type/component/slot` 负责渲染，Element UI 负责组件行为，业务层负责行操作和字段联动。自定义 Type 用于治理已经稳定且重复的业务字段协议，属于高级扩展，不是基础接入的前置步骤。
