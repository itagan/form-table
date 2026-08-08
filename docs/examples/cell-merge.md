# 单元格合并业务处理示例

> 可运行 Demo：[打开单元格合并调试页 ↗](http://localhost:5173/cell-merge)

本示例配合 Playground 的 `/cell-merge` 页面，说明如何通过 `tableProps.spanMethod` 实现纵向分组合并和横向汇总行，以及表单数据、校验和提交阶段需要遵守的约束。

可运行源码位于 `playground/src/views/CellMergeView.vue`。

## 合并的渲染机制

FormTable 将 `tableProps` 透传给 Element UI 的 `el-table`。被合并覆盖的位置返回 `{ rowspan: 0, colspan: 0 }` 时，Element UI 直接跳过该单元格：

- 不创建 `<td>`。
- 不调用该列的单元格渲染函数。
- 不挂载 FormTableRow、FormItem 和内部业务组件。
- 不注册被覆盖 FormItem 的校验规则。
- 不保留业务组件的内部状态和生命周期。

锚点单元格只使用锚点行的上下文，不会自动代表或校验同组的其他行。底层 `tableData` 不会被删除，被覆盖行的数据仍然存在。

## 使用稳定列标识

给参与合并的顶层列透传 `prop`，在 `spanMethod` 中使用 `column.property` 判断目标列：

```ts
const columns: ColumnConfig[] = [
  {
    key: 'department',
    label: '采购部门',
    props: {
      prop: 'departmentName',
      width: 160
    },
    children: [{
      children: [{
        fieldKey: 'departmentName',
        type: 'text'
      }]
    }]
  }
]
```

不建议只使用 `columnIndex`。选择列、序号列、固定列和动态显隐都可能改变实际可见列下标。

## 纵向分组合并

### 使用独立分组标识

不要直接使用正在编辑的字段作为分组身份。为数据增加稳定的 `mergeGroupId`：

```ts
interface PurchaseRow extends TableRow {
  id: string
  mergeGroupId: string
  departmentCode: string
  departmentName: string
  itemName: string
}
```

如果直接按 `departmentCode` 分组，编辑锚点部门后可能立即拆散原分组。`mergeGroupId` 只描述哪些行共享一个合并单元格，业务字段可以独立变化后再同步。

### 预先计算 rowspan

Element UI 会为每个可见单元格调用 `spanMethod`。不要在函数中重复向前、向后扫描整个数组，应在数据变化后一次性计算跨度：

```ts
const createRowSpans = (
  rows: readonly PurchaseRow[],
  getGroupKey: (row: PurchaseRow) => string
) => {
  const spans = new Array(rows.length).fill(0)

  for (let start = 0; start < rows.length;) {
    let end = start + 1

    while (
      end < rows.length &&
      getGroupKey(rows[end]) === getGroupKey(rows[start])
    ) {
      end += 1
    }

    spans[start] = end - start
    start = end
  }

  return spans
}

const departmentSpans = computed(() => (
  createRowSpans(tableData.value, row => row.mergeGroupId)
))
```

跨度只合并连续行。同一 `mergeGroupId` 被其他分组隔开时会形成多个独立区块，因此排序后要保证同组数据仍然连续。

```ts
const spanMethod = ({ column, rowIndex }) => {
  if (column.property !== 'departmentName') return

  const rowspan = departmentSpans.value[rowIndex]
  return rowspan > 0
    ? { rowspan, colspan: 1 }
    : { rowspan: 0, colspan: 0 }
}
```

## 纵向合并字段的数据一致性

对于纵向合并字段，推荐维护以下业务约束：

```text
同一个 mergeGroupId 内，所有行的共享字段值等于锚点行的字段值。
```

例如部门列合并三行时，三行的 `departmentCode` 和 `departmentName` 都应保存相同值，而不是只有第一行有值。

### 编辑时立即同步

如果锚点单元格可编辑，建议关闭自动 model，通过 props 传入当前值，并在 listener 中一次更新整个分组：

```ts
const setGroupDepartment = (
  mergeGroupId: string,
  department: { code: string; name: string }
) => {
  tableData.value = tableData.value.map(row => (
    row.mergeGroupId === mergeGroupId
      ? {
          ...row,
          departmentCode: department.code,
          departmentName: department.name
        }
      : row
  ))
}

const departmentComponent = {
  renderer: DepartmentSelector,
  model: false,
  props: ({ value }) => ({
    selectedCode: value
  }),
  listeners: {
    'department-change'({ row }, department) {
      setGroupDepartment(row.mergeGroupId, department)
    }
  }
}
```

立即同步可以保证计算、筛选、导出和其他字段联动始终读取到一致数据。

### 提交前再次归一化

提交前可以根据每组第一行再次覆盖共享字段，作为接口载荷的最终保护：

```ts
const normalizeMergedDepartments = (rows: PurchaseRow[]) => {
  const groupValues = new Map<string, {
    departmentCode: string
    departmentName: string
  }>()

  rows.forEach(row => {
    if (!groupValues.has(row.mergeGroupId)) {
      groupValues.set(row.mergeGroupId, {
        departmentCode: row.departmentCode,
        departmentName: row.departmentName
      })
    }
  })

  return rows.map(row => ({
    ...row,
    ...groupValues.get(row.mergeGroupId)
  }))
}

const payload = normalizeMergedDepartments(tableData.value)
await purchaseApi.submit(payload)
```

推荐采用“编辑时立即同步，提交前再次归一化”的组合。只在提交时处理虽然可行，但页面运行期间隐藏行可能保存旧值，容易影响金额计算、筛选或导出。

## 横向汇总行

横向合并通常是组合展示，不代表被覆盖列与锚点列具有相同数据：

```ts
const spanMethod = ({ row, column }) => {
  if (row.rowType !== 'summary') return

  if (column.property === 'itemDisplay') {
    return { rowspan: 1, colspan: 3 }
  }

  if (['quantity', 'amountDisplay'].includes(column.property || '')) {
    return { rowspan: 0, colspan: 0 }
  }
}
```

例如“物料、数量、金额”合并显示部门小计时：

- `itemDisplay` 可以保存格式化后的汇总说明。
- 明细行的数量和金额仍按原始结构保留。
- 不要把锚点展示文本复制到数量或金额字段。
- 接口需要小计数据时，应由原始明细重新计算，或使用独立 summary 数据结构。

## 校验策略

### 组内共享规则

部门必填等组内完全一致的规则，可以只校验锚点组件。锚点通过后同步给全组，不需要为覆盖行挂载重复 FormItem。

### 行级差异规则

如果规则依赖每行其他字段，例如“特定物料只能选择指定采购组织”，只校验锚点不够。提交前应对整个分组执行明确的业务校验：

```ts
const validateDepartmentCompatibility = (rows: PurchaseRow[]) => {
  return rows.every(row => canPurchase(row.itemId, row.departmentCode))
}
```

不要假设被覆盖行仍会执行 `formItemProps.rules`，因为这些 FormItem 并未挂载。

## 动态操作注意事项

### 开关合并

动态关闭合并后，被覆盖单元格会重新挂载。重新开启时又会卸载。因此组件值必须写入 `tableData`，不能只保存在组件内部状态中。

### 新增和复制行

向现有分组新增行时，应同时复制：

- `mergeGroupId`
- 所有共享业务字段
- 必要的权限或状态信息

创建新分组时生成新的稳定 `mergeGroupId`。

### 删除和移动行

删除、排序或移动后，跨度计算应基于最新 `tableData` 自动重新执行。需要保持合并时，同组行必须连续排列。

### 表头隐藏

整张表不需要表头时直接使用 Element UI 原生属性：

```ts
const tableProps = {
  showHeader: false,
  spanMethod
}
```

隐藏表头不改变 `spanMethod` 的列顺序和数据处理规则。

## 推荐职责边界

```text
FormTable
  透传 tableProps，渲染未被覆盖的单元格

spanMethod
  根据行、列和预计算跨度决定展示合并

业务数据层
  维护 mergeGroupId、共享字段同步和提交归一化

业务校验层
  处理无法由锚点 FormItem 代表的跨行规则
```

不建议在 FormTable 核心增加自动复制字段或声明式 `mergeBy`。合并展示与业务分组、排序、汇总、校验和接口结构高度相关，留在页面或业务工具函数中更容易维护。

## 开发检查清单

- 合并列是否配置了稳定的 `column.props.prop`？
- 是否使用独立 `mergeGroupId`，而不是可编辑字段作为分组身份？
- 同组数据是否连续排列？
- rowspan 是否预先计算，而不是在每个单元格中重复扫描？
- 被覆盖行的数据是否仍保持完整？
- 共享字段是否在编辑时同步，并在提交前归一化？
- 被覆盖字段是否仍需要逐行校验？
- 横向合并是否只影响展示，没有覆盖不同语义的原始字段？
- 动态开关合并后，组件状态是否能从 `tableData` 恢复？
- 新增、复制、删除和移动行后是否重新计算跨度？
