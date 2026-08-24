# 业务配置测试指南

FormTable 自身测试不能替代业务项目对 columns、Adapter、listener、权限和提交状态的验证。业务测试应优先覆盖自己的转换和决策逻辑，只保留少量 FormTable 挂载集成测试。

## 推荐测试层次

| 层次 | 重点 | 特点 |
| --- | --- | --- |
| 纯函数 | DTO 转换、配置工厂、formatter、批量 patch | 最快、最稳定 |
| 组件协议 | Adapter 的 props、model 和业务事件 | 验证技术兼容边界 |
| 页面状态 | dirty、请求版本、服务端错误、冲突选择 | 不依赖复杂 DOM |
| FormTable 集成 | 关键字段输入、listener、Slot 和受控回写 | 数量少，验证真实组合 |
| 端到端 | 加载、编辑、保存、失败重试 | 只覆盖核心用户路径 |

不要把全部业务规则都通过 Element UI DOM 交互测试。先把规则提取为可直接调用的函数，再用少量集成测试确认配置接线正确。

## 测试配置工厂

配置工厂的输入应该是业务能力，输出是稳定公开配置：

```ts
it('disables price editing without permission', () => {
  const columns = createPurchaseColumns({
    canEditPrice: () => false
  })

  const priceItem = findItem(columns, 'taxPrice')
  const props = resolveDynamicProps(priceItem.component?.props, {
    row: { id: '1', taxPrice: 100 }
  })

  expect(props.disabled).toBe(true)
})
```

重点断言业务结果，不对整个 columns 做巨大快照。大快照会把标签、宽度等无关变化都变成测试噪音。

详情/编辑模式应分别验证简单文本与复杂展示策略：

```ts
it('uses text for simple detail and cellSlot for formatted detail', () => {
  const editColumn = createScoreColumn('edit')
  const detailColumn = createScoreColumn('detail')
  const amountColumn = createAmountColumn('detail')

  expect(editColumn).toHaveProperty('formItems')
  expect(detailColumn.formItems[0]).toMatchObject({
    fieldKey: 'score',
    type: 'text'
  })
  expect(amountColumn).toHaveProperty('cellSlot', 'amount-detail')
})
```

一列包含多个详情字段时，再断言 `formItems` 数量、字段顺序和 `colProps.span`，不需要测试不存在的 `cellSlot`。

## 测试 listener

把复杂转换提取为纯 patch 函数，listener 只负责编排：

```ts
function toSupplierPatch(supplier, source) {
  return {
    supplierName: supplier?.name || '',
    supplierSource: source,
    ...(supplier ? { taxRate: supplier.taxRate } : {})
  }
}

listeners: {
  'supplier-change'({ updateRow }, supplier, source) {
    updateRow(toSupplierPatch(supplier, source))
  }
}
```

纯函数测试覆盖空值、来源和关联字段；集成测试只需确认 listener 调用了 `updateRow`，不重复测试每一种数据组合。

同时验证 `meta` 的使用边界：业务埋点或权限函数从 `itemConfig.meta` 读取静态标识，但组件 Props 只有显式映射后才应包含该值。

## 测试 Adapter 协议

Adapter 测试只关心旧协议是否被归一化，不需要挂载整张 FormTable：

```ts
const wrapper = mount(SupplierPickerAdapter, {
  propsData: { value: 'supplier-1', orgCode: 'HZ-PURCHASE' }
})

wrapper.findComponent(CompanySupplierPicker).vm.$emit(
  'supplier-change',
  { id: 'supplier-2', name: '供应商二' },
  'search'
)

expect(wrapper.emitted('input')?.[0]).toEqual(['supplier-2'])
expect(wrapper.emitted('supplier-change')?.[0]?.[1]).toBe('search')
```

至少覆盖正常选择、清空、禁用透传和多参数原始事件。Adapter 不应包含页面权限、接口保存或整行更新断言。

## FormTable 最小集成测试

使用 Vue Test Utils 挂载真实 FormTable，并立即回写 `update:tableData`：

```ts
const localVue = createLocalVue()
localVue.use(ElementUI)

const wrapper = mount(FormTable, {
  localVue,
  propsData: {
    tableData: [{ id: '1', status: 'draft' }],
    rowKey: 'id',
    columns
  },
  listeners: {
    'update:tableData'(rows) {
      wrapper.setProps({ tableData: rows })
    }
  }
})
```

关键断言包括：

- 自定义组件收到预期 model Prop。
- 组件事件产生正确的新数组，不直接修改原数组。
- listener 获得原始事件参数和字段上下文。
- 多字段 `updateRow` 只产生目标字段变化。
- 缺失 Slot、权限隐藏和详情模式符合预期。

不要依赖 FormTable 内部组件名称或深层 DOM 层级；这些不是公共协议。

## 测试异步竞争

使用可控 Promise 或 fake timers 模拟慢请求和快请求：

```ts
it('ignores an older response', async () => {
  const first = deferred<OrderRow[]>()
  const second = deferred<OrderRow[]>()

  const firstTask = loadRows(() => first.promise)
  const secondTask = loadRows(() => second.promise)

  second.resolve(newRows)
  await secondTask
  first.resolve(oldRows)
  await firstTask

  expect(tableData.value).toEqual(newRows)
})
```

还应覆盖目标行已删除、rowKey 重复、Adapter 搜索条件变化和组件卸载后的迟到响应。

## 测试保存状态和冲突

把页面保存状态整理为明确结果：成功、字段错误、网络失败和版本冲突。分别验证：

- 只有成功才更新 `savedSnapshot` 和版本。
- 网络失败保留 tableData 与 dirty。
- 服务端字段错误按 `rowId + fieldKey` 映射。
- 版本冲突不自动覆盖本地输入。
- 采用服务端版本后清理 dirty 和旧校验。
- 保留本地并重试时更新提交基线，并明确覆盖或三方合并语义。

未保存离开测试至少覆盖无修改直接离开、用户取消离开、确认丢弃以及保存成功后不再提示。

## 测试批量和跨页状态

- selection 转换为稳定 ID 集合，不保存页内下标。
- 当前页取消选择只移除当前页 ID。
- 批量 `map/filter` 保留未变化行引用。
- 翻页后草稿覆盖服务端同 ID 行。
- 当前页 `validate()` 不被误认为全量校验。
- 部分保存成功时只清理对应草稿。

## 上线前最小测试集

- 一条正常字段输入和受控回写。
- 一个业务组件或 Adapter 协议。
- 一次多字段联动。
- 一项权限或详情/编辑模式。
- 一次校验失败和服务端字段错误。
- 一次网络失败或版本冲突。
- 一次行结构变化或批量操作。
- 存在异步搜索时覆盖过期响应。

## 相关文档

[完整编辑提交流程](../examples/form-workflow.md) · [企业复杂组件接入](../examples/enterprise-components.md) · [权限与编辑模式](../features/permissions-and-editing.md) · [分页与跨页编辑](../features/pagination-and-cross-page-editing.md)
