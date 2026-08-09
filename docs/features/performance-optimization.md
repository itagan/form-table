# 性能优化建议

> 配套工具：[Performance Lab](http://localhost:5173/performance) · [测量方法与性能边界](./performance.md)

FormTable 基于 Element UI 2 的 `el-table` 与 `el-form`。优化时首先减少实际挂载的行、FormItem 和字段组件，其次才是优化数组更新或动态配置函数。

## 先判断属于哪类问题

| 表现 | 优先检查 | 通常有效的处理 |
| --- | --- | --- |
| 首次打开慢 | 行数、每行 Item 数、字段组件复杂度 | 分页、只读展示、按需进入编辑态 |
| 输入时卡顿 | 整表重渲染、同步校验、动态回调 | 稳定配置引用、轻量回调、推迟昂贵业务副作用 |
| 接口推送频繁闪动 | 每条消息都替换一次 `tableData` | 按一帧或时间窗口合并更新 |
| Select 列明显更慢 | 大 options、重复转换、远程请求 | 业务层缓存、远程搜索、避免每个单元格复制列表 |
| 校验时卡顿 | 全表复杂 validator 同时执行 | 分批校验、提交时校验、只校验当前编辑批次 |
| 固定高度仍占用大量内存 | 误把滚动容器当成虚拟滚动 | 分页或更换虚拟表格渲染方案 |

不要先用开发模式下的一次毫秒数决定方案。先在 [Performance Lab](http://localhost:5173/performance) 中复现相近的行数、列数和渲染模式，再使用 production build 重复测量。

## 优化优先级

```text
减少挂载量
  ↓
减少一次操作影响的数据和组件
  ↓
合并高频更新
  ↓
缓存昂贵计算和选项
  ↓
最后评估虚拟滚动
```

虚拟滚动并不是所有慢表格的第一选择。复杂表单常常可以通过分页、按需编辑和批量回写获得更低的改造成本。

## 1. 减少实际挂载量

### 只读内容使用 `cellSlot`

不需要表单交互的列不要创建 Row、Item 和输入组件：

```ts
const columns = [
  {
    key: 'summary',
    label: '摘要',
    cellSlot: 'summary'
  },
  {
    key: 'amount',
    label: '金额',
    children: [{
      key: 'amount-row',
      children: [{
        key: 'amount-item',
        fieldKey: 'amount',
        type: 'number'
      }]
    }]
  }
]
```

```vue
<template #summary="{ row }">
  <span>{{ row.name }} · {{ row.status }}</span>
</template>
```

`cellSlot` 只负责展示和显式更新，不会为该列创建 FormItem。详见 [`cellSlot` 专题](./cell-slot.md)。

### 只让当前批次进入编辑态

大量数据不一定要同时编辑。常见方式包括：

- 服务端或前端分页，每页只挂载几十到数百行。
- 分组折叠，只挂载当前展开分组。
- 默认显示文本，点击行或单元格后再渲染字段组件。
- 将“批量浏览”和“单条编辑”拆成两个页面或抽屉。

固定 `tableProps.height` 只能限制可见区域，不能减少 Element UI 创建的行和组件。

## 2. 保持身份和配置引用稳定

每一行都应提供唯一且稳定的 `rowKey`：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :table-props="{ rowKey: 'id', height: 520 }"
/>
```

Column、Row、Item 也应配置稳定 `key`。动态增删或显隐时，稳定身份可以减少错误复用，并保证异步 `updateRow` 能重新定位目标行。

列配置不应在每次组件渲染时重新创建。配置较大时可以使用 `shallowRef` 保存，只在结构真正改变时替换：

```ts
import { shallowRef } from 'vue'
import type { ColumnConfig } from '@itagan/form-table'

const columns = shallowRef<ColumnConfig[]>(createColumns())

function enableAuditColumn() {
  columns.value = createColumns({ showAudit: true })
}
```

避免在模板中传入每次都会产生新对象的大型配置生成结果，例如 `:columns="createColumns()"`。

## 3. 合并频繁数据更新

字段组件的 `setValue` 和 `cellSlot.updateRow` 适合一次用户操作。接口推送、批量计算或连续采集数据，更适合先在父组件聚合，再一次性替换 `tableData`。

下面示例把同一帧收到的多条变更合并为一次数组更新：

```ts
import { ref } from 'vue'

type RowId = string | number
type Row = { id: RowId; [key: string]: unknown }

const tableData = ref<Row[]>([])
const pendingPatches = new Map<RowId, Partial<Row>>()
let flushPending = false

function receivePatch(id: RowId, patch: Partial<Row>) {
  pendingPatches.set(id, {
    ...pendingPatches.get(id),
    ...patch
  })

  if (flushPending) return
  flushPending = true

  requestAnimationFrame(() => {
    const patches = new Map(pendingPatches)
    pendingPatches.clear()
    flushPending = false

    tableData.value = tableData.value.map(row => {
      const rowPatch = patches.get(row.id)
      return rowPatch ? { ...row, ...rowPatch } : row
    })
  })
}
```

这个模式具有三个特点：

- 一个时间窗口只派发一次顶层数组变化。
- 只替换实际变化的行对象。
- 未变化行继续保持原引用。

如果更新不要求逐帧显示，可以把 `requestAnimationFrame` 换成 50–200ms 的业务缓冲窗口。窗口大小应由实时性要求决定，而不是组件内部固定。

### 批量修改多个字段

在 `cellSlot` 中应优先一次调用 `updateRow`：

```vue
<template #actions="{ updateRow }">
  <el-button
    @click="updateRow({ status: 'approved', reviewer: currentUser, reviewedAt: Date.now() })"
  >
    通过
  </el-button>
</template>
```

不要把同一次业务操作拆成多个异步单字段回写，否则会增加父级更新和表格刷新次数。

## 4. 控制输入、副作用和动态配置成本

输入值应保持即时回写；远程搜索、自动保存和复杂联动可以单独 debounce：

```ts
function handleFieldChange(payload) {
  queueAutoSave(payload.row.id, payload)
}
```

不要为了减少请求而延迟本地 `v-model`，否则输入框显示值与受控数据可能短暂不一致。

动态 `visible`、`props`、`formItemProps`、`options` 和 `component.props` 会在渲染期间求值。建议：

- 保持同步和纯计算，不在回调中请求接口。
- 不深拷贝、排序或扫描整张 `tableData`。
- 不在回调中创建新的组件定义。
- 公共 options 在业务层预计算并共享引用。
- 只读取当前层真正需要的依赖，避免一个无关字段变化影响全部配置。

错误示例：

```ts
options: ({ tableData }) => expensiveSortAndClone(tableData)
```

建议改为：

```ts
import { computed } from 'vue'

const sharedOptions = computed(() => buildOptions(sourceData.value))

const columns = [{
  // ...
  options: () => sharedOptions.value
}]
```

## 5. 控制校验规模

复杂表格中，校验成本通常来自 FormItem 数量和 validator，而不是规则对象本身。

- 简单同步规则可以保留实时触发。
- 远程校验应缓存结果并处理过期请求。
- 大批量导入适合先做数据层校验，再渲染错误摘要。
- 分页编辑时，明确产品要求是“校验当前页”还是“提交时校验全部数据”。
- 删除或替换动态行后及时清理失效校验状态。

不要依赖虚拟滚动中的 DOM 字段实例完成整表校验；未挂载行不会拥有完整的 Element FormItem 实例。

## 6. 当前是否支持虚拟滚动

当前 FormTable **不支持虚拟滚动**。底层 Element UI 2 `el-table` 会创建全部数据行；`height` 和 `maxHeight` 只提供普通滚动容器。

### 什么时候需要虚拟化

以下条件同时出现时，才建议进入虚拟表格方案评估：

- 数千行需要在同一页面连续滚动，分页不可接受。
- 行高固定或可以可靠估算。
- 大部分单元格是展示或轻量编辑。
- 可以接受对合并单元格、展开行和完整 Element Form 校验做限制。

### 为什么不直接增加 `virtual: true`

虚拟表格只挂载视口附近的行，会改变现有能力的基础假设：

| 能力 | 虚拟化后的问题 |
| --- | --- |
| Element Form 校验 | 未挂载行没有 FormItem 实例 |
| 动态行高 | 错误提示、Textarea 和复杂组件会改变高度 |
| 滚动到错误字段 | 需要先按 `rowKey` 定位并挂载目标行 |
| 合并单元格 | 跨越未渲染区域时计算和绘制复杂 |
| 固定列 | 主区域与固定区域必须同步虚拟窗口 |
| 组件内部状态 | 离开视口后组件会卸载，需要外置状态 |

更稳妥的演进方式是独立提供 `VirtualFormTable`，尽量复用 `tableData`、`columns`、`rowKey`、`cellSlot` 和更新上下文，同时明确固定行高、校验与合并能力限制。这样不会让常规 FormTable 长期承担两套渲染逻辑。

## 场景建议

| 数据形态 | 推荐方案 |
| --- | --- |
| 100 行以内复杂编辑 | 直接使用 FormTable，保持稳定 key 和轻量动态配置 |
| 数百行常规编辑 | 先测量，再采用分页、分组或按需编辑 |
| 数百行高频推送 | 合并更新，只替换变化行，控制刷新频率 |
| 数千行只读或轻编辑 | 评估虚拟表格，同时限制动态行高和复杂交互 |
| 数千行复杂表单 | 优先拆分编辑流程，不建议把全部字段同时挂载 |

这些数量是排查起点，不是容量承诺。最终应以目标设备、真实字段组件和 production build 的测量结果为准。

## 上线前检查清单

- [ ] `tableProps.rowKey` 唯一且稳定。
- [ ] Column、Row、Item 的 `key` 不随排序或显隐变化。
- [ ] 纯展示列没有创建无意义的 FormItem。
- [ ] `columns` 和大型 options 没有在每次渲染时重建。
- [ ] 动态回调中没有接口请求、深拷贝或整表排序。
- [ ] 高频外部更新已经按帧或时间窗口合并。
- [ ] 一次业务操作使用一次 `updateRow` 完成多字段修改。
- [ ] 校验范围和当前挂载的数据范围一致。
- [ ] 使用 production build 重复测量并记录中位数。
- [ ] 需要虚拟滚动时已确认校验、行高、合并和固定列限制。

遇到退化时，先在 [Performance Lab](http://localhost:5173/performance) 对比纯展示、编辑和动态配置场景，再根据 DOM 节点数、回调计数和具体操作耗时定位优化层级。

## 相关 API

[FormTable Props](../api/form-table.md) · [数据更新与受控回写](./data-updates.md) · [稳定身份与异步安全](./stable-identity.md)
