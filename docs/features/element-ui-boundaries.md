# Element UI 能力边界与处理方案

FormTable 在 `el-form` 内组合 `el-table`，并由列配置生成 `el-table-column` 和 `el-form-item`。Element UI 的大部分属性、Table 事件和实例方法仍可使用，但会改变行结构、显示下标或底层 Slot 结构的功能，不一定能与 FormTable 的受控回写和校验路径安全组合。

本页以 Element UI `2.15.14` 为主要对照版本；项目使用支持范围内的其他 `2.x` 版本时，具体原生属性和方法仍以当前安装版本为准。

## 能力概览

| Element UI 入口 | FormTable 入口 | 当前状态 | 关键约束 |
| --- | --- | --- | --- |
| `el-table` Props | `tableProps` | 基本透传 | `data` 由 `tableData` 接管，`row-key` 由顶层 `rowKey` 接管 |
| `el-table` Events | FormTable 根事件 | 运行时透传 | 常用事件提供公开类型 |
| `el-table` Methods | `getTableRef()` | 可用 | 具体方法依赖当前 Element UI 版本 |
| Table `empty/append` Slot | FormTable 同名 Slot | 直接转发 | 不增加 FormTable 上下文 |
| Table 默认 Slot | `columns` | FormTable 接管 | 不能手写插入 `el-table-column` |
| `el-table-column` Props | `columns[].props` | 基本透传 | 布局列和 `cellSlot` 列的单元格内容由 FormTable 接管 |
| `el-form` Props | `formProps` | 基本透传 | `model` 固定为 `{ tableData }` |
| `el-form` `validate` Event | `form-validate` | 直接转发 | `propPath` 是包含动态行下标的完整路径 |
| `el-form` Methods | FormTable Ref / `getFormRef()` | 可用 | `resetFields()` 会绕过受控回写 |
| `el-form-item` Props | Item `formItemProps` | 基本透传 | `prop` 由 `fieldKey` 和行下标自动生成 |
| FormItem `label/error` Slot | Item `labelSlot/errorSlot` | 按名称转发 | 缺少对应具名 Slot 时保留原生内容 |

## 可直接使用的 Element Table 能力

以下能力不改变 FormTable 的数据定位模型，可继续按 Element UI 原生用法配置：

- `height/maxHeight/stripe/border/fit/showHeader`；
- 行、单元格和表头的 class/style 回调；
- `selection/index/expand` 功能列；
- 固定列、列宽、对齐、溢出 Tooltip 和列宽拖动；
- `spanMethod` 单元格合并；
- `showSummary/sumText/summaryMethod` 汇总行；
- `emptyText`、`#empty` 和 `#append`；
- 当前行、选择变化、表头和单元格事件。

```ts
const tableProps = {
  border: true,
  maxHeight: 560,
  showSummary: true,
  summaryMethod,
  spanMethod
}

const columns = [
  { props: { type: 'selection', width: 48 } },
  { label: '序号', props: { type: 'index', width: 64 } },
  {
    label: '金额',
    props: { prop: 'amount', minWidth: 140, sortable: 'custom' },
    formItems: [{ fieldKey: 'amount', type: 'number' }]
  }
]
```

单元格合并仍需要遵守被覆盖单元格不会挂载 FormItem 的约束，见[单元格合并业务处理](../examples/cell-merge.md)。

## 内置排序、筛选与校验下标

FormTable 使用当前行在受控 `tableData` 中的数据源下标生成校验路径：

```text
tableData.{rowIndex}.{fieldKey}
```

Element UI 内置排序或筛选只改变显示顺序。FormTable 会按行引用映射回原始数据源位置，因此字段更新和 FormItem 校验仍指向同一行。字段、listener 和 Slot 上下文中的 `index` 表示数据源下标，`displayIndex` 表示当前显示下标。

本地排序与筛选不会改变父组件持有的 `tableData` 顺序。如果提交结果必须按界面顺序排列，或筛选需要服务端参与，仍应使用 `sortable: 'custom'`、`sort-change/filter-change` 在业务层生成新的受控数据。父组件替换数据后，两个下标会随下一次渲染重新计算。

同一个行对象不应在 `tableData` 中重复出现。重复引用经过排序或筛选后可能无法唯一映射；FormTable 会在开发环境警告，并停止为无法定位的字段绑定校验路径，避免校验到错误行。

