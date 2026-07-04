# FormTable

`FormTable` 是一个基于 `Vue 2.7 + Element UI + TypeScript` 的表格内表单组件，适合后台系统中的可编辑明细、批量录入和复杂行级校验场景。

## 开始使用

- [快速开始](./guide/quick-start.md)：安装、引入和最小用法。
- [配置 API](./api/configuration.md)：`tableData`、`columns`、字段配置和规则路径。
- [事件与 Ref API](./api/events-and-ref.md)：数据事件、行操作、Element Table 事件和公开方法。
- [示例索引](./examples/README.md)：playground 页面和复现入口。

## 核心能力

- 表格内嵌 Element UI Form 校验。
- 字段配置支持 input、select、date、slot 和自定义组件。
- `slot` / `customComponents` 统一进入 `update:tableData` 和 `field-change` 更新链路。
- 行操作支持新增、插入、复制、更新、移动、删除和行级校验。
- Element Table 原生 props / events / methods 保持透传。

## 本地文档站

```bash
pnpm docs:dev
```

构建文档：

```bash
pnpm docs:build
```
