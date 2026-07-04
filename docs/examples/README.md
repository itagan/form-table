# 示例索引

调试应用位于 `playground`，用于验证组件源码在真实页面中的行为。

## 页面

| 页面 | 路由 | 适用场景 |
| ------ | ------ | ------ |
| 基础编辑 | `/form-table` | 验证最小配置、字段编辑、基础校验和同步。 |
| 高级示例 | `/form-table-advanced` | 验证插槽、自定义组件、行操作、字段联动和事件归档。 |
| 动态插槽 | `/dynamic-slot-test` | 复现动态显隐、slot 上下文、删除行和快捷行操作。 |
| 能力文档页 | `/form-table-docs` | 在本地应用内查看 props、事件、ref 和配置约定。 |
| 组件诊断台 | `/debug` | 对比自定义组件直连和 FormTable 注册后的更新链路。 |

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
