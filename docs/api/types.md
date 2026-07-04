# API 类型边界

`@itagan/form-table` 包入口只导出业务侧稳定使用的公开类型。

## 公开类型

- `ColumnConfig`
- `RowConfig`
- `FormItemConfig`
- `FormItemType`
- `TableRow`
- `FormTableRecord`
- `FormTableProps`
- `FormTableExpose`
- `FormTableEventPayload`
- `FormTableFieldChangePayload`
- `FormTableSlotContext`
- `FormTableHeaderSlotContext`
- `CustomComponentConfig`
- `ValidationRule`

## 内部类型

以下内容保留在源码内部，不作为 npm 包 API 承诺：

- provide / inject keys
- dispatch 类型
- 内部事件命令
- 内部 actions 编排类型
- Element UI 实例的内部编排细节

公开类型出口维护在：

- `packages/form-table/src/types.public.ts`
- `packages/form-table/src/public-types.ts`
