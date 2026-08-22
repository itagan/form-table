# FormTable Props

## 属性路径

| 配置路径 | 类型 | TypeScript | 运行时默认值 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `tableData` | `TableRow[]` | 必填 | `[]` | 根组件 `v-model` 对应 prop；也是 `el-table.data` 的唯一数据源 |
| `columns` | `ColumnConfig[]` | 必填 | `[]` | 表格列、布局和字段渲染配置 |
| `fieldTypes` | `TFieldTypes` | 注册表泛型非空时必填；否则不可用 | — | 当前 FormTable 实例的自定义字段 type 注册表 |
| `rowKey` | `string \| ((row: TRow) => FormTableValue)` | 可选 | — | FormTable 与 Element Table 共用的稳定行身份 |
| `formProps` | `FormTableFormProps` | 可选 | `{}` | 透传给 `el-form`；不接受内部管理的 `model` |
| `tableProps` | `FormTableTableProps` | 可选 | `{}` | 透传给 `el-table`；不接受内部管理的 `data/rowKey` |
| `hintOptions` | `FormTableHintOptions<TRow>` | 可选 | `{ mode: 'title', targets: 'field' }` | 整表 Hint 展示策略、作用范围及字段统一格式化 |
| `loading` | `boolean` | 可选 | `false` | `el-table` 的 `v-loading` |

`tableData` 和 `columns` 在公开 `FormTableProps` 类型中是必填项；组件仍提供空数组作为运行时容错默认值。TypeScript 项目应显式传入两者，不依赖运行时默认值。

`fieldTypes` 只在使用自定义字段 type 时提供。通过 `createFormTable<TRow, typeof fieldTypes>()` 绑定非空注册表后，该 Prop 在类型层必填；默认组件和未传第二泛型的现有 API 形状保持不变。注册表按实例隔离，可以整体替换新对象触发重新解析，不承诺原地深层修改。配置与名称规则见[自定义字段 Type](../features/custom-field-types.md)。

`mode` 支持 `false/'title'/'tooltip'`：关闭、原生 `title` 或整表共享单个 Element Tooltip。`targets` 支持 `field/header/all`，默认仅字段；被排除的目标不会求值。`tooltipProps` 只在 Tooltip 模式生效。

`field` 可配置 `boolean | FormTableFieldHintFormatter`：未配置或 `false` 表示无全局字段处理，`true` 对非空字段值执行 `String(value)`，函数统一格式化。Item 不写、返回 `null` 或空字符串时继承，`false` 关闭，非空字符串覆盖。表头不继承字段默认值，必须显式配置 `headerHint`。完整行为见 [Hint 提示体系](../features/hint.md)。

## 受控数据

FormTable 根组件的 `v-model` 映射到 `tableData/update:tableData`。组件不直接修改 `tableData`；字段输入、`setValue` 或 `updateRow` 会发出新数组：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
/>
```

三种写法使用同一协议：

| 场景 | 写法 |
| --- | --- |
| 日常双向绑定（推荐） | `v-model="tableData"` |
| Vue 2 具名兼容写法 | `:table-data.sync="tableData"` |
| 保存、审计等自定义回写 | `:table-data="tableData" @update:tableData="handleUpdate"` |

根组件 `v-model` 不发出额外的 `input` 事件；它通过 Vue 2 `model` 配置直接复用 `update:tableData`。这与 Item 的 `component.model` 不同：前者绑定整张表，后者适配某个字段组件的值协议。

本地回写必须立即执行；后端保存可在独立流程中防抖。各种更新入口、事件结果和异步行为见[数据更新与受控回写](../features/data-updates.md)。

## Element UI 透传

`formProps` 和 `tableProps` 不做白名单复制，由调用方按 Element UI 版本传入。FormTable 文档只列出透传入口，不重复枚举 Element UI 的全部原生属性。

```ts
const formProps = {
  size: 'small',
  labelPosition: 'left'
}

const tableProps = {
  border: true,
  spanMethod
}
```

### FormTable 管理的原生属性

| Element UI 属性 | FormTable 入口 | 管理原因 |
| --- | --- | --- |
| `el-table.data` | 顶层 `tableData` | 受控表格数据和字段更新的唯一来源 |
| `el-table.row-key` | 顶层 `rowKey` | Element Table 渲染身份与 FormTable 安全更新共用 |
| `el-form.model` | 内部 `{ tableData }` | 与 `tableData.{rowIndex}.{fieldKey}` 校验路径保持一致 |

这些属性不属于对应的透传对象。TypeScript 会拒绝在 `tableProps/formProps` 中配置它们；JavaScript 或远程 Schema 中的 `tableProps.data/rowKey` 会在运行时适配边界被主动丢弃，`formProps.model` 仍由内部显式绑定覆盖。表格数据应使用 `v-model`、`:table-data.sync`，或显式组合 `tableData/update:tableData` 受控协议。

`rowKey` 同时传给 Element Table，并在异步字段回调或 `cellSlot.updateRow` 中用于重新定位原数据行。rowKey 必须唯一、稳定，不应使用数组下标。不同 key 的职责和配置时机见[稳定身份与异步安全](../features/stable-identity.md)。

## Element Table 根级 Slot

| Slot | Scope | 说明 |
| --- | --- | --- |
| `empty` | 无 | 数据为空时替换 Element Table 默认空状态 |
| `append` | 无 | 在表格内容末尾追加内容 |

两个 Slot 直接转发给 `el-table`，不增加 FormTable 包装节点。只有实际提供 Slot 时才注册，因此 `tableProps.emptyText` 和 Element UI 默认空状态在没有 `#empty` 时保持有效。

```vue
<FormTable v-model="tableData" :columns="columns">
  <template #empty>暂无数据</template>
  <template #append>表格末尾内容</template>
</FormTable>
```

原生 Table 事件和 Slot 的完整边界见[事件与 Ref](./events-and-ref.md)。
