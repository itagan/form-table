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

{
  fieldKey: 'phone',
  type: 'component',
  component: { renderer: PhoneInput, props: {} }
}

{
  fieldKey: 'actions',
  type: 'slot',
  component: {
    renderer: 'actions',
    props: ({ row }) => ({ disabled: row.locked })
  }
}
```

`type` 是唯一渲染策略：

```text
input/select/...  → 内置 Element UI 映射
component         → component.renderer 动态组件
slot              → component.renderer 具名 slot
```

三种模式共用 `component.props/options/optionProps/listeners`。slot 模式通过上下文返回同名的解析后 `component`，FormTable 不主动绑定：

```vue
<template #city="{ value, setValue, component }">
  <CityPicker
    v-bind="component.props"
    v-on="component.listeners"
    :value="value"
    :options="component.options"
    :option-props="component.optionProps"
    @input="setValue"
  />
</template>
```

### Slot 模式

Slot 适合需要完全控制模板结构，或需要组合多个组件的字段。FormTable 仍负责外层 `el-col`、`el-form-item`、校验路径和字段更新，但不会猜测 slot 内部组件应该如何接收值、选项或事件。

```ts
{
  fieldKey: 'score',
  type: 'slot',
  colProps: { span: 12 },
  formItemProps: { label: '评分' },
  component: {
    renderer: 'score-editor',
    props: ({ row }) => ({ disabled: row.locked }),
    options: [{ label: '推荐', value: 5 }],
    listeners: {
      commit({ row, value, updateRow }, source) {
        console.log('提交评分', row, value, source)
        updateRow({ scoreCommitted: true })
      }
    }
  }
}
```

```vue
<FormTable :table-data="tableData" :columns="columns">
  <template
    #score-editor="{
      row,
      index,
      fieldKey,
      propPath,
      value,
      setValue,
      updateRow,
      component
    }"
  >
    <el-rate
      v-bind="component.props"
      v-on="component.listeners"
      :value="value"
      @input="setValue"
    />
  </template>
