# FormTable

一个基于 `Vue 2.7 + Element UI + TypeScript` 的表格表单组件，适合后台“表格内嵌表单”场景。

## 当前状态

这个仓库现在只保留新版实现。

核心入口：

- `src/components/FormTable/index.vue`

推荐先看：

- [当前完整文档](./CURRENT_FORMTABLE_DOC.md)
- [基础示例](./src/views/FormTableView.vue)
- [高级示例](./src/views/FormTableAdvancedView.vue)
- [调试示例](./src/views/DebugView.vue)

## 特性

- 配置驱动渲染列、布局和表单项
- 基于 `el-form` 的统一校验
- 支持插槽和自定义组件扩展
- 支持 `bind` 透传不常见组件属性
- 支持统一归档事件 `@event`

## 运行

```bash
pnpm install
pnpm dev
pnpm build
pnpm type-check
```

## 主要路由

- `/form-table`
- `/form-table-advanced`
- `/dynamic-slot-test`

## 文档说明

详细 API、配置结构、事件、`bind` 透传、自定义组件和插槽用法，统一维护在：

- [CURRENT_FORMTABLE_DOC.md](./CURRENT_FORMTABLE_DOC.md)
