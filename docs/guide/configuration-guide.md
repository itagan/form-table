# 完整配置指南

本页用于建立 FormTable 的整体心智模型：先理解布局，再选择渲染方式，最后确定数据更新和业务边界。这里保留连续阅读所需的结论和小例子；属性类型、默认值和完整路径以 [API 总览](../api/configuration.md)为准，具体能力的失败边界以对应专题为准。

## FormTable Props

FormTable 的顶层输入包括：

| 属性 | 职责 |
| --- | --- |
| `tableData` | 受控表格数据，也是字段编辑的唯一数据源 |
| `columns` | Column → Item 布局与渲染配置 |
| `formProps` | 透传给 `el-form` |
| `tableProps` | 透传给 `el-table` |
| `hintOptions` | 整张表统一采用的 title/Tooltip 策略，以及字段默认启用和 formatter |
| `loading` | 表格 loading 状态 |

根组件 `v-model` 映射到 `tableData/update:tableData`。父组件收到更新后必须立即回写本地状态；后端保存可以独立防抖或批量处理。完整协议见 [FormTable Props](../api/form-table.md) 和[数据更新与受控回写](../features/data-updates.md)。

`rowKey` 不是普通编辑的必选项；异步期间会替换行对象或 Element Table 需要稳定身份时再配置。身份约束见[稳定身份与异步安全](../features/stable-identity.md)。

## 布局

配置固定为两层：

```text
columns[]                              ColumnConfig
├─ rowProps                           唯一 el-row，默认 type: flex
└─ formItems[]                        FormItemConfig / el-col + el-form-item
```

最小布局示例：

```ts
const columns: ColumnConfig[] = [{
  key: 'profile',
  label: '基本信息',
  props: { minWidth: 320 },
  rowProps: { gutter: 8 },
  formItems: [{
    key: 'name',
    fieldKey: 'name',
    type: 'input',
    colProps: { span: 12 }
  }]
}]
```

Column 负责表格列及单元格内唯一 Row（默认 `type: 'flex'`，可由 `rowProps.type` 覆盖），Item 负责 `el-col`、字段路径、校验和实际组件。完整属性见 [Column / Item](../api/columns.md)。不需要字段语义的操作列或展示单元格使用列级 [`cellSlot`](../features/cell-slot.md)。

## 校验规则

规则直接放在 Item 的 `formItemProps.rules`：

```ts
{
  fieldKey: 'profile.phone',
  type: 'input',
  formItemProps: {
    rules: [{ required: true, message: '请输入手机号' }]
  }
}
```

FormTable 会根据当前行在受控 `tableData` 中的位置生成校验路径。排序、增删、移动后的路径与清理时机见[校验、清理与重置](../features/validation-reset.md)。

## 渲染模式

`type` 是唯一渲染策略：

| 模式 | 使用方式 | 适用场景 |
| --- | --- | --- |
| 内置类型 | `type: 'input'` 等 | Element UI 标准字段 |
| 自定义组件 | `type: 'component'` | 公司组件、业务组件、第三方组件 |
| 字段 Slot | `type: 'slot'` | 页面完全控制字段模板 |

内置类型映射和 `component` 的完整路径见 [Component 配置](../api/component.md)。

### 按当前行解析组件

同一字段在不同行需要不同组件时使用同步 `resolveComponent`：

```ts
component: {
  is: DefaultEditor,
  resolveComponent: ({ row }) => editorMap[row.type]
}
```

返回 `undefined` 时回退到静态 `is`。完整页面模式见[自定义字段组件](../features/custom-component.md)。

一个组件值对应多个行字段且仅需路径转换时，使用可序列化的 `binding.map`；需要计算、异步或副作用时继续使用动态 props 和 listener：

```ts
{
  fieldKey: 'startTime',
  binding: {
    map: [
      { fieldPath: 'startTime', valuePath: '[0]', fallbackValue: '' },
      { fieldPath: 'endTime', valuePath: '[1]', fallbackValue: '' }
    ]
  },
  type: 'date',
  component: { props: { type: 'daterange' } }
}
```

`fieldKey` 仍是唯一校验锚点；路径、兜底值和清空语义见[复合字段映射](../features/composite-binding.md)。

### 外层提示模式

表头提示使用 `column.headerHint`，字段提示使用 Item `hint`，整张表通过 `hintOptions` 选择原生 `title` 或单实例 Tooltip。继承优先级、触发区域和关闭方式见 [Hint 提示体系](../features/hint.md)。

### 自定义组件绑定协议

标准 Vue 2 `value/input` 协议可以省略 `component.model`。非标准组件声明接收值的 prop、写回事件和取值函数：

```ts
component: {
  is: MoneyInput,
  model: {
    prop: 'amount',
    event: 'amount-change',
    valueToProp: (_context, cents) => Number(cents || 0) / 100,
    valueFromEvent: (_context, ...args) =>
      Math.round((args[0] as { amount: number }).amount * 100)
  }
}
```

