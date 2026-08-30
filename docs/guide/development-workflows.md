# 开发任务导航

本页只负责把业务任务指向最短的文档和示例。查询单个属性时使用 [API 总览](../api/configuration.md)，希望连续理解全部配置时阅读[完整配置指南](./configuration-guide.md)。

## 先确定当前任务

| 当前任务 | 推荐入口 | 可运行示例 |
| --- | --- | --- |
| 第一次接入并完成基础编辑 | [快速开始](./quick-start.md) | [`/form-table`](http://localhost:5173/form-table) |
| 从接口加载，编辑后校验、保存或撤销 | [完整编辑提交流程](../examples/form-workflow.md) | [`/form-workflow`](http://localhost:5173/form-workflow) |
| 分页编辑并保留跨页草稿或选择 | [分页与跨页编辑](../features/pagination-and-cross-page-editing.md) | 按页面分页器实现 |
| 处理多人编辑冲突和未保存离开 | [多人编辑冲突与未保存离开](../features/concurrent-editing-and-navigation.md) | [`/form-workflow`](http://localhost:5173/form-workflow) |
| 增删、复制、移动行 | [常见操作列与行增删](../features/common-row-actions.md) | [`/row-column-operations`](http://localhost:5173/row-column-operations) |
| 原子批量修改多行字段 | [数据更新与受控回写](../features/data-updates.md#updaterows-原子更新多行) | [`/row-column-operations`](http://localhost:5173/row-column-operations) |
| 校验失败后定位或聚焦字段 | [校验、清理与重置](../features/validation-reset.md) | [`/form-table`](http://localhost:5173/form-table) |
| 使用 Enter 连续录入 | [Enter 字段导航](../features/keyboard-navigation.md) | [`/row-column-operations`](http://localhost:5173/row-column-operations) |
| 宽表快速滚到首尾或指定字段 | [宽表横向滚动与字段定位](../features/horizontal-scroll.md) | [`/horizontal-scroll`](http://localhost:5173/horizontal-scroll) |
| 接入公司或第三方组件 | [自定义字段组件](../features/custom-component.md) | [`/enterprise-components`](http://localhost:5173/enterprise-components) |
| 一个组件同时编辑多个字段 | [复合字段映射](../features/composite-binding.md) | [`/composite-binding`](http://localhost:5173/composite-binding) |
| 自定义整格展示或操作区 | [`cellSlot`](../features/cell-slot.md) | [`/cell-slot`](http://localhost:5173/cell-slot) |
| 动态显示列、行或字段 | [动态显隐与配置更新](../features/dynamic-configuration.md) | [`/dynamic-slot-test`](http://localhost:5173/dynamic-slot-test) |
| 处理查看、编辑权限和行锁定 | [权限与字段可编辑性](../features/permissions-and-editing.md) | [`/heterogeneous-demands`](http://localhost:5173/heterogeneous-demands) |
| 在详情与编辑渲染间切换 | [详情与编辑模式](../features/detail-and-editing-modes.md) | [`/cell-slot`](http://localhost:5173/cell-slot) |
| 异步返回后仍要更新原行 | [稳定身份与异步安全](../features/stable-identity.md) | [`/cell-slot`](http://localhost:5173/cell-slot) |
| 接收服务端布局配置 | [远程 Schema](../features/remote-schema.md) | [`/remote-schema`](http://localhost:5173/remote-schema) |
| 排查渲染、更新或校验异常 | [排错指南](./troubleshooting.md) | 按症状选择示例 |

## 选择更新入口

```text
字段组件正常输入
→ 自动 model 写回

修改当前字段
→ setValue(nextValue)

一次修改当前行多个字段
→ updateRow(patch)

一次原子修改多行字段
→ FormTable Ref updateRows(updates)

新增、删除、移动或替换行
→ 页面不可变替换 tableData
```

这里只用于选择入口。事件顺序、失败边界、同步组合和 `rowKey` 规则统一见[数据更新与受控回写](../features/data-updates.md)。

## 选择组件扩展方式

1. 标准 Vue 2 model：直接组件，省略 `component.model`。
2. 非标准 prop/event：配置 `component.model`。
3. 多事件、内部草稿或旧协议：先封装 Adapter。
4. 协议已跨页面稳定重复：再注册自定义 Type。

完整取舍见[扩展模型](../architecture/extension-model.md)。页面生命周期、接口 DTO、保存和撤销由[完整编辑提交流程](../examples/form-workflow.md)统一说明；业务项目的配置测试方法见[业务配置测试指南](./business-testing.md)。
