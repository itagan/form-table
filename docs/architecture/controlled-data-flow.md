# 受控数据流

FormTable 把整张 `tableData` 作为受控数据。字段编辑不会直接修改 Props，而是计算新行和新数组，再通过统一事件交给父组件回写。

## 基础流程

```text
字段组件 model 事件 / setValue / updateRow
→ 定位目标行
→ 按字段路径计算不可变 Patch
→ 校验 rowKey 未被修改
→ 生成新 tableData 数组
→ emit update:tableData
→ 按 Patch 顺序 emit field-change
→ 父组件立即回写本地 tableData
```

一次 Patch 只替换目标行及其字段路径上的对象或数组；无关行继续保留原引用。值通过 `Object.is` 判断是否真正变化，没有变化时不发出事件。

## 字段双向绑定管线

字段渲染以 `bindingValue` 作为组件协议和行数据之间的统一边界。未配置 `binding.map` 时，它就是当前 `fieldKey` 的值；配置映射后，它是从当前行多个字段投影出的对象或数组。`context.value` 始终保留主 `fieldKey` 的原始值，不会随映射或 model 转换改变。

自动 model 的读取顺序为：

```text
当前行
→ fieldKey 单字段值 / binding.map 多字段投影
→ bindingValue
→ model.valueToProp（可选）
→ model prop
→ 内置 Type、直接组件或自定义 Type
```

组件写回时按相反方向处理：

```text
model 事件原始参数
→ model.valueFromEvent（可选；默认取第一个参数）
→ 新 bindingValue
→ setValue 单字段 Patch / binding.map 多字段 Patch
→ 不可变新行与新 tableData
→ update:tableData
→ 每个实际变化字段的 field-change
→ 父组件回写 tableData
```

因此，内置 Type、直接组件和自定义 Type 共享同一条数据流；它们只在组件目标及默认 model 协议的来源上不同。`binding.map` 负责稳定的路径拆装，`valueToProp/valueFromEvent` 负责同步值形状转换，两者组合时顺序固定。映射多个字段仍只生成一次 `update:tableData`，但会按实际变化分别发出 `field-change`。

以下入口会绕过部分自动管线：

| 入口或渲染方式 | 行为 |
| --- | --- |
| `setValue(value)` | 直接写主 `fieldKey`，不经过 `binding.map` 或 model 转换 |
| `setBindingValue(value)` | 从“新 bindingValue”开始；有映射时拆分为多字段 Patch，无映射时等同于 `setValue` |
| 字段 Slot | 不创建自动 model；Slot 自行渲染控件，并调用上下文更新助手 |
| `component.model: false` | 不注入 model prop，也不自动监听 model 事件；可在 listener 中主动调用更新助手 |
| `type: 'text'` | 只读取并字符串化 `bindingValue`，不执行 `valueToProp/valueFromEvent`，也不写回 |

一个组件对应多个字段时，先确认它的 model 根值是对象还是数组，再让所有 `binding.map[].valuePath` 使用同一种根结构。例如日期范围组件接收 `[start, end]`，映射路径应为 `0` 和 `1`，而不是对象属性名。具体配置与清空回退规则见[复合字段映射](../features/composite-binding.md)。

## 更新入口

| 入口 | 更新范围 | 使用位置 |
| --- | --- | --- |
| 字段自动 model | 当前字段或 `binding.map` | 内置 Type、直接组件、自定义 Type |
| `setValue(value)` | 当前 `fieldKey` | listener、字段 Slot |
| `setBindingValue(value)` | `binding.map` 映射字段 | listener、字段 Slot |
| `updateRow(patch)` | 当前行多个字段 | listener、字段 Slot、`cellSlot` |
| 页面替换 `tableData` | 行增删、复制、移动、跨行更新 | 页面或 Store |

行增删不是字段 Patch，应由了解默认值、权限、确认和接口状态的页面维护。

## 连续同步更新

父组件通常要到下一轮 Vue 更新才把新 Props 传回。为避免同一事件中连续调用 `setValue/updateRow` 丢失前一次结果，FormTable 在当前微任务内保留短期更新快照：

```ts
setValue(nextValue)
updateRow({ touched: true })
```

第二次调用基于第一次生成的新数组继续计算。微任务结束后内部快照清空，组件重新以父级最新 `tableData` 为唯一来源；这不是第二份长期状态。

## 行定位与 rowKey

同步情况下，未配置 `rowKey` 时可以通过行对象引用定位。跨异步边界后，如果父组件克隆、刷新或重排行对象，应配置唯一稳定的 `rowKey`：

```vue
<FormTable v-model="tableData" :columns="columns" row-key="id" />
```

更新时会针对最新数组按需建立身份索引。以下情况会拒绝不确定的更新：

- 目标身份不存在。
- 相同身份出现多次。
- Patch 试图修改当前 `rowKey`。
- 未配置 `rowKey` 且原行引用已不存在。

`rowKey` 可以是字段路径或函数，不应使用数组下标，也不应指向可编辑字段。

## 校验下标

Element Form 的模型固定为 `{ tableData }`，字段路径为：

```text
tableData.{数据源下标}.{fieldKey}
```

Element Table 排序或筛选只改变 `displayIndex`。FormTable 会把显示行映射回数据源 `index`，让更新和校验仍指向原行。同一个行对象重复出现在数组中时，排序后可能无法唯一映射；组件会停止绑定不可靠的校验路径。

父组件增删、复制或移动行后，旧的 Element Form 校验状态仍可能绑定原数组下标，应在 `nextTick` 后调用 `clearValidate()`。

## 事件职责

| 事件 | 含义 |
| --- | --- |
| `update:tableData` | 完整受控新数组，父组件应立即回写 |
| `field-change` | 单个实际变化字段的审计信息 |
| `form-validate` | Element Form 的逐字段校验结果 |

后端保存、埋点和防抖不应阻塞本地 `update:tableData` 回写。需要“接口成功后才改变字段”时，让编辑器保留草稿，成功后再调用更新助手。

## 相关文档

[数据更新](../features/data-updates.md) · [稳定身份](../features/stable-identity.md) · [校验与重置](../features/validation-reset.md) · [事件与 Ref](../api/events-and-ref.md)
