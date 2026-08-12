# FormTable

Vue 2.7 + Element UI 的表格内表单组件。组件只负责布局、字段渲染、校验路径和数据更新；行操作与字段联动由调用方维护。

## 安装与版本要求

```bash
pnpm add @itagan/form-table
```

Vue 和 Element UI 由使用方预先安装、注册，当前支持 Vue `>=2.7.1 <3.0.0` 与 Element UI `>=2.4.9 <3.0.0`，最低版本组合已通过现有行为测试。

最佳建议组合是 Vue `2.7.16` + Element UI `2.15.14`。两者分别是 Vue 2 和 Element UI 2 的最终发布版本，也是 FormTable 日常开发和完整回归测试使用的版本；新项目或没有旧版本约束的项目应优先采用该组合。

Vue `2.7.0`、Vue 2.6 及更早版本不受支持；Element UI 低于 `2.4.9` 时缺少 FormTable 表头 Slot 所需的 Table 表头 scoped slot。旧项目应先升级到支持范围，不能升级时不建议忽略 peer dependency 警告强制安装。

Vue 3 暂不支持。本组件依赖 Vue 2.7 和 Element UI 2.x，不能通过将 Element UI 替换为 Element Plus 直接用于 Vue 3 项目。

## 核心配置

```ts
const columns = [{
  label: '基本信息',
  props: { minWidth: 320 },
  children: [{
    props: { gutter: 8 },
    children: [{
      key: 'primary-name',
      fieldKey: 'name',
      type: 'input',
      colProps: { span: 12 },
      formItemProps: {
        rules: [{ required: true, message: '请输入姓名' }]
      },
      component: {
        props: { clearable: true }
      }
    }]
  }]
}]
```

需要让动态配置回调获得具体业务行类型时，可使用零运行时开销的泛型助手：

```ts
import { defineFormTableColumns, type TableRow } from '@itagan/form-table'

interface PurchaseRow extends TableRow {
  name: string
  amount: number
}

const columns = defineFormTableColumns<PurchaseRow>([{
  label: '采购信息',
  visible: ({ tableData }) => tableData.some(row => row.amount > 0),
  children: [{
    children: [{
      fieldKey: 'amount',
      type: 'number',
      component: {
        props: ({ row }) => ({ disabled: row.amount <= 0 })
      }
    }]
  }]
}])
```

不使用该助手的现有 `ColumnConfig[]` 写法保持兼容；`fieldKey` 仍为支持嵌套路径的字符串。

Item 的 `key` 是可选渲染身份，`fieldKey` 是必填数据路径。动态增删、排序或重复使用同一 `fieldKey` 时建议提供稳定 `key`。

动态 Column 应提供唯一稳定的 `key`。列增删、显隐或同顺序配置替换会尽量复用仍存在的列包装实例；已有列相对顺序变化时会重新挂载可见列，以保持 Element UI 的注册顺序正确。

动态 Item 也建议提供唯一稳定的 `key`。未提供时使用 `fieldKey + 当前可见下标` 降级，前方字段显隐或增删后可能重新挂载后续字段。Element UI 表体单元格本身按可见位置渲染，中间列变化后发生位移的单元格内容仍可能重建，因此业务状态必须及时同步到 `tableData`。

字段通过 `type` 明确选择渲染模式：

- `type: 'input'`：常用 Element UI 组件快捷映射。
- `type: 'component' + component.renderer`：直接传入固定自定义组件。
- `type: 'component' + component.resolveRenderer`：根据当前行同步选择实际组件，可配合静态 renderer 兜底。
- `type: 'slot' + component.renderer`：完全自定义 scoped slot。

内置 `type` 只映射 Element UI 默认提供的组件。Element UI 未提供的组件（例如 Tree Select）不属于内置类型，应通过 `type: 'component'` 接入业务组件或第三方组件。

可创建多标签选择不设单独别名，直接使用 `type: 'select'`，并在 `component.props` 中配置 `{ multiple: true, filterable: true, allowCreate: true }`。

`component.props/listeners/options/optionProps` 是三种模式共用的渲染配置。自定义组件省略 `component.model` 或将其设为 `true` 时保留 Vue 2 原生 `v-model`；也可指定 `{ prop, event, valueFromEvent }`，或设为 `false` 禁用模型注入。slot 模式会把解析后的 `component` 通过上下文返回，由模板自行绑定。

