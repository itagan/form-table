# FormTable 当前设计

FormTable 是 `el-form + el-table` 的配置化组合，不承担低代码表单引擎或业务行管理职责。

## 渲染结构

```text
FormTable
└─ el-form
   └─ el-table
      └─ Column → el-table-column
         ├─ children → Row → el-row
         │  └─ Item → el-col + el-form-item
         │     ├─ type/component → 字段组件
         │     └─ slot → 字段具名 scoped slot
         └─ cellSlot → 列级具名 scoped slot
```

## API 边界

- 普通表单列使用 `children` 布局；不参与字段绑定的单元格可使用与其互斥的列级 `cellSlot`。
- `type` 是唯一渲染策略：内置别名、`component` 动态组件或 `slot` 自定义模板。
- `component.renderer` 在 component 模式下是 Vue 组件，在 slot 模式下是具名 slot 名称。
- `component.props/listeners/options/optionProps` 是三种渲染模式共用的配置来源。
- `component.model` 可声明自定义组件的 `prop/event/valueFromEvent`；未配置时保留 Vue 2 原生 `v-model`，`false` 表示不注入模型绑定。
- 远程 JSON 只负责可序列化结构，组件、事件和 slot 在业务页面按 `fieldKey` 本地增强。
- `type: 'slot'` 绕过组件渲染器，但保留 `el-col` 和 `el-form-item`；解析后的 component 配置通过同名上下文返回模板。
- 列级 `cellSlot` 不创建 Row/Item，不需要 `fieldKey`，只提供 `row/index/columnConfig/updateRow`。
- 表头必填标记等自定义展示由 `headerSlot` 显式渲染，字段校验只由 `formItemProps.rules` 决定。
- 表头 Slot 同时获得原始 `columnConfig` 和已解析的 `header.props/header.hint`，不会自行执行动态配置函数。
- `colProps`、`formItemProps`、`component.props` 分别透传到对应 Element UI 层。
- `column.headerHint` 和 Item 的 `hint` 是外层提示入口，当前作为原生 title 应用于默认表头文本节点和已有 `el-form-item`，不增加包装节点；各层 props 中的 title 继续原样透传。
- 动态上下文按层级提供：Column 只有 `tableData`，Row 增加 `row/index`，Field 再增加 `fieldKey`；不会回传空 row 或 `index = -1` 等占位值。
- 组件 listener 在 Field 上下文后继续接收组件原始事件参数；字段 slot 再增加 `propPath/component`。
- `fieldKey` 支持 `profile.city` 和 `items[0].name` 路径。

## 数据边界

字段更新不会修改传入行，而是发出新的数组：

```text
input/slot setValue
→ update:tableData
→ field-change
```

`tableData` 是受控数据。调用方收到 `update:tableData` 后必须立即回写；后端保存可以独立防抖或等待确认，但不能延迟父组件接收新数组。异步 listener 期间可能重建行对象时，可通过稳定 `tableProps.rowKey` 在最新数据中重新定位原行。

组件不再维护 `formData.tableData`、默认行、行增删复制移动或递归字段联动。调用方监听 `field-change` 并直接维护自己的数组。

## 动态渲染身份

- 唯一稳定的 `column.key` 会在列增删、显隐和同顺序配置替换时复用已有 Column 包装实例。
- 已有列相对顺序改变时会重新挂载可见列，确保 Element UI 按新顺序注册。
- 动态 Item 应提供唯一稳定的 `item.key`；否则前方字段显隐或增删可能使后续字段重新挂载。
- Element UI 表体单元格按可见位置渲染，中间列变化后发生位移的单元格仍可能重建；业务状态必须保存在 `tableData`。

## Element UI 能力

- `formProps` 直接传给 `el-form`。
- `tableProps` 直接传给 `el-table`。
- `column.props`、`column.headerProps`、`row.props`、`colProps`、`formItemProps`、`component.props` 原样透传到各自目标。
- Table 原生事件通过组件监听器直接下传。
- `getFormRef()` / `getTableRef()` 返回原生实例。

基础、自定义与 slot 示例位于 `FormTableView.vue`、`FormTableAdvancedView.vue`；远程 JSON 与本地增强示例位于 `RemoteSchemaView.vue`。
