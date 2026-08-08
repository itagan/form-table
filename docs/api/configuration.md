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
      key: 'primary-name',        // 可选，稳定渲染身份
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
- Item 的 `key` 是可选渲染身份，`fieldKey` 是必填的数据路径；`colProps` 与 `formItemProps` 分别传给 `el-col` 和 `el-form-item`。
- 动态增删、排序、切换渲染器或重复使用同一 `fieldKey` 时建议提供稳定的 Item `key`；否则默认使用 `fieldKey`。

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
| `columnConfig` | 当前原始 `ColumnConfig` |
| `rowConfig` | 当前原始 `RowConfig`，与业务数据 `row` 含义不同 |
| `itemConfig` | 当前原始 `FormItemConfig` |

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

## 运行时上下文

上下文字段按职责分为四类：

| 类别 | 字段 | 说明 |
| --- | --- | --- |
| 业务数据 | `tableData`、`row`、`index`、`fieldKey`、`value` | `row` 沿用 Element UI 语义，表示 `tableData[index]`，不命名为 `rowData` |
| 原始配置 | `columnConfig`、`rowConfig`、`itemConfig` | 返回当前 Column → Row → Item 配置路径 |
| 更新能力 | `setValue`、`updateRow` | 只在字段 listener 和 Slot 等可执行上下文中提供 |
| 解析结果 | `component`、`propPath` | 只在字段 Slot 中提供；`component` 已针对当前数据行解析 |

数据与配置使用明确的成对命名：

```text
row          当前业务数据行
rowConfig    当前 el-row 布局配置

itemConfig   当前原始字段配置
component    当前行解析后的组件配置
```

上下文按渲染层级逐步增加，不使用空对象或无效下标补齐：

| 使用位置 | 可用上下文 |
| --- | --- |
| Column `visible/props` | `tableData`、`columnConfig` |
| Row `visible/props` | Column 上下文 + `row/index/rowConfig` |
| Item 动态配置 | Row 上下文 + `fieldKey/value/itemConfig` |
| `component.listeners` | Item 上下文 + `setValue/updateRow` |
| 字段 Slot | listener 上下文 + `propPath/component` |
| 表头 Slot | `tableData/columnConfig/columnIndex/label` |

`columnConfig/rowConfig/itemConfig` 是渲染或事件触发时的浅只读配置引用。不要直接修改，也不要在异步流程结束后假定它仍是最新配置；动态调整应由调用方基于稳定 `key` 替换 `columns`。

### 各回调上下文速查

先定义四层上下文内容：

```text
ColumnContext = tableData, columnConfig
RowContext    = ColumnContext + row, index, rowConfig
ItemContext   = RowContext + fieldKey, value, itemConfig
ActionContext = ItemContext + setValue, updateRow
```

不同配置回调使用的上下文和返回值如下：

| 回调位置 | 接收的上下文 | 回调返回值 |
| --- | --- | --- |
| `column.visible` | ColumnContext | 是否渲染当前列 `boolean` |
| `column.props` | ColumnContext | 传给 `el-table-column` 的 props |
| `rowConfig.visible` | RowContext | 是否渲染当前布局行 `boolean` |
| `rowConfig.props` | RowContext | 传给 `el-row` 的 props |
| `itemConfig.visible` | ItemContext | 是否渲染当前字段 `boolean` |
| `itemConfig.colProps` | ItemContext | 传给 `el-col` 的 props |
| `itemConfig.formItemProps` | ItemContext | 传给 `el-form-item` 的 props |
| `component.props` | ItemContext | 传给实际字段组件的 props |
| `component.options` | ItemContext | select/radio/checkbox 等使用的选项数组 |
| `component.optionProps` | ItemContext | 选项的 label/value/disabled/key 字段映射 |
| `component.listeners[event]` | ActionContext；后续参数为组件原始事件参数 | 无需返回值，通过更新助手修改数据 |

Column 回调示例：

```ts
{
  key: 'contact-column',
  label: '联系人',
  visible: ({ tableData, columnConfig }) => {
    return columnConfig.key === 'contact-column' && tableData.length > 0
  },
  props: ({ tableData }) => ({
    minWidth: tableData.length > 5 ? 360 : 280
  })
}
```

Row 回调示例：

```ts
{
  key: 'contact-row',
  visible: ({ row, index, columnConfig, rowConfig }) => {
    console.log(columnConfig.key, rowConfig.key, index)
    return row.hidden !== true
  },
  props: ({ row }) => ({
    gutter: row.compact ? 4 : 12
  })
}
```

Item 动态配置示例：