外层悬浮提示使用 `column.headerHint` 和 Item 的 `hint`。`hintOptions.field` 未配置或为 `false` 时无全局处理，`true` 默认字符串化，函数统一格式化；Item 不写或返回空值时继承、`false` 关闭、非空内容覆盖。`behavior: 'custom'` 时 FormTable 不产生自动 DOM、ARIA 或 singleton 行为。只有有效 `auto` Hint 会在渲染属性中取代同层 title。

字段 Slot 和列级 `cellSlot` 内容直接渲染，不附加内部 `div/span` 包装；需要根节点样式时由 Slot 模板自行提供。表头 Slot 例外：FormTable 会提供统一的提示包装节点。

不参与字段绑定的操作列、状态组合或图片单元格可直接使用列级 `cellSlot`：

```ts
{
  key: 'actions-column',
  label: '操作',
  cellSlot: 'actions',
  props: { width: 160, fixed: 'right' }
}
```

`cellSlot` 与 `children` 互斥，不需要 `fieldKey`，也不创建 `el-row/el-col/el-form-item`。其 Slot 只接收 `row/index/columnConfig/updateRow`，不提供 `value/setValue/propPath/component`。需要字段取值、写回或校验时应使用 `type: 'slot'` 字段 Slot。

`row` 和 `columnConfig` 按浅只读约定使用；`index` 是当前渲染下标；`updateRow` 不可变地更新当前行，发出 `update:tableData`，并为每个实际变化的 patch 字段发出 `field-change`。patch key 可使用 `profile.enabled` 等嵌套路径。

## 使用

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :form-props="{ size: 'small' }"
  :table-props="{ border: true }"
  @field-change="handleFieldChange"
  @selection-change="handleSelectionChange"
>
  <template #actions="{ row, index, updateRow }">
    <el-button @click="updateRow({ enabled: !row.enabled })">切换</el-button>
    <el-button @click="removeRow(index)">删除</el-button>
  </template>
</FormTable>
```

根组件 `v-model` 映射到 `tableData/update:tableData`。原有 `:table-data.sync="tableData"` 完全兼容；需要在回写时保存、记录日志或执行其他副作用时，可改用 `:table-data="tableData"` 与 `@update:tableData="handleUpdate"`。

Table 原生事件直接透传。通过 ref 可调用 `validate()`、`resetFields()`、`clearValidate()`、`getFormRef()` 和 `getTableRef()`。

字段规则直接配置在 `formItemProps.rules`。`resetFields()` 保持 Element UI 原生语义；受控场景由调用方恢复 `tableData` 后调用 `clearValidate()`。单字段校验等底层能力可通过 `getFormRef()` 使用。

表头必填标记等展示使用 `headerSlot` 明确渲染；FormTable 自动把 `headerProps` 和 `behavior: 'auto'` 的 `headerHint` 应用到 Slot 外层包装节点。Slot scope 包含已解析的 `header.props` 与标准化 `header.hint`；仅在 `behavior: 'custom'` 时由模板自行消费提示。字段是否必填只由 `formItemProps.rules` 决定。

动态配置只获得当前层级有意义的上下文：Column 为 `tableData/columnConfig`，Row 增加 `row/index/rowConfig`，Field 增加 `fieldKey/value/itemConfig`。Hint 求值后，component 动态配置获得标准化 `hint`，组件 listener 再获得 `setValue/updateRow`，字段 Slot 再提供 `propPath/component`；列级 cellSlot 只提供 `row/index/columnConfig/updateRow`。数据和配置引用采用类型层面的浅只读约束，运行时不冻结对象。

命名边界：`row` 是当前业务数据行，`rowConfig` 是布局配置；`itemConfig` 是原始字段配置，字段 Slot 的 `component` 是当前行解析后的组件配置，表头 Slot 的 `header` 是已解析的表头展示配置。

`tableProps.rowKey` 是可选能力。普通同步编辑和增删行依靠对象引用即可；异步 listener 等待期间可能刷新、克隆或替换全部行对象时，建议配置唯一稳定的 rowKey。更新助手会在最新 `tableData` 中重新定位，目标行不存在时忽略更新，避免误写其他行。

`tableData` 是受控数据：收到 `update:tableData` 后应立即更新父组件状态，不能对本地回写做防抖或等待接口成功。后端保存可以独立延迟、合并或防抖；推荐顺序是“立即更新本地 `tableData` → 延迟保存最新快照”。

远程 schema 建议只返回布局、`type`、静态 props/options 等 JSON；组件对象、事件函数与 slot 实现由页面按 `fieldKey` 本地增强。核心不执行远程代码，也不维护业务组件注册表。
