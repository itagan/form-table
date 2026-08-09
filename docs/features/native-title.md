# 原生 title 提示

> 可运行 Demo：[基础表格表单 ↗](http://localhost:5173/form-table)。将鼠标移到“姓名”字段外层可查看当前输入内容。

字符串提示默认使用浏览器原生 `title`，不增加包装组件或额外 DOM。需要高度定制的浮层时，应由业务 Slot 使用 Tooltip 组件实现。

## 配置入口

| 需求 | 完整配置路径 | 应用节点 | 是否自动应用 |
| --- | --- | --- | --- |
| 默认表头提示 | `columns[].headerHint` | 默认表头文本节点 | 是 |
| 默认表头原生属性 | `columns[].headerProps.title` | 默认表头文本节点 | 是 |
| 字段外层提示 | `columns[].children[].children[].hint` | `el-form-item` | 是 |
| 字段外层原生属性 | `columns[].children[].children[].formItemProps.title` | `el-form-item` | 透传 |
| 实际组件 title | `columns[].children[].children[].component.props.title` | 实际字段组件 | 由组件的 attrs 行为决定 |

`headerHint/hint` 表达 FormTable 外层提示语义；各级 `props.title` 只是传给对应目标节点，FormTable 不复制、不合并，也不处理它们之间的优先级。

## 配置示例

```ts
const columns: ColumnConfig[] = [{
  label: '备注',
  headerHint: ({ tableData }) => `当前共 ${tableData.length} 条记录`,
  children: [{
    children: [{
      fieldKey: 'remark',
      type: 'textarea',
      // 内容较长或被截断时，悬停字段外层可读取完整文本。
      hint: ({ value }) => value == null ? undefined : String(value),
      component: {
        props: {
          rows: 2,
          maxlength: 500,
          showWordLimit: true
        }
      }
    }]
  }]
}]
```

## 页面使用

`headerHint/hint` 不需要额外模板。保持正常的受控数据用法即可：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
/>
```

## 空值行为

| 返回值 | 行为 |
| --- | --- |
| 非空字符串 | 设置原生 `title`，浏览器悬停时显示 |
| `''` | 不显示提示内容 |
| `null` / `undefined` | 移除提示 |

动态函数应直接返回最终展示字符串。Select、日期、对象等字段的内部值不一定等于用户看到的文本，FormTable 不猜测 label：

```ts
hint: ({ value }) => schoolLabelMap[value] || ''
```

## 自定义表头中的提示

配置 `headerSlot` 后，表头 DOM 由调用方完全控制，`headerHint/headerProps` 不会自动绑定。Slot 会返回已解析的 `header`，由模板选择使用原生 title 或 Tooltip：

```vue
<template #amount-header="{ label, header }">
  <span v-bind="header.props" :title="header.hint">
    {{ label }}
  </span>
</template>
```

需要图标、富文本或可控制出现位置的提示时，参考[自定义表头](./custom-header.md)。

## 边界

- 原生 title 的出现时间、样式和位置由浏览器决定。
- 字符串形式始终保持原生 title 语义，避免未来扩展 Tooltip 时改变现有性能和 DOM。
- `component.props.title` 是否落在内部 input，取决于实际组件是否透传 `$attrs`。
- 自定义表头、字段 Slot 内部节点和 Element UI 功能列表头由调用方自行绑定提示。

## 相关 API

[Column / Row / Item](../api/columns.md) · [Slot 与上下文](../api/contexts.md)
