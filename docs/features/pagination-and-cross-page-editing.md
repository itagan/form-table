# 分页与跨页编辑

FormTable 只管理当前传入的 `tableData`。分页器、查询条件、页缓存、跨页草稿和全量提交属于页面或 Store；底层 Element Form 也只能校验当前已经挂载的行。

## 先选择保存策略

| 产品要求 | 推荐策略 | 复杂度 |
| --- | --- | --- |
| 每页编辑后单独保存 | 切页前校验并保存当前页 | 低 |
| 多页编辑后一次提交 | 按稳定 ID 维护跨页草稿 | 中 |
| 跨页新增、删除、排序并一次提交 | 草稿、临时行、删除集合和版本统一进入业务 Store | 高 |

如果产品允许，优先采用“当前页保存后再翻页”。跨页一次提交意味着页面必须管理未挂载数据，不能依赖 FormTable 或 Element Form 保存全部编辑状态。

## 当前页数据流

分页器位于 FormTable 外部，接口响应直接成为当前页受控数据：

```vue
<FormTable
  ref="formTableRef"
  v-model="pageRows"
  :columns="columns"
  row-key="id"
  @field-change="recordDraft"
/>

<el-pagination
  :current-page="query.page"
  :page-size="query.pageSize"
  :total="total"
  @current-change="changePage"
/>
```

```ts
async function loadPage() {
  const response = await fetchPage(query)
  total.value = response.total
  pageRows.value = response.rows.map(row => (
    drafts.value[row.id] || row
  ))
  await nextTick()
  formTableRef.value?.clearValidate()
}
```

切换筛选、排序或页码都属于一次新的加载请求，应使用请求序号或取消控制器忽略旧响应。不要让迟到的上一页响应覆盖当前页。

## 按稳定 ID 保存跨页草稿

`field-change` 已提供更新后的行，可以把完整业务行写入草稿表：

```ts
const drafts = ref<Record<string, OrderRow>>({})

function recordDraft({ row }) {
  drafts.value = {
    ...drafts.value,
    [row.id]: row
  }
}
```

翻页后接口返回原始数据，再用草稿覆盖同 ID 行。草稿键必须来自稳定 `rowKey`，不能使用当前页 `index`；服务端排序或筛选会改变行所在页和页内位置。

实际项目通常还要同时维护：

```ts
const createdRows = ref<OrderRow[]>([])
const deletedIds = ref<string[]>([])
const drafts = ref<Record<string, OrderRow>>({})
const baseVersions = ref<Record<string, string>>({})
```

- 新行使用全局不重复的临时 ID，保存成功后由页面整体替换为服务端 ID。
- 删除已保存行时记录服务端 ID；删除尚未保存的临时行时直接移除草稿。
- `baseVersions` 用于提交时检测多人编辑冲突。
- 保存成功后只清理服务端确认接受的草稿和删除记录。

## 跨页选择

Element Table 的 `selection-change` 只描述当前渲染数据的选择结果。需要跨页批量操作时，页面维护稳定 ID 集合：

```ts
const selectedIds = ref<string[]>([])

function handleSelectionChange(currentSelection) {
  const currentPageIds = new Set(pageRows.value.map(row => row.id))
  const selectedOnPage = currentSelection.map(row => row.id)

  selectedIds.value = [
    ...selectedIds.value.filter(id => !currentPageIds.has(id)),
    ...selectedOnPage
  ]
}
```

`reserveSelection` 和稳定 `rowKey` 有助于 Element Table 在数据替换时保留选择，但跨页业务状态仍应以页面的 ID 集合为准。筛选条件变化后，产品还需明确选择是继续保留、仅保留可见结果，还是全部清空。

## 校验边界

`validate()` 只能校验当前 `pageRows` 对应的 FormItem。未挂载页面没有 DOM 字段实例，因此不能通过反复替换数据后立即调用同一个 Form Ref 完成可靠的全量校验。

常见策略：

- 切页前校验当前页，不通过则阻止翻页。
- 跨页提交前对草稿 DTO 执行独立数据层校验。
- 服务端校验全部数据，并按稳定 `rowId + fieldKey` 返回错误。
- 页面显示跨页错误摘要；用户进入对应页后再映射到当前 FormItem。

服务端错误不要返回页内下标。排序、筛选和页大小变化后，下标已经不再稳定。

## 批量提交

提交载荷由页面合并草稿、新增行和删除集合：

```ts
const payload = {
  updates: Object.values(drafts.value).map(toUpdateDto),
  creates: createdRows.value.map(toCreateDto),
  deletes: deletedIds.value,
  versions: baseVersions.value
}
```

接口失败时保留未提交集合；部分成功时按服务端逐项结果清理成功项。不要因为一页保存失败而恢复整张表的旧快照。

## 批量操作当前页还是全部选中项

批量按钮应在文案和接口层明确作用范围：

| 操作范围 | 数据来源 |
| --- | --- |
| 当前页已选 | `pageRows` 与当前页 selection |
| 所有跨页已选 | `selectedIds`，通常由服务端按 ID 执行 |
| 当前筛选条件全部结果 | 提交查询条件和排除 ID，不在前端加载全部行 |

大量跨页 ID 不应先下载所有行再在浏览器逐行修改。让服务端执行批量任务，并返回成功数、失败项和可重试标识。

## 上线检查

- `rowKey` 是否跨页、跨排序保持唯一。
- 翻页时是否先保存草稿或明确阻止未保存离开。
- 旧请求是否可能覆盖新页数据。
- 跨页 selection 是否使用稳定 ID，而不是行对象或下标。
- 当前页校验和全量提交校验是否已经明确区分。
- 临时行、删除集合和服务端版本是否进入提交协议。
- 部分成功、版本冲突和服务端字段错误是否可以保留并重试。

## 相关文档

[完整编辑提交流程](../examples/form-workflow.md) · [稳定身份](./stable-identity.md) · [行列操作与异步提交](./row-column-operations.md) · [性能优化建议](./performance-optimization.md)
