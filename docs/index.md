# FormTable

Vue 2.7 + Element UI 的轻量表格内表单组件。

> 已发布到 npm：[`@itagan/form-table` ↗](https://www.npmjs.com/package/@itagan/form-table) · 可运行示例：[打开 Playground ↗](http://localhost:5173/)

```bash
pnpm add @itagan/form-table@latest
```

## 从这里开始

| 目标 | 入口 |
| --- | --- |
| 从 npm 安装公开包 | [`@itagan/form-table` ↗](https://www.npmjs.com/package/@itagan/form-table) |
| 第一次接入 | [快速开始](./guide/quick-start.md) |
| 按当前开发任务找最短路径 | [开发任务导航](./guide/development-workflows.md) |
| 完成接口加载、编辑、保存和撤销 | [完整编辑提交流程](./examples/form-workflow.md) |
| 理解组件边界和数据流 | [架构总览](./architecture/overview.md) |
| 选择内置 Type、组件或 Slot | [扩展模型](./architecture/extension-model.md) |
| 按完整属性路径查配置 | [API 总览](./api/configuration.md) |
| 连续理解布局和渲染模式 | [完整配置指南](./guide/configuration-guide.md) |
| 复用业务组件和高级字段协议 | [业务配置最佳实践](./guide/business-configuration-best-practices.md) |
| 查动态回调与 Slot 参数 | [Slot 与上下文](./api/contexts.md) |
| 查事件、Ref 和公开类型 | [事件与 Ref](./api/events-and-ref.md) · [公开类型](./api/types.md) |
| 查看独立功能和业务示例 | [功能专题](./features/) · [演示索引](./examples/) |
| 按症状排查渲染、更新和校验问题 | [排错指南](./guide/troubleshooting.md) |
| 直接运行示例 | [打开 Playground 示例中心 ↗](http://localhost:5173/) |

核心原则：`formItems` 负责字段布局，`type/component/slot` 负责渲染，Element UI 负责组件行为，业务层负责行操作和字段联动。自定义 Type 用于治理已经稳定且重复的业务字段协议，属于高级扩展，不是基础接入的前置步骤。
