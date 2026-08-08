# 配置 API

## FormTable Props

| 属性 | 说明 |
| --- | --- |
| `tableData` | 表格行数据，唯一编辑数据源 |
| `columns` | Column → Row → Item 布局配置 |
| `formProps` | 直接传给 `el-form` |
| `tableProps` | 直接传给 `el-table` |
| `loading` | 表格 loading 状态 |

`rowKey` 是可选能力。普通同步编辑、增删和排序只要保留行对象引用，不需要额外生成唯一 key：

```ts
// 新增、删除都会保留其他行的对象引用。
tableData.value = [...tableData.value, createEmptyRow()]
tableData.value = tableData.value.filter((_, index) => index !== deleteIndex)
```

只有异步回调等待期间可能排序、插入、删除、刷新或重新创建行对象时，才建议通过 `tableProps.rowKey` 提供唯一且稳定的业务行标识：

```vue
<FormTable
  :table-data="tableData"
  :columns="columns"
  :table-props="{ rowKey: 'id', border: true }"
/>
```

`rowKey` 与 Element UI 一致，支持字段路径字符串或函数。

| 使用场景 | 是否需要 `rowKey` |
| --- | --- |
| 普通同步输入和字段联动 | 不需要 |
| 同步新增、删除、排序，且保留行对象引用 | 不需要 |
| 异步期间增删或排序，但仍保留原行对象 | 通常不需要 |
| 异步期间会深拷贝、刷新或替换全部行对象 | 建议配置 |
| 依赖 Element Table 保留选择、树形数据等身份能力 | 按 Element UI 要求配置 |

因此不要仅为了支持新增空行而强制生成 rowKey。简单场景继续使用默认的对象引用定位即可。

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
- Slot 内容直接渲染，不额外生成包装 `div/span`；需要 class 或布局根节点时由 Slot 自己提供。旧的内部 `.form-table-slot`、`.form-table-column-header` 节点已移除。
- 找不到 `component.renderer` 对应的具名 slot 时，字段外层布局仍保留，内容为空。

#### `itemConfig.component` 与 `component`

字段 Slot 会同时收到两份看起来相似的内容，但用途不同：

| 对比 | `itemConfig.component` | Slot `component` |
| --- | --- | --- |
| 语义 | 调用方传入的原始组件配置 | 当前业务数据行的解析结果 |
| `props` | 静态对象或动态函数 | 已解析为可直接 `v-bind` 的对象 |
| `options` | 静态数组或动态函数 | 已解析为当前行的选项数组 |
| `optionProps` | 静态对象或动态函数 | 已解析的字段映射 |
| `listeners` | 原始配置回调，首参要求字段上下文 | 已包装函数，可直接使用 `v-on` |
| 主要用途 | 判断配置来源、读取 `key/type/formItemProps` 等原始信息 | 绑定 Slot 内实际组件 |

```vue
<template #city="{ itemConfig, component, value, setValue }">
  <span>{{ itemConfig.key }}</span>
  <CityEditor
    v-bind="component.props"
    v-on="component.listeners"
    :options="component.options"
    :value="value"
    @input="setValue"
  />
</template>
```

即使原始配置全部是静态值，两者内容可能相近，也应保持上述分工。不要在 Slot 中自行执行 `itemConfig.component.props/options` 函数或手动包装 listeners。

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

### 异步更新与稳定行身份

`row/index/value` 是事件触发时的快照，但该上下文中的 `setValue/updateRow` 会绑定当时的数据行。配置 `tableProps.rowKey` 后，助手每次执行都会在最新 `tableData` 中重新查找行，而不是继续使用旧下标：

```ts
component: {
  listeners: {
    async change({ row, index, setValue }, nextValue) {
      console.log('触发时位置', row.id, index)
      await saveCity(row.id, nextValue)

      // 等待期间即使行被排序或插入，仍按 row.id 更新原数据行。
      setValue(nextValue)
    }
  }
}
```

```ts
const tableProps = {
  rowKey: 'id'
  // 也可以：rowKey: row => row.id
}
```