## 树形数据与懒加载

### 能力边界

`treeProps/lazy/load/indent` 可以继续传给 Element Table，但 FormTable 的受控更新只在顶层 `tableData` 中定位行，校验路径也只表示顶层数组下标。因此：

- 使用原生列做纯展示的树形 Table 可以正常展开；
- 嵌套子行不能安全使用 FormTable 字段更新和 FormItem 校验；
- 懒加载子行也不会自动进入 FormTable 的顶层受控数组。

### 当前处理方案

需要直接在表格中编辑时，将树数据预先拉平，并保留 `parentId/level` 等业务字段：

```ts
function flattenRows(nodes, level = 0, parentId = null) {
  return nodes.flatMap(node => {
    const current = { ...node, level, parentId }
    const children = flattenRows(node.children || [], level + 1, node.id)
    delete current.children
    return [current, ...children]
  })
}
```

列内根据 `row.level` 增加缩进或层级标识，提交时再按 `id/parentId` 还原业务结构。

如果必须保留原生树展开和懒加载体验，更稳妥的方案是：

1. 树形区域使用独立 `el-table` 纯展示和选中节点；
2. 将选中节点的编辑放到右侧表单、Dialog 或只接收扁平数据的 FormTable 中；
3. 保存后由业务层更新树节点。

## 多级表头

### 能力边界

FormTable 不递归渲染嵌套 `el-table-column`。`columns[].formItems` 表示单元格中的表单字段。根级 Table 默认 Slot 也已由 FormTable 接管，不能在 FormTable 内手写嵌套列。未来若支持多级表头，可考虑使用 `children` 表示子列。

### 当前处理方案

仅需要在单列中展示分组语义时，可使用扁平化列标签或 `headerSlot`：

```ts
const columns = [
  { label: '费用 / 单价', formItems: [{ fieldKey: 'price', type: 'number' }] },
  { label: '费用 / 数量', formItems: [{ fieldKey: 'quantity', type: 'number' }] }
]
```

`headerSlot` 可以渲染两行文本、图标或 Tooltip，但仍然是一个独立表头单元格，不会产生跨列合并。

必须使用真实分组表头时，当前应使用独立 `el-table` 手写嵌套 `el-table-column`，并将编辑单元格抽成可复用业务组件，而不是用 CSS 模拟跨列表头。

## Form 校验事件和方法

### 当前入口

FormTable Ref 直接提供：

```ts
await formTableRef.value?.validate()
formTableRef.value?.clearValidate()
```

单字段校验和其他原生 Form 方法通过 `getFormRef()` 调用：

```ts
formTableRef.value
  ?.getFormRef()
  ?.validateField('tableData.0.name', message => {
    if (message) console.warn(message)
  })
```

### `validate` 事件处理

使用 `form-validate` 监听 `el-form` 的逐字段校验结果，参数顺序保持为 `(propPath, valid, message)`：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  @form-validate="handleFieldValidate"
/>
```

```ts
function handleFieldValidate(propPath, valid, message) {
  console.log(propPath, valid, message)
}
```

这里保留完整 `propPath`，例如 `tableData.0.profile.name`。组件不额外推导 `row/fieldKey`，避免动态行移动、嵌套路径和重复字段配置产生歧义。

顶层也不新增 `validateField(fieldKey)`：Element 原生方法要求完整 `propPath`，而 FormTable 的路径包含动态行下标。明确知道当前完整路径时，仍可通过 `getFormRef().validateField(propPath)` 调用；常规提交优先使用 `validate()`。

### 受控重置

`getFormRef().resetFields()` 会直接修改 Form model，不会发出 `update:tableData` 或 `field-change`。应由页面保存业务初始值，重置受控数据后清除校验：

```ts
const initialRows = cloneDeep(tableData.value)

async function resetTable() {
  tableData.value = cloneDeep(initialRows)
  await nextTick()
  formTableRef.value?.clearValidate()
}
```

完整的动态行校验处理见[校验、清理与重置](./validation-reset.md)。

## FormItem 自定义 Label 和 Error

### 属性方案

文本 Label、外部错误和校验状态可直接使用 `formItemProps`：

```ts
{
  fieldKey: 'name',
  type: 'input',
  formItemProps: {
    label: '姓名',
    error: serverErrors.name,
    validateStatus: serverErrors.name ? 'error' : ''
  }
}
```

### Slot 方案

使用 `labelSlot/errorSlot` 引用 FormTable 上的具名 Slot：

```vue
<FormTable v-model="tableData" :columns="columns">
  <template #name-label="{ row, fieldKey }">
    <span>{{ row.vip ? 'VIP 姓名' : '姓名' }}（{{ fieldKey }}）</span>
  </template>
  <template #name-error="{ error, setValue }">
    <span class="business-error">{{ error }}</span>
    <el-button type="text" @click="setValue('未命名')">使用默认值</el-button>
  </template>
