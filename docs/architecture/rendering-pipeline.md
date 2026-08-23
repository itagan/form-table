# 渲染架构

FormTable 先解析列模式，再决定是否进入字段渲染链路。理解这条分支比记忆全部配置属性更重要。

## 列模式归一化

公开的 `ColumnConfig` 在内部被归一化为三种结果：

```text
ColumnConfig
├─ 只有 props                  → plain / NativeColumnConfig
├─ formItems                   → layout / LayoutColumnConfig
└─ cellSlot                    → cell-slot / CellSlotColumnConfig
```

| 模式 | 是否创建 Row/Item | 是否有字段校验 | 典型用途 |
| --- | --- | --- | --- |
| 原生列 | 否 | 否 | selection、index、expand、Element formatter |
| 布局列 | 是 | 是 | 输入、选择、日期和业务字段组件 |
| `cellSlot` | 否 | 否 | 组合展示、状态、派生值和操作列 |

三种模式互斥。操作列不应为了获得按钮位置而虚构 `fieldKey`；需要校验的自定义编辑器也不应降级为 `cellSlot`。

## 布局列渲染链路

```text
LayoutColumnConfig
→ FormTableRow / el-row
→ FormTableItem / el-col / el-form-item
→ 字段上下文
→ 组件目标与动态配置解析
→ FieldRenderer 或字段 Slot
```

每个字段只创建一条明确的 FormItem 链路。`FieldRenderer` 是函数式渲染器，不增加有状态 Vue 实例；它负责内置选项、组件 model 和监听器绑定。

## 字段渲染方式

| 方式 | 配置入口 | 适用场景 | 层级 |
| --- | --- | --- | --- |
| 内置 Type | `type: 'input'` 等 | Element UI 常规字段 | 基础 |
| 直接组件 | `type: 'component'` | 一次性业务组件或动态组件 | 常用扩展 |
| 字段 Slot | `type: 'slot'` | 保留字段、校验和更新能力的自定义模板 | 常用扩展 |
| 自定义 Type | `fieldTypes + type` | 跨页面重复的稳定业务字段协议 | 高级扩展 |

直接组件、字段 Slot 和自定义 Type 最终都会生成同一种内部组件描述，但配置来源和治理成本不同。不要因为组件复杂就直接注册 Type；是否稳定和重复才是判断依据。

## 动态上下文分层

动态函数只获得所在层级需要的数据：

```text
ColumnContext    tableData, columnConfig
RowContext       + row, index, displayIndex
FieldContext     + fieldKey, value, itemConfig
ActionContext    + setValue, bindingValue, setBindingValue, updateRow
```

上下文通过惰性 getter 分层扩展。回调只读取 `row` 时不会因为存在 `tableData` 字段就自动订阅整张表；真正读取整表的动态回调仍会随整表更新重新求值。

## 渲染身份

| 身份 | 作用 |
| --- | --- |
| `rowKey` | 数据行定位及 Element Table 行身份 |
| `column.key` | 动态列实例身份与重排 |
| `item.key` | 字段实例身份，特别是重复 `fieldKey` 或动态 Item |

唯一 `column.key` 可以跨位置识别同一列。已有列发生相对重排时，FormTable 会提升内部顺序版本，让 Element Table 重新建立正确的列布局；单纯显隐不会无条件重建全部列。

## Hint 渲染边界

Title 模式把提示属性应用到表头、FormItem 或实际字段目标；Tooltip 模式由根组件维护整表单例，并通过事件委托切换引用目标。字段 Slot 若使用 `hintTrigger: 'content'`，应提供唯一可见内容根节点，否则会回退到 FormItem。

Hint 不改变字段值、model 或 Slot 上下文。存在 `column.props.renderHeader` 时，Element UI 完全接管表头，FormTable 不再应用自动表头包装和 Hint。

## 相关文档

[Column / Item API](../api/columns.md) · [Component API](../api/component.md) · [Slot 与上下文](../api/contexts.md) · [扩展模型](./extension-model.md)