- `index` 不会变成实时值；它始终表示回调触发时的数据下标。
- `field-change.index` 使用真正执行更新时重新定位到的最新下标。
- 如果等待期间目标 `rowKey` 已不存在，更新助手会忽略本次更新，避免误写其他行。
- 未配置 `rowKey` 时，助手会尝试根据行对象引用定位。同步增删行及保留对象引用的重排都能正常工作；只有业务层重新创建了行对象且无法确认身份时，更新才会被忽略。
- `rowKey` 必须在表内唯一且保持稳定，不应使用当前数组下标。

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

### 实际回传数据示例

以下示例都基于同一行数据和配置：

```ts
const tableData = [{
  id: 1,
  province: 'zhejiang',
  city: 'hangzhou',
  locked: false
}]

const itemConfig = {
  key: 'city-field',
  fieldKey: 'city',
  type: 'slot',
  component: {
    renderer: 'city-editor',
    props: ({ row }) => ({ disabled: row.locked }),
    options: [{ label: '杭州', value: 'hangzhou' }]
  }
}

const rowConfig = {
  key: 'region-row',
  props: { gutter: 8 },
  children: [itemConfig]
}

const columnConfig = {
  key: 'region-column',
  label: '地区',
  children: [rowConfig]
}
```

各字段在运行时的示例值：

| 字段 | 示例值 | 含义 |
| --- | --- | --- |
| `tableData` | `[{ id: 1, province: 'zhejiang', city: 'hangzhou', locked: false }]` | 完整业务数据数组 |
| `row` | `{ id: 1, province: 'zhejiang', city: 'hangzhou', locked: false }` | `tableData[0]` 当前业务数据行 |
| `index` | `0` | 当前业务数据行下标 |
| `fieldKey` | `'city'` | `itemConfig.fieldKey` 字段路径 |
| `value` | `'hangzhou'` | 根据 `row + fieldKey` 读取的当前值 |
| `columnConfig` | 上面的 `region-column` 对象 | 当前原始列配置引用 |
| `rowConfig` | 上面的 `region-row` 对象 | 当前原始布局行配置引用 |
| `itemConfig` | 上面的 `city-field` 对象 | 当前原始字段配置引用 |
| `setValue` | `(nextValue) => void` | 更新当前 `city` 字段 |
| `updateRow` | `(patch) => void` | 合并更新当前第 0 行 |
| `propPath` | `'tableData.0.city'` | `el-form-item` 完整校验路径 |
| `component` | 见下方 Slot 示例 | 当前行解析后的组件配置 |

Column 回调实际收到：

```ts
{
  tableData,
  columnConfig
}
```

Row 回调实际收到：

```ts
{
  tableData,
  columnConfig,
  row: tableData[0],
  index: 0,
  rowConfig
}
```

Item 动态配置实际收到：

```ts
{
  tableData,
  columnConfig,
  row: tableData[0],
  index: 0,
  rowConfig,
  fieldKey: 'city',
  value: 'hangzhou',
  itemConfig
}
```

组件 listener 的第一个参数实际收到：

```ts
{
  tableData,
  columnConfig,
  row: tableData[0],
  index: 0,
  rowConfig,
  fieldKey: 'city',
  value: 'hangzhou',
  itemConfig,
  setValue: Function,
  updateRow: Function
}
```

字段 Slot 实际收到：

```ts
{
  tableData,
  columnConfig,
  row: tableData[0],
  index: 0,
  rowConfig,
  fieldKey: 'city',
  value: 'hangzhou',
  itemConfig,
  setValue: Function,
  updateRow: Function,
  propPath: 'tableData.0.city',
  component: {
    renderer: 'city-editor',
    props: { disabled: false },
    listeners: {},
    options: [{ label: '杭州', value: 'hangzhou' }],
    optionProps: undefined
  }
}
```

表头 Slot 实际收到：

```ts
{
  tableData,
  columnConfig,
  columnIndex: 0,
  label: '地区'
}
```

这里的三个 `*Config` 与调用方传入 `columns` 中的对应对象是同一引用，不是深拷贝；`component` 则是 FormTable 为当前业务数据行生成的新解析结果。

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