</FormTable>
```

Slot 上下文说明：

| 字段 | 含义 |
| --- | --- |
| `row/index` | 当前数据行及其在 `tableData` 中的下标 |
| `fieldKey` | 配置中的字段路径 |
| `propPath` | `el-form-item` 使用的完整校验路径，例如 `tableData.0.score` |
| `value` | 当前字段值 |
| `setValue(value)` | 更新当前字段，支持嵌套路径，并触发 `update:tableData` 与 `field-change` |
| `updateRow(patch)` | 合并更新当前行的多个字段 |
| `component` | 解析后的 `renderer/props/listeners/options/optionProps` |

- `component.renderer` 只用于定位具名 slot；不会在 slot 内再次渲染组件。
- `component.props` 等配置不会自动透传，调用方按自定义组件接口选择性绑定。
- `component.listeners` 已包装字段上下文，使用 `v-on="component.listeners"` 后，slot 内组件触发同名事件即可调用配置回调。
- 找不到 `component.renderer` 对应的具名 slot 时，字段外层布局仍保留，内容为空。

`component.options` 与 `component.optionProps` 用于 select/radio/checkbox；它们和各层 props 都支持函数写法。

```ts
component: {
  options: ({ row }) => cityOptions[row.province] || []
}
```

字段 `visible` 同样支持运行时函数。字段联动不在配置中执行，请监听 `field-change` 后更新业务数据。

动态函数只接收当前层级有意义的信息：Column 只有 `tableData`，Row 增加 `row/index`，Field 再增加 `fieldKey/value`。组件 listener 另外获得 `setValue/updateRow`。不会用空 row、`index = -1` 等占位值补齐上下文。

### 动态显隐

`visible` 可传布尔值或返回布尔值的函数，并在响应式依赖变化时重新计算：

| 配置层级 | 影响范围 | 函数上下文 |
| --- | --- | --- |
| Column `visible` | 整个 `el-table-column` | `tableData` |
| Row `visible` | 当前单元格内的一整行 `el-row` | `tableData`、`row`、`index` |
| Item `visible` | 当前 `el-col` 和字段内容 | `tableData`、`row`、`index`、`fieldKey`、`value` |

```ts
const columns: ColumnConfig[] = [{
  label: '补充信息',
  // 表格没有任何需要补充信息的数据时，隐藏整列。
  visible: ({ tableData }) => tableData.some(row => row.showExtra),
  children: [{
    // 只在当前行开启补充信息时渲染这一行布局。
    visible: ({ row }) => row.showExtra === true,
    children: [{
      fieldKey: 'detail',
      type: 'textarea',
      // 再根据当前行状态控制单个字段。
      visible: ({ row }) => row.detailType !== 'none'
    }]
  }]
}]
```

- 隐藏只影响渲染，不会清空 `tableData` 中已有的字段值。
- Item 隐藏时对应的 `el-col` 与 `el-form-item` 不会渲染；Row 或 Column 隐藏时，其子级也不会渲染。
- 如需在关闭字段时清空值或联动其他字段，请在业务事件中更新数据，例如监听 `field-change`，不要在 `visible` 函数中产生副作用。
- `visible` 应保持为纯判断函数；布局变化可配合动态 `colProps` 调整剩余字段的栅格宽度。

## 动态上下文使用示例

```ts
const columns: ColumnConfig[] = [{
  label: '联系人',

  // Column：当前没有具体数据行，只提供整张表的数据。
  visible: ({ tableData }) => tableData.length > 0,
  props: ({ tableData }) => ({
    minWidth: tableData.length > 5 ? 360 : 280
  }),

  children: [{
    // Row：row 是当前数据行，index 是它在 tableData 中的下标。
    visible: ({ row }) => row.hidden !== true,
    props: ({ row, index }) => ({
      gutter: row.compact ? 4 : 12,
      class: `contact-row-${index}`
    }),

    children: [{
      fieldKey: 'city',
      type: 'select',

      // Item：fieldKey 是当前字段路径，不是 ColumnConfig 对象。
      visible: ({ row, fieldKey, value }) => {
        return fieldKey === 'city' && Boolean(row.province) && value !== 'disabled'
      },
      colProps: ({ index }) => ({ span: index === 0 ? 12 : 8 }),
      formItemProps: ({ row }) => ({
        label: row.cityLabel || '城市'
      }),

      component: {
        props: ({ row }) => ({
          disabled: row.locked,
          placeholder: `请选择${row.cityLabel || '城市'}`
        }),
        options: ({ row }) => cityOptions[row.province] || [],
        listeners: {
          change(
            { row, index, fieldKey, value, setValue, updateRow },
            nextValue
          ) {
            console.log('修改前', row, index, fieldKey, value)
            // 同一同步回调中可以安全组合两个更新助手。
            setValue(nextValue)
            updateRow({ cityTouched: true })
          }
        }
      }
    }]
  }]
}]
```

- `row` 是 `tableData[index]` 对应的数据行，不是 `RowConfig`。
- `fieldKey` 是当前字段路径，例如 `city` 或 `profile.city`，不是列配置对象。
- 动态上下文不会返回完整的 `ColumnConfig`、`RowConfig` 或 `FormItemConfig`。
- `value` 是回调执行时的当前字段值；组件事件产生的新值仍位于上下文之后，例如上面的 `nextValue`。
- 回调中的 `row/tableData` 用于读取；字段更新使用 `setValue` 或 `updateRow`。两者在同一同步调用链中连续使用时，后一次更新会基于前一次结果继续计算。
- 组件原始事件参数保持在字段上下文之后，例如上面的 `nextValue`。

## 远程 JSON 与本地增强

远程 schema 只承载可序列化配置，例如布局、`type`、静态 props 和 options。组件对象、函数 listener 和 slot 实现留在页面本地，不执行服务端返回的代码。

```ts
const remoteColumns = await fetchColumns()

const columns = enhanceFormTableColumns(remoteColumns, {
  phone(item) {
    const { type, component, ...layout } = item
    return {
      ...layout,
      type: 'component',
      component: {
        renderer: PhoneInput,
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
