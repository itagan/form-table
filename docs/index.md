# FormTable

Vue 2.7 + Element UI 的轻量表格内表单组件，负责字段布局、校验路径和受控数据更新。

```bash
pnpm add @itagan/form-table@latest
```

[打开 Playground ↗](http://localhost:5173/) · [`@itagan/form-table` on npm ↗](https://www.npmjs.com/package/@itagan/form-table)

## 选择你的入口

| 当前目标 | 推荐入口 |
| --- | --- |
| 第一次安装并完成可编辑表格 | [快速开始](./guide/quick-start.md) |
| 正在开发具体业务功能 | [开发任务导航](./guide/development-workflows.md) |
| 查询属性、事件、Slot 或 Ref | [API 总览](./api/configuration.md) |
| 理解受控更新和渲染边界 | [架构总览](./architecture/overview.md) |
| 接入自定义组件或复杂字段 | [扩展模型](./architecture/extension-model.md) |
| 查看完整业务组合 | [示例索引](./examples/index.md) |
| 排查渲染、更新或校验异常 | [排错指南](./guide/troubleshooting.md) |

## 核心边界

- `formItems` 负责字段布局，`type/component/slot` 负责字段渲染。
- `tableData` 由页面或 Store 维护，FormTable 通过受控事件写回新数组。
- Element UI 继续负责具体组件行为；行操作、接口请求和业务联动由页面负责。
- 自定义字段 Type 用于复用已经稳定的业务组件协议，不是基础接入的前置步骤。

需要连续了解完整配置时阅读[配置指南](./guide/configuration-guide.md)；需要按独立能力查询时进入[功能专题](./features/)。