`valueToProp` 将字段或 `binding.map` 组合值同步转换为组件 prop，`valueFromEvent` 转换组件输出。只展示或由 listener 手动处理的组件可以设置 `model: false`。

### 使用 Vue Render Function

`component.is` 对应 Vue 动态组件的 `is`，可以直接接收 Vue 组件对象、函数组件或全局注册组件名。Render Function 仍应封装为组件，不要让 columns 配置承担 VNode 拼装和业务状态管理。字符串在 Vue 运行时也可能解析为原生标签，但 FormTable 不为原生节点补齐子内容、DOM Property 或指令级 v-model；标准表单控件使用内置 `type`，完全自定义的原生结构使用字段 Slot。完整边界见 [Component 配置](../api/component.md#is-目标与原生标签边界)。

### 列级 cellSlot

`columns[].cellSlot` 直接渲染整个单元格，与 `formItems` 互斥：

```ts
{
  key: 'actions',
  label: '操作',
  cellSlot: 'actions'
}
```

它只提供 `row/index/displayIndex/columnConfig/updateRow`，不创建字段路径和校验。完整示例见 [`cellSlot` 列级单元格](../features/cell-slot.md)。

### Slot 模式

字段 Slot 保留 Item、字段路径和校验语义：

```ts
{
  fieldKey: 'score',
  type: 'slot',
  component: { slot: 'score-editor' }
}
```

模板获得 `value/setValue/updateRow/propPath/component` 等已解析上下文。Slot 与 `cellSlot` 的差异见 [Slot 与上下文](../api/contexts.md)。

## 运行时上下文

动态配置只获得当前层级有意义的数据：

```text
Column → tableData, columnConfig
rowProps → Column 信息 + row, index, displayIndex
Item   → Row 信息 + fieldKey, value, itemConfig
```

配置引用和数据按浅只读约定使用。字段数据通过 `setValue/updateRow` 更新，配置通过调用方不可变替换 `columns`。

### 各回调上下文速查

| 入口 | 读取数据 | 更新能力 |
| --- | --- | --- |
| Column 动态配置 | `tableData` | — |
| `rowProps` 动态配置 | `row/index/displayIndex` | — |
| Item 动态配置 | `fieldKey/value` | — |
| `component.listeners` | Item 全部数据 | `setValue/updateRow` |
| 字段 Slot | Item 全部数据与已解析组件 | `setValue/updateRow` |
| `cellSlot` | `row/index/displayIndex/columnConfig` | `updateRow` |

完整类型和快照语义见 [Slot 与上下文](../api/contexts.md)，异步更新的行定位规则见[稳定身份与异步安全](../features/stable-identity.md)。

### 实际回传数据示例

字段 listener 的第一个参数固定为字段上下文，之后保留组件原始事件参数：

```ts
listeners: {
  change({ row, fieldKey, setValue, updateRow }, nextValue) {
    setValue(nextValue)
    updateRow({ touched: true })
  }
}
```

### 动态显隐

`visible` 和动态 props 可以读取所在层级上下文。结构变化时应替换 `columns`，并为动态 Column、Row、Item 提供稳定 key。详见[动态显隐与配置更新](../features/dynamic-configuration.md)。

### 完整配置示例

完整配置不应写成一个长期增长的对象。建议拆为稳定 columns 工厂、页面状态和业务 listener：

```ts
const columns = createColumns({
  editable: () => editable.value,
  onOpenDetail: row => openDetail(row.id)
})
```

需要完整可运行实现时，从[示例索引](../examples/index.md)选择最接近的业务场景。

同一个业务组件的 model、默认 props 或字段配置开始在多个页面重复时，先使用普通配置工厂或 Adapter 组件收敛，不需要修改 FormTable 的 `type` 协议。组件预设和开放自定义 type 的适用条件见[业务配置最佳实践](./business-configuration-best-practices.md)。

## 远程 JSON 与本地增强

远程 Schema 只保存可序列化的布局、字段类型、静态 props 和 options。组件对象、函数、Slot 与权限判断在页面本地增强：

```ts
const columns = remoteColumns.map(column => enhanceColumn(column, {
  amount: { is: MoneyInput },
  actions: { slot: 'row-actions' }
}))
```

核心组件不执行远程代码，也不维护全局业务组件注册表。完整边界见[远程 Schema 与本地增强](../features/remote-schema.md)。

下一步可以按任务选择：[API 总览](../api/configuration.md)、[功能专题](../features/index.md)或[业务示例](../examples/index.md)。

如果已有明确页面任务，可从[开发任务导航](./development-workflows.md)直接选择最短路径；配置表现与预期不一致时，按[排错指南](./troubleshooting.md)逐项定位。
