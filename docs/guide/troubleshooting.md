# 排错指南

本页按症状定位常见问题。先在开发环境复现，并确认控制台没有未知 Type、无效组件配置或重复 `rowKey` 的诊断信息。

## 字段显示但无法输入

依次检查：

1. `tableData` 是否由 `v-model` 或 `@update:tableData` 立即回写。
2. 组件是否使用标准 Vue 2 `value/input`；否则需要配置 `component.model`。
3. 是否误设了 `model: false`。
4. 动态 props 是否返回了 `disabled: true` 或 `readonly: true`。

如果显式监听 `update:tableData`，必须更新页面状态：

```vue
<FormTable
  :table-data="tableData"
  :columns="columns"
  @update:tableData="tableData = $event"
/>
```

## 自定义组件显示为空

| 现象 | 检查项 |
| --- | --- |
| 字符串组件名不渲染 | 组件是否已在当前 Vue 构造器全局注册 |
| 直接组件不渲染 | `component.is` 是否收到组件对象，而不是组件文件路径字符串 |
| 动态组件偶尔为空 | `resolveComponent` 是否返回组件；返回空值时是否配置静态 `is` 回退 |
| 自定义 Type 留下空 FormItem | 名称是否已加入当前实例 `fieldTypes`，是否误用了保留名称 |

一次性组件优先对照[自定义字段组件](../features/custom-component.md)；注册式名称对照[自定义字段 Type](../features/custom-field-types.md)。

## 输入后值又恢复

通常是父组件没有接受受控更新，或异步接口用旧响应覆盖了新状态：

- 确认没有同时维护两份互相覆盖的 `tableData`。
- 不要在 computed 中每次返回新的接口初始数组作为 `tableData`。
- 搜索、联动等异步响应应检查请求序号或当前行身份。
- 保存失败时保留当前编辑值，不要自动恢复旧快照。

完整受控协议见[受控数据流](../architecture/controlled-data-flow.md)。

## 校验没有触发

检查规则是否位于 Item 的 `formItemProps.rules`，并确认：

- `fieldKey` 指向真实行字段或合法嵌套路径。
- 规则 trigger 与组件事件一致；选择类组件通常使用 `change`。
- 字段 Slot 仍位于 `type: 'slot'` Item 内，而不是改成了无字段语义的 `cellSlot`。
- 提交函数等待了 `await formTableRef.value?.validate()`。

## 删除或移动行后校验错位

FormTable 使用数据源下标生成 Element Form 校验路径。行结构变化后，旧校验状态可能仍由 Element Form 保留。

页面完成新增、删除、移动或整体替换后，在 `nextTick` 后调用：

```ts
await nextTick()
formTableRef.value?.clearValidate()
```

这只清理校验展示，不修改受控数据。详细边界见[校验、清理与重置](../features/validation-reset.md)。

## 异步更新写到了错误行或没有生效

异步期间如果行可能被复制、移动或重新加载，必须配置稳定 `rowKey`：

```vue
<FormTable row-key="id" v-model="tableData" :columns="columns" />
```

同时确认：

- 每行身份唯一，`0` 与 `-0` 也视为同一身份。
- 新增行使用不重复的临时 ID。
- `rowKey` 字段不通过 `setValue/updateRow` 修改。
- 目标行已删除时，业务允许忽略迟到结果。

## Slot 没有内容

- 字段 Slot：Item 必须是 `type: 'slot'`，名称位于 `component.slot`。
- 列级 Slot：列使用 `cellSlot`，并在 FormTable 上提供同名具名 Slot。
- 缺失具名 Slot 时单元格按设计保持为空，不会回退到 `formItems`。
- `formItems` 与 `cellSlot` 不应同时声明。

两类上下文和更新助手不同，参见 [Slot 与上下文](../api/contexts.md)。

## Element Table 属性或事件没有效果

根级 Table 属性放入 `tableProps`，列属性放入 `columns[].props`；不要把 Element Table Column 属性放到 Item：

```ts
const columns = [{
  key: 'amount',
  label: '金额',
  props: { sortable: 'custom', minWidth: 160 },
  formItems: [/* ... */]
}]
```

排序、筛选、选择等事件从 FormTable 根组件监听。原生能力对照[Element 功能列透传](../features/native-columns.md)。

## 页面很慢

先区分首次挂载、输入更新、动态配置还是校验耗时，不要只看开发模式的一次毫秒数：

- 大量只读内容优先使用 `cellSlot`。
- 保持 `columns`、`fieldTypes` 和业务选项引用稳定。
- 一次修改多个字段使用单个 `updateRow`。
- 动态 props、formatter 和 visible 保持同步纯计算。
- 在 [`/performance`](http://localhost:5173/performance) 中复现相近规模。

继续查看[性能优化建议](../features/performance-optimization.md)。

## 仍无法定位

准备一个最小复现，至少保留：

- 一行 `tableData`。
- 一个相关 Column 和 Item。
- 组件的 model prop/event。
- 实际收到的事件参数。
- Vue、Element UI 和 FormTable 版本。

先删除与问题无关的动态配置、权限和接口请求。如果最小配置正常，再按 Adapter、listener、异步请求、Schema 增强的顺序逐层加回。
