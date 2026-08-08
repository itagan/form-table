# FormTable 当前设计

FormTable 是 `el-form + el-table` 的配置化组合，不承担低代码表单引擎或业务行管理职责。

## 渲染结构

```text
FormTable
└─ el-form
   └─ el-table
      └─ Column → el-table-column
         └─ Row → el-row
            └─ Item → el-col + el-form-item
               ├─ type/component → 字段组件
               └─ slot → 具名 scoped slot
```

## API 边界

- `children` 是唯一布局结构。
- `type` 只做常用 Element UI 组件映射。
- `component.is` 直接接收自定义组件；`component.props/listeners/options` 描述组件渲染。
- `slot` 绕过组件渲染器，但保留 `el-col` 和 `el-form-item`。
- 表头必填标记等自定义展示由 `headerSlot` 显式渲染，字段校验只由 `formItemProps.rules` 决定。
- `colProps`、`formItemProps`、`component.props` 分别透传到对应 Element UI 层。
- 动态上下文按层级提供：Column 只有 `tableData`，Row 增加 `row/index`，Field 再增加 `fieldKey`；不会回传空 row 或 `index = -1` 等占位值。
- 组件 listener 在 Field 上下文后继续接收组件原始事件参数；字段 slot 再增加 `propPath`。
- 字段 key 支持 `profile.city` 和 `items[0].name` 路径。

## 数据边界

字段更新不会修改传入行，而是发出新的数组：

```text
input/slot setValue
→ update:tableData
→ field-change
```

组件不再维护 `formData.tableData`、默认行、行增删复制移动或递归字段联动。调用方监听 `field-change` 并直接维护自己的数组。

## Element UI 能力

- `formProps` 直接传给 `el-form`。
- `tableProps` 直接传给 `el-table`。
- `column.props`、`row.props`、`colProps`、`formItemProps`、`component.props` 原样透传。
- Table 原生事件通过组件监听器直接下传。
- `getFormRef()` / `getTableRef()` 返回原生实例。

完整示例位于 `playground/src/views/FormTableView.vue` 和 `FormTableAdvancedView.vue`。
