# 示例索引

调试应用位于 `playground`，用于验证组件源码在真实页面中的行为。

```bash
pnpm install
pnpm dev
```

## 页面

| 页面 | 路由 | 适用场景 |
| ------ | ------ | ------ |
| 基础编辑 | `/form-table` | 验证最小配置、字段编辑、基础校验和同步。 |
| 高级示例 | `/form-table-advanced` | 验证插槽、自定义组件、行操作、字段联动和事件归档。 |
| 动态插槽 | `/dynamic-slot-test` | 复现动态显隐、slot 上下文、删除行和快捷行操作。 |
| 能力文档页 | `/form-table-docs` | 在本地应用内查看 props、事件、ref 和配置约定。 |
| 组件诊断台 | `/debug` | 对比自定义组件直连和 FormTable 注册后的更新链路。 |

## 按问题查找

| 我想验证 | 优先页面 | 关注点 |
| --- | --- | --- |
| 最小表格表单是否可用 | `/form-table` | `tableData`、`columns[].fields`、`rules`、`update:tableData` |
| 单行字段布局是否符合预期 | `/form-table` | `fieldRow`、字段 `layout`、Element Table column props |
| slot 更新是否会同步到外层 | `/form-table-advanced` | `setValue`、`field-change`、校验触发 |
| 删除行时报错或校验路径残留 | `/dynamic-slot-test` | `removeCurrentRow`、动态显隐、隐藏字段校验清理 |
| 自定义组件无法回写值 | `/debug` | `customComponents`、Vue 2 `value`/`input` 约定 |
| Element Table 事件是否透传 | `/form-table-advanced` | `@event`、`row-click`、`selection-change` |
| Ref 行操作是否正常 | `/form-table-advanced` | `addRow`、`copyRow`、`moveRow`、`removeRow` |

## 自定义组件

- `playground/src/components/CustomComponents/PhoneInput.vue`
- `playground/src/components/CustomComponents/StatusTag.vue`
- `playground/src/components/CustomComponents/TestComponent.vue`
- `playground/src/components/CustomComponents/SimpleTest.vue`

## 本地运行

```bash
pnpm dev
```

建议先从首页进入目标页面。需要复现自定义组件问题时，优先打开 `/debug`；需要复现插槽删除或显隐问题时，优先打开 `/dynamic-slot-test`。

## 示例沉淀规则

新增 FormTable 能力时建议同步补一个 playground 场景：

- 新增字段类型：补到基础或高级示例。
- 新增事件或 ref 方法：补到高级示例，并在事件日志里可观察。
- 修复动态 slot、删除行、显隐、校验问题：优先补到动态插槽页面。
- 修复自定义组件协议问题：优先补到组件诊断台。

文档页不直接引入 playground 组件，避免文档构建依赖 Vue2 调试应用；示例代码以链接和片段说明为主。
