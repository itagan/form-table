# 配置 API

## FormTable Props

| 属性 | 说明 |
| --- | --- |
| `tableData` | 表格行数据，唯一编辑数据源 |
| `columns` | Column → Row → Item 布局配置 |
| `formProps` | 直接传给 `el-form` |
| `tableProps` | 直接传给 `el-table` |
| `loading` | 表格 loading 状态 |

## 布局

```ts
{
  name: '基本信息',
  props: { minWidth: 400 },       // el-table-column
  children: [{
    props: { gutter: 8 },         // el-row
    children: [{
      key: 'name',
      type: 'input',
      colProps: { span: 12 },     // el-col
      formItemProps: {},          // el-form-item
      component: { props: {} }    // el-input
    }]
  }]
}
```

## 渲染模式

```ts
{ key: 'name', type: 'input' }

{ key: 'phone', component: { is: PhoneInput, props: {} } }

{ key: 'actions', slot: 'actions' }
```

三者互斥，渲染顺序为 `slot`、直接组件、type 映射。

`component.options` 与 `component.optionProps` 用于 select/radio/checkbox；它们和各层 props 都支持函数写法。

```ts
component: {
  options: ({ row }) => cityOptions[row.province] || []
}
```

字段 `visible` 同样支持运行时函数。字段联动不在配置中执行，请监听 `field-change` 后更新业务数据。

列级不提供 `required` 快捷字段。表头标记使用 `headerSlot` 渲染，实际校验配置在字段的 `formItemProps.rules` 中：

```vue
<template #contact-header="{ label }">
  <span class="required-mark">*</span>
  <span>{{ label }}</span>
</template>
```