```ts
{
  key: 'city-field',
  fieldKey: 'city',
  type: 'select',
  visible: ({ row, value, itemConfig }) => {
    return itemConfig.key === 'city-field' && Boolean(row.province) && value !== 'disabled'
  },
  colProps: ({ index }) => ({ span: index === 0 ? 12 : 8 }),
  formItemProps: ({ row }) => ({ label: row.cityLabel || '城市' }),
  component: {
    props: ({ row }) => ({ disabled: row.locked }),
    options: ({ row }) => cityOptions[row.province] || [],
    optionProps: () => ({ label: 'name', value: 'code' })
  }
}
```

组件事件回调示例：

```ts
component: {
  listeners: {
    change(
      {
        row,
        index,
        fieldKey,
        value,
        columnConfig,
        rowConfig,
        itemConfig,
        setValue,
        updateRow
      },
      nextValue
    ) {
      console.log('事件来源', columnConfig.key, rowConfig.key, itemConfig.key)
      console.log('修改前', row, index, fieldKey, value)
      setValue(nextValue)
      updateRow({ touched: true })
    }
  }
}
```

组件执行 `$emit('change', nextValue)` 时，配置回调依次收到 `ActionContext, nextValue`。`value` 是事件执行时的当前值，`nextValue` 才是组件传出的新值。

### 动态显隐

`visible` 可传布尔值或返回布尔值的函数，并在响应式依赖变化时重新计算：

| 配置层级 | 影响范围 | 对应上下文层级 |
| --- | --- | --- |
| Column `visible` | 整个 `el-table-column` | Column |
| Row `visible` | 当前单元格内的一整行 `el-row` | Row |
| Item `visible` | 当前 `el-col` 和字段内容 | Item |

```ts
const columns: ColumnConfig[] = [{
  label: '补充信息',
  // 表格没有任何需要补充信息的数据时，隐藏整列。
  visible: ({ tableData, columnConfig }) => {
    return columnConfig.key !== 'disabled' && tableData.some(row => row.showExtra)
  },
  children: [{
    // 只在当前行开启补充信息时渲染这一行布局。
    visible: ({ row, rowConfig }) => rowConfig.key !== 'disabled' && row.showExtra === true,
    children: [{
      fieldKey: 'detail',
      type: 'textarea',
      // 再根据当前行状态控制单个字段。
      visible: ({ row, itemConfig }) => itemConfig.key !== 'disabled' && row.detailType !== 'none'
    }]
  }]
}]
```

- 隐藏只影响渲染，不会清空 `tableData` 中已有的字段值。
- Item 隐藏时对应的 `el-col` 与 `el-form-item` 不会渲染；Row 或 Column 隐藏时，其子级也不会渲染。
- 如需在关闭字段时清空值或联动其他字段，请在业务事件中更新数据，例如监听 `field-change`，不要在 `visible` 函数中产生副作用。
- `visible` 应保持为纯判断函数；布局变化可配合动态 `colProps` 调整剩余字段的栅格宽度。

### 完整配置示例

```ts
const columns: ColumnConfig[] = [{
  label: '联系人',

  // Column：当前没有具体数据行，只提供整张表的数据。
  visible: ({ tableData, columnConfig }) => {
    return columnConfig.key !== 'hidden' && tableData.length > 0
  },
  props: ({ tableData, columnConfig }) => ({
    className: columnConfig.key,
    minWidth: tableData.length > 5 ? 360 : 280
  }),

  children: [{
    // Row：row 是当前数据行，index 是它在 tableData 中的下标。
    visible: ({ row, rowConfig }) => rowConfig.key !== 'hidden' && row.hidden !== true,
    props: ({ row, index, rowConfig }) => ({
      gutter: row.compact ? 4 : 12,
      class: `${rowConfig.key || 'contact-row'}-${index}`
    }),

    children: [{
      fieldKey: 'city',
      type: 'select',

      // Item：fieldKey 是当前字段路径，不是 ColumnConfig 对象。
      visible: ({ row, fieldKey, value, itemConfig }) => {
        return itemConfig.key !== 'hidden' && fieldKey === 'city' && Boolean(row.province) && value !== 'disabled'
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
            { row, index, fieldKey, value, itemConfig, setValue, updateRow },
            nextValue
          ) {
            console.log('修改前', row, index, fieldKey, value, itemConfig.key)
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

- `fieldKey` 是当前字段路径，例如 `city` 或 `profile.city`。
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
<template #contact-header="{ label, columnConfig }">
  <span class="required-mark">*</span>
  <span :data-column-key="columnConfig.key">{{ label }}</span>
</template>
```

表头 slot 使用 `columnConfig` 返回当前原始列配置。
