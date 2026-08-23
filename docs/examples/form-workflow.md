# 完整编辑提交流程

> 可运行 Demo：[打开完整编辑提交流程 ↗](http://localhost:5173/form-workflow)

这个示例补齐实际页面最常见的完整生命周期：接口加载、受控编辑、行操作、校验保存、脏状态和撤销恢复。它不把请求或快照管理塞进 FormTable 配置。

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

只有接口成功后才更新快照。接口失败时保留用户当前输入和 dirty 状态，让用户可以修改后重试。

## 撤销修改

撤销不是调用 Element Form 的 `resetFields()`，而是恢复页面保存的服务端快照：

```ts
tableData.value = cloneRows(savedSnapshot.value)
await nextTick()
formTableRef.value?.clearValidate()
```

这能同时恢复字段值、行顺序、新增行和删除行，并清理与旧结构关联的校验展示。

## 生产项目需要补充什么

- 请求取消、超时和错误提示。
- 离开页面前的未保存修改确认。
- 保存并发控制或幂等键。
- 服务端校验错误到具体行字段的映射。
- 分页场景下的分批快照和提交策略。
- 大型数据集更轻量的 dirty 追踪。

这些属于页面或业务状态层，不应成为 FormTable 的公共 API。相关数据边界见[受控数据流](../architecture/controlled-data-flow.md)，常见异常见[排错指南](../guide/troubleshooting.md)。