</FormTable>
```

```ts
const columns = [{
  label: '人员',
  formItems: [{
    fieldKey: 'name',
    type: 'input',
    labelSlot: 'name-label',
    errorSlot: 'name-error',
    formItemProps: {
      label: '姓名',
      rules: [{ required: true, message: '请输入姓名' }]
    }
  }]
}]
```

Label Slot 获得字段操作上下文和 `propPath`；Error Slot 再增加 Element 当前的 `error` 文本。未提供配置名称对应的 Slot 时，Element 会继续使用 `formItemProps.label/error`。自定义 Label 会替换原生文本，因此需要后缀时应在 Slot 内自行输出；Error Slot 只在错误内容实际展示时挂载。

只有需要完全接管 FormItem 结构时才使用 `cellSlot` 手写 `el-form-item`。此时必须使用 `tableData.${index}.${fieldKey}` 形式的完整 `prop`，值更新仍使用 `updateRow`，不要直接修改 `row`。

## Column formatter 和原生 Slot 上下文

纯原生列没有 FormTable 单元格 scoped Slot，因此 `columns[].props.formatter` 可以正常接管文本显示。布局列和 `cellSlot` 列已由 FormTable 提供 scoped Slot，不应再依赖 Element Column `formatter`。

| 目标 | 当前方案 |
| --- | --- |
| 纯文本原生列格式化 | `NativeColumnConfig.props.formatter` |
| FormTable 字段格式化 | `type: 'text'` 的字段 props、自定义组件或字段 Slot |
| 整个单元格的组合展示 | `cellSlot` |
| Element 原始表头 `{ column, $index }` | `columns[].props.renderHeader` |
| FormTable 表头配置上下文 | `columns[].headerSlot` |

`cellSlot` 暴露 `row/index/displayIndex/columnConfig/updateRow`，不暴露 Element Table 内部 `store` 和运行时 Column 对象。业务操作应优先使用 Slot 上下文和 FormTable Ref，避免依赖 Element UI 内部状态。

## 事件和方法的类型边界

Element Table 原生事件在运行时会继续透传。`sort-change/filter-change/header-*/cell-*/select*` 以及常用的 `current-change`、`row-click/row-dblclick/row-contextmenu`、`expand-change` 都已加入公开 `FormTableEmits` 类型。其他低频或不同 Element UI 版本签名不一致的事件仍可在运行时监听，TypeScript 页面可为自己的 handler 显式标注当前项目实际参数。

Table 原生方法通过 `getTableRef()` 调用：

```ts
const tableRef = formTableRef.value?.getTableRef()
tableRef?.toggleRowSelection(tableData.value[0], true)
tableRef?.setCurrentRow(tableData.value[0])
tableRef?.clearSort()
tableRef?.clearFilter()
tableRef?.doLayout()
```

部分细分签名受 Element UI 自身类型声明限制。例如某些版本运行时允许 `clearFilter(columnKeys)`，但类型可能只声明无参形式；此类差异以项目安装的 Element UI 版本为准。

## 选型建议

| 需求 | 建议 |
| --- | --- |
| 扁平数据、多字段编辑、校验 | 直接使用 FormTable |
| 选择、序号、展开、固定列 | 通过 `columns[].props` 使用 Element 原生能力 |
| 排序、筛选后继续编辑和校验 | 页面重排或替换受控 `tableData` |
| 可编辑树形数据 | 拉平后编辑，或树展示与节点编辑分离 |
| 真实多级表头 | 使用独立 `el-table` |
| FormItem 复杂 Label/Error | 使用 Item `labelSlot/errorSlot`；完全接管结构时再用 `cellSlot` |
| 虚拟滚动 | 当前不支持；先使用分页或按需编辑 |

性能和虚拟滚动的详细取舍见[性能与大数据量](./performance.md)和[性能优化建议](./performance-optimization.md)。
