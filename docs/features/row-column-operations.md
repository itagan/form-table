# 行列操作与异步提交

> 可运行 Demo：[打开行列操作与异步提交示例 ↗](http://localhost:5173/row-column-operations)

本页聚焦需要确认、校验或接口成功后才产生最终业务变更的组合模式。常规行增删复制见[常见操作列与行增删](./common-row-actions.md)，列显隐和配置替换见[动态显隐与配置更新](./dynamic-configuration.md)。

## 优化后的行为与边界

| 场景 | 推荐方式 |
| --- | --- |
| 普通字段输入 | 立即通过根 `v-model` 回写本地 `tableData` |
| 延迟保存后端 | 本地立即回写，接口单独防抖或批量保存快照 |
| 确认或接口成功后才修改字段 | 自定义组件保存草稿，成功后调用 `setValue/updateRow` |
| 异步期间可能重建行对象 | 配置唯一稳定的 `rowKey` |
| 同一字段允许连续请求 | 使用版本号、请求锁或 `AbortController` 处理竞争 |

“异步提交”不是延迟接收 `update:tableData`。父组件必须同步接收组件已经发出的受控数据，否则后续更新可能继续基于旧 props 计算。

## 常见行操作

同步行操作由页面不可变替换整个 `tableData`；不要把数组级操作塞进字段更新助手。

### 新增空行

末尾新增、当前行后插入以及完整操作列代码见[常见操作列与行增删](./common-row-actions.md#完整示例)。

### 删除行

同步删除可以按当前下标执行；确认或请求期间允许重排行时，完成异步操作后必须按稳定业务身份删除。

### 复制行

复制时生成新的行标识，不复用源行 `id/_rowKey`；数组、对象等可变业务字段按需要深拷贝。

### 上移和下移

移动行后在 `nextTick` 中调用 `clearValidate()`，清除仍绑定旧数组下标的 Element Form 校验状态。

### 批量修改

跨行更新由页面通过 `map` 替换数据；当前行的多个字段使用一次 `updateRow(patch)`。

## 常见列和配置操作

动态列由调用方不可变替换或派生 `columns`，并为每一列提供唯一稳定的 `column.key`。

### 根据业务状态隐藏列

仅依赖页面状态时使用 `column.visible`；详细上下文见[动态显隐与配置更新](./dynamic-configuration.md#动态显隐)。

### 用户主动切换列

用户偏好适合维护隐藏 key 集合，再通过 computed 派生可见 columns。

### 增加、删除和移动列

增加、删除或移动时创建新数组。已有列相对顺序变化会重新挂载可见列，业务值必须保存在 `tableData` 中。

### 修改某个字段配置

按稳定 `item.key` 不可变替换目标 Item；不要在 `visible/props` 等渲染回调中直接修改配置。

## 先处理逻辑，再变更字段

需要先确认或调用接口时，让编辑器在内部维护草稿，只发出 `commit`：

```ts
{
  fieldKey: 'score',
  type: 'slot',
  component: {
    slot: 'score-editor',
    listeners: {
      async commit({ row, setValue }, draftValue) {
        await confirmScore(row, draftValue)
        const result = await saveScore(row.id, draftValue)
        setValue(result.score)
      }
    }
  }
}
```

不要同时把编辑器的 `input` 绑定到 `setValue`；否则输入阶段已经修改 `tableData`，不再是确认后提交。

## 确认后删除行

异步结束后按稳定身份重新定位，避免旧下标删除错误行：

```ts
const removeAfterConfirm = async row => {
  await MessageBox.confirm(`确认删除 ${row.name}？`, '提示')
  if (row.id) await deleteContact(row.id)
  tableData.value = tableData.value.filter(
    current => current._rowKey !== row._rowKey
  )
}
```

## 校验通过后新增行

```ts
const addAfterValidate = async () => {
  if (!await formTableRef.value?.validate()) return
  if (!await checkCanAddRow(tableData.value)) return
  tableData.value = [...tableData.value, createEmptyRow()]
}
```

## 一次提交多个字段

业务处理成功后使用一次 `updateRow` 提交最终状态：

```ts
async commit({ updateRow }, draft) {
  const result = await validateAddress(normalizeAddress(draft))
  if (!result.valid) return
  updateRow({
    province: result.province,
    city: result.city,
    detail: result.detail,
    addressChecked: true
  })
}
```

## 防止异步结果乱序

同一字段允许连续提交时，用 `rowKey + fieldKey` 保存请求版本，只接受最后一次结果：

```ts
const versions = new Map<string, number>()

async function commit({ row, fieldKey, setValue }, draftValue) {
  const key = `${row._rowKey}:${fieldKey}`
  const version = (versions.get(key) || 0) + 1
  versions.set(key, version)

  const result = await saveScore(row.id, draftValue)
  if (versions.get(key) === version) setValue(result.score)
}
```

不允许重复提交时，在 listener 入口检查请求锁并在 `finally` 中释放。接口支持取消时，为每个 key 保存一个 `AbortController`，新请求开始前取消旧请求。请求版本、锁和控制器都属于页面或业务 Store，不进入 FormTable 配置状态。

## 异步保存与行身份

异步期间可能深拷贝、接口刷新或替换全部行对象时配置稳定身份：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  row-key="_rowKey"
/>
```

更新助手会在最新数据中重新定位原行；目标行已删除、rowKey 缺失或重复时忽略更新。完整规则见[稳定身份与异步安全](./stable-identity.md)。

## 选择更新方式

| 需求 | 推荐入口 |
| --- | --- |
| 普通字段输入 | 内置 type 或 `type: 'component'` 的即时 model |
| 当前行同步联动 | listener + `setValue/updateRow` |
| 确认或请求成功后更新字段 | 草稿组件发出 `commit`，成功后调用更新助手 |
| 行增删复制移动 | 页面替换 `tableData` |
| 列显隐、增删、排序 | 页面替换或派生 `columns` |
| 降低后端保存频率 | 本地立即回写，接口单独防抖或批量保存 |

## 相关 API

[数据更新与受控回写](./data-updates.md) · [校验、清理与重置](./validation-reset.md) · [事件与 Ref](../api/events-and-ref.md)
