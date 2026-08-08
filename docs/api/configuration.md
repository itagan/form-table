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
  label: '基本信息',
  props: { minWidth: 400 },       // el-table-column
  children: [{
    props: { gutter: 8 },         // el-row
    children: [{
      fieldKey: 'name',
      type: 'input',
      colProps: { span: 12 },     // el-col
      formItemProps: {},          // el-form-item
      component: { props: {} }    // el-input
    }]
  }]
}
```

- Column 的 `label` 是表头文本，`props` 直接传给 `el-table-column`。
- Row 的 `props` 直接传给 `el-row`。
- Item 的 `fieldKey` 是行数据路径；`colProps` 与 `formItemProps` 分别传给 `el-col` 和 `el-form-item`。

## 渲染模式

```ts
{ fieldKey: 'name', type: 'input' }

{ fieldKey: 'phone', component: { is: PhoneInput, props: {} } }

{ fieldKey: 'actions', slot: 'actions' }
```

TypeScript 配置要求三种模式互斥。对于未经类型检查的 JavaScript 或远程 JSON 冲突配置，运行时采用固定优先级：

```text
slot > component.is > type > 字段值展示
```

开发环境只会对同一个冲突配置警告一次。`component` 仅包含 props/options/listeners、没有 `is` 时，仍然是 `type` 模式的组件参数，不算模式冲突。

`component.options` 与 `component.optionProps` 用于 select/radio/checkbox；它们和各层 props 都支持函数写法。

```ts
component: {
  options: ({ row }) => cityOptions[row.province] || []
}
```

字段 `visible` 同样支持运行时函数。字段联动不在配置中执行，请监听 `field-change` 后更新业务数据。

动态函数只接收当前层级有意义的信息：Column 只有 `tableData`，Row 增加 `row/index`，Field 再增加 `fieldKey`。组件 listener 另外获得 `value/setValue/updateRow`。不会用空 row、`index = -1` 等占位值补齐上下文。

## 远程 JSON 与本地增强

远程 schema 只承载可序列化配置，例如布局、`type`、静态 props 和 options。组件对象、函数 listener 和 slot 实现留在页面本地，不执行服务端返回的代码。

```ts
const remoteColumns = await fetchColumns()

const columns = enhanceFormTableColumns(remoteColumns, {
  phone(item) {
    const { type, component, ...layout } = item
    return {
      ...layout,
      component: {
        is: PhoneInput,
        props: component?.props,
        listeners: {
          change(context, value) {
            context.setValue(value)
          }
        }
      }
    }
  }
})
```

`enhanceFormTableColumns` 是调用方的递归映射函数，示例实现在 playground；组件核心不维护业务组件注册表。

列级不提供 `required` 快捷字段。表头标记使用 `headerSlot` 渲染，实际校验配置在字段的 `formItemProps.rules` 中：

```vue
<template #contact-header="{ label }">
  <span class="required-mark">*</span>
  <span>{{ label }}</span>
</template>
```
