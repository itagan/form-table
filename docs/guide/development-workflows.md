# 开发任务导航

本页从页面开发任务出发，帮助你在指南、功能专题和可运行示例之间选择最短路径。查询单个属性时仍应使用 [API 总览](../api/configuration.md)。

## 先确定当前任务

| 当前任务 | 推荐入口 | 可运行示例 |
| --- | --- | --- |
| 第一次接入并完成基础编辑 | [快速开始](./quick-start.md) | [`/form-table`](http://localhost:5173/form-table) |
| 从接口加载，编辑后校验、保存或撤销 | [完整编辑提交流程](../examples/form-workflow.md) | [`/form-workflow`](http://localhost:5173/form-workflow) |
| 增删、复制、移动行 | [常见操作列与行增删](../features/common-row-actions.md) | [`/row-column-operations`](http://localhost:5173/row-column-operations) |
| 接入公司或第三方组件 | [自定义字段组件](../features/custom-component.md) | [`/enterprise-components`](http://localhost:5173/enterprise-components) |
| 一个组件同时编辑多个字段 | [复合字段映射](../features/composite-binding.md) | [`/composite-binding`](http://localhost:5173/composite-binding) |
| 自定义整格展示或操作区 | [`cellSlot`](../features/cell-slot.md) | [`/cell-slot`](http://localhost:5173/cell-slot) |
| 动态显示列、行或字段 | [动态显隐与配置更新](../features/dynamic-configuration.md) | [`/dynamic-slot-test`](http://localhost:5173/dynamic-slot-test) |
| 异步返回后仍要更新原行 | [稳定身份与异步安全](../features/stable-identity.md) | [`/cell-slot`](http://localhost:5173/cell-slot) |
| 接收服务端布局配置 | [远程 Schema](../features/remote-schema.md) | [`/remote-schema`](http://localhost:5173/remote-schema) |
| 排查渲染、更新或校验异常 | [排错指南](./troubleshooting.md) | 按症状选择示例 |

## 页面生命周期

一个常规编辑页面通常遵循以下顺序：

```text
接口响应
→ 转换为页面行模型
→ 保存服务端快照
→ tableData 受控编辑
→ validate()
→ 转换为提交 DTO
→ 接口成功
→ 更新服务端快照
```

FormTable 负责中间的渲染、字段写回和校验；接口请求、加载状态、脏数据判断、提交转换和失败重试由页面或 Store 维护。

不要把接口请求放入 `columns` 的动态 props、listener 或 formatter。动态回调可能随渲染重复执行，适合同步纯计算，不适合管理请求生命周期。

## 数据由谁维护

| 状态 | 推荐维护位置 |
| --- | --- |
| `tableData` | 页面或 Store |
| 最近一次服务端快照 | 页面或 Store |
| `columns` 与稳定配置工厂 | 页面模块或业务配置模块 |
| 字段内部搜索、弹窗草稿 | 业务组件或 Adapter |
| 保存中、加载中、错误状态 | 页面或请求层 |
| 校验状态 | FormTable 内部的 Element Form |

需要撤销修改时，用服务端快照替换整份 `tableData`，随后在 `nextTick` 后调用 `clearValidate()`。不要依赖 Element Form 的 `resetFields()` 回滚受控数据。

## 选择更新入口

```text
字段组件正常输入
→ 自动 model 写回

字段 listener 或字段 Slot 修改当前字段
→ setValue(nextValue)

一次修改当前行多个字段
→ updateRow(patch)

新增、删除、移动或替换行
→ 页面不可变替换 tableData
```

异步流程中可能替换行对象时配置稳定唯一的 `rowKey`。更新失败、身份重复或目标行已删除时，更新助手会拒绝继续写入，不应通过捕获旧下标绕过身份判断。

## 接入复杂组件

按以下顺序升级：

1. 标准 Vue 2 model：直接组件，省略 `component.model`。
2. 非标准 prop/event：配置 `component.model`。
3. 多事件、内部草稿或旧协议：先封装 Adapter。
4. 协议已跨页面稳定重复：再注册自定义 Type。

完整取舍见[扩展模型](../architecture/extension-model.md)。自定义 Type 是高级复用协议，不是接入单个组件的起点。

## 提交前检查

- `rowKey` 是否来自服务端稳定身份，且不允许编辑。
- 新行是否使用页面生成且不重复的临时身份。
- 是否在保存前调用并等待 `validate()`。
- 是否在页面层把行模型转换为接口 DTO。
- 保存失败时是否保留用户当前编辑内容。
- 保存成功后是否更新服务端快照和脏状态。
- 行结构变化后是否清理失效的校验状态。

如果页面行为与预期不一致，继续查看[排错指南](./troubleshooting.md)。
