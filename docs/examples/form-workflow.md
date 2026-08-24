# 完整编辑提交流程

> 可运行 Demo：[打开完整编辑提交流程 ↗](http://localhost:5173/form-workflow)

这个示例补齐实际页面最常见的完整生命周期：接口加载、受控编辑、行操作、校验保存、脏状态、撤销恢复，以及加载失败、保存失败、过期响应、服务端字段错误、版本冲突和未保存离开。它不把请求或快照管理塞进 FormTable 配置。

## 状态划分

```ts
const tableData = ref<OrderRow[]>([])
const savedSnapshot = ref<OrderRow[]>([])
const loading = ref(false)
const saving = ref(false)

const dirty = computed(
  () => JSON.stringify(tableData.value) !== JSON.stringify(savedSnapshot.value)
)
```

示例为了直观使用序列化比较。大型页面应在更新入口维护 dirty 标记，或使用业务 Store 的变更追踪，避免每次渲染比较完整数组。

## 加载接口数据

接口响应先转换成页面行模型，再分别写入快照和当前数据：

```ts
const rows = normalizeResponse(response)
savedSnapshot.value = cloneRows(rows)
tableData.value = cloneRows(rows)
await nextTick()
formTableRef.value?.clearValidate()
```

两份数据不能共享可变行对象。示例使用浅克隆是因为行字段都是基本类型；存在嵌套对象时应按业务模型执行结构化克隆或不可变转换。

### 忽略过期加载响应

重新加载、切换筛选或切换业务单据可能产生并发请求。使用单调递增的请求序号，只允许最后一次响应替换当前页面：

```ts
let latestLoadRequest = 0

async function loadData() {
  const requestId = ++latestLoadRequest

  try {
    const rows = await fetchRows()
    if (requestId !== latestLoadRequest) return

    savedSnapshot.value = cloneRows(rows)
    tableData.value = cloneRows(rows)
  } catch (error) {
    if (requestId === latestLoadRequest) showLoadError(error)
  } finally {
    if (requestId === latestLoadRequest) loading.value = false
  }
}
```

Demo 的“模拟过期响应”会先发起慢请求，再发起快请求；慢响应最终返回时不会覆盖新数据。真实请求还可以通过 `AbortController` 或请求库取消，但仍建议保留响应身份检查。

## 新行身份

页面配置 `row-key="id"`，服务端行使用真实 ID，新行使用不会重复的临时 ID：

```ts
const createEmptyRow = () => ({
  id: `draft-${nextRowId++}`,
  productName: '',
  quantity: 1,
  unitPrice: 0,
  remark: ''
})
```

提交 DTO 时去掉临时 ID，而不是在编辑过程中修改 `rowKey`。服务端保存成功并返回真实 ID 后，应整体替换对应行。

## 派生值与操作列

小计和操作按钮不需要字段、校验或自动 model，使用 `cellSlot`：

```ts
{
  key: 'total',
  label: '小计',
  cellSlot: 'line-total'
},
{
  key: 'actions',
  label: '操作',
  cellSlot: 'row-actions'
}
```

派生金额直接由当前行的数量和单价计算，不额外保存一份容易失效的 `total` 字段。

## 校验并保存

```ts
const valid = await formTableRef.value?.validate()
if (!valid) return

const payload = tableData.value.map(toSubmitDto)
await saveOrder(payload)
savedSnapshot.value = cloneRows(tableData.value)
```

只有接口成功后才更新快照。接口失败时保留用户当前输入和 dirty 状态，让用户可以修改后重试。保存按钮的禁用状态只是交互保护，保存函数本身仍应检查 `saving`；服务端通过幂等键或版本号处理重复请求。

### 映射服务端字段错误

推荐服务端按稳定行身份返回错误，不返回可能已经变化的数组下标：

```ts
interface ServerFieldError {
  rowId: string
  fieldKey: string
  message: string
}
```

页面保存这些错误，在最新 `tableData` 中按 `rowKey` 查找数据源下标，再调用原生 Form Ref 的 `validateField`。动态 validator 从当前服务端错误集合读取消息，因此错误会同时出现在表格字段和页面错误摘要中。

用户修改对应字段后，通过 `field-change` 删除该项旧错误并清理字段校验状态。不要因为一项服务端校验失败而恢复整份旧快照，也不要长期缓存 `tableData.${index}.${fieldKey}` 路径；行结构变化后必须重新按稳定身份计算。

### 处理版本冲突

保存请求携带加载时获得的服务端版本。发生冲突时保留本地 `tableData` 和 dirty，不自动套用服务端响应：

```ts
if (isVersionConflict(error)) {
  conflict.value = {
    serverVersion: error.version,
    serverRows: error.rows
  }
  return
}
```

Demo 提供“保留本地并重试”和“采用服务端版本”两个入口。前者保留当前数据并把提交基线更新为服务端新版本，明确表示再次保存可能覆盖冲突字段；后者同时替换 `tableData/savedSnapshot` 并清理校验。需要无损保留双方修改时使用三方合并，完整策略见[多人编辑冲突与未保存离开](../features/concurrent-editing-and-navigation.md)。

## 撤销修改

撤销不是调用 Element Form 的 `resetFields()`，而是恢复页面保存的服务端快照：

```ts
tableData.value = cloneRows(savedSnapshot.value)
await nextTick()
formTableRef.value?.clearValidate()
```

这能同时恢复字段值、行顺序、新增行和删除行，并清理与旧结构关联的校验展示。

## Demo 中可以验证的异常流程

- “下一次加载失败”：现有数据和编辑内容保持不变，可以重新加载。
- “下一次保存失败”：保留 dirty 状态和当前输入，可以直接重试。
- “服务端拒绝第一行商品”：按行 ID 映射字段错误；编辑该字段后清除旧错误。
- “下一次保存发生版本冲突”：保留本地编辑，等待用户明确选择版本。
- “模拟过期响应”：较早发起的慢响应不会覆盖最新响应。
- 修改数据后点击“返回示例中心”：出现未保存离开确认；刷新或关闭页面触发浏览器保护。

## 生产项目仍需补充什么

- 请求取消、超时、错误分类和统一提示。
- 更复杂的逐字段三方合并和冲突审计。
- 分页场景下的分批快照和提交策略。
- 大型数据集更轻量的 dirty 追踪。

这些属于页面或业务状态层，不应成为 FormTable 的公共 API。相关数据边界见[受控数据流](../architecture/controlled-data-flow.md)，常见异常见[排错指南](../guide/troubleshooting.md)。
