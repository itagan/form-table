# 多人编辑冲突与未保存离开

> 可运行 Demo：[完整编辑提交流程 ↗](http://localhost:5173/form-workflow)

FormTable 只负责当前页面中的受控编辑。数据版本、保存冲突、页面离开确认和自动保存策略由页面或业务 Store 管理，不应进入 columns 动态回调。

## 使用乐观并发版本

加载接口数据时同时保存服务端版本：

```ts
const tableData = ref<OrderRow[]>([])
const savedSnapshot = ref<OrderRow[]>([])
const baseVersion = ref('')

async function loadOrder() {
  const result = await fetchOrder()
  tableData.value = cloneRows(result.rows)
  savedSnapshot.value = cloneRows(result.rows)
  baseVersion.value = result.version
}
```

保存时提交加载时获得的版本，而不是只发送最新字段值：

```ts
await saveOrder({
  expectedVersion: baseVersion.value,
  rows: tableData.value.map(toSubmitDto)
})
```

服务端只有在 `expectedVersion` 仍匹配时接受更新；否则返回冲突状态、当前服务端版本和必要的数据快照。版本可以是整数、时间戳、ETag 或业务修订号，但必须由服务端生成并原子检查。

## 冲突时不要自动覆盖

收到冲突后保留当前本地数据和 dirty 状态，让用户明确选择：

| 选择 | 页面行为 |
| --- | --- |
| 保留本地并重试 | 保持 `tableData`，明确基于服务端新版本重新提交；可能覆盖冲突字段 |
| 采用服务端版本 | 用服务端快照替换 `tableData/savedSnapshot`，清理校验与 dirty |
| 人工合并 | 展示本地值、基线值和服务端值，由用户逐字段选择 |

不要在捕获 409/412 后直接把服务端响应写入 `tableData`，否则用户输入会在没有确认的情况下丢失。

```ts
try {
  await saveOrder(payload)
} catch (error) {
  if (isVersionConflict(error)) {
    conflict.value = {
      serverVersion: error.version,
      serverRows: error.rows
    }
    return
  }
  throw error
}
```

可运行 Demo 的“下一次保存发生版本冲突”会保留本地编辑，并提供“保留本地并重试”和“采用服务端版本”两个显式入口。前者会把提交基线更新为服务端新版本，表示用户明确接受再次保存可能覆盖冲突字段；需要无损保留双方修改时应使用三方合并。

## 冲突粒度

| 数据模型 | 推荐版本粒度 |
| --- | --- |
| 整张明细作为一个业务单据提交 | 单据级版本 |
| 每行可以独立保存 | 行级版本 |
| 批量任务允许部分成功 | 每行版本 + 逐项结果 |

不要仅依赖前端比较更新时间。真正的竞争判断必须发生在服务端写入事务中。

## 未保存离开

dirty 状态来自当前编辑数据与最近成功快照的差异。页面内导航和浏览器关闭需要两条独立防线。

### 应用内路由或关闭抽屉

```ts
async function confirmDiscardChanges() {
  if (!dirty.value) return true

  try {
    await MessageBox.confirm(
      '当前存在未保存修改，确认离开并丢弃吗？',
      '离开确认'
    )
    return true
  } catch {
    return false
  }
}
```

路由守卫、返回按钮、关闭弹窗和切换单据都应复用同一确认函数。保存成功、采用服务端版本或主动撤销后更新快照，dirty 自动恢复为 false。

### 浏览器刷新和关闭

```ts
function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

window.addEventListener('beforeunload', handleBeforeUnload)
```

组件卸载时移除监听器。现代浏览器会显示自己的统一提示文本，不能依赖自定义消息内容。`beforeunload` 只用于最后保护，不替代应用内可理解的确认弹窗。

## 保存期间的导航

保存中通常禁止切换单据、重复提交和关闭编辑容器。若产品允许后台保存：

- 保存任务必须独立持有提交快照和幂等键。
- 页面离开后不能再把响应写入已经销毁的页面状态。
- 新页面加载不能被旧保存或旧加载响应覆盖。
- 失败通知和重试入口需要进入全局任务中心或 Store。

## 自动保存

自动保存仍然先立即更新本地 `tableData`，再防抖提交最新快照。每次提交携带版本和幂等键，并只接受当前任务的响应。

自动保存成功前不能提前更新 `savedSnapshot`，否则页面会错误显示“已保存”。发生冲突时停止继续自动覆盖，转入明确的冲突处理状态。

## 悲观锁边界

有些业务会在进入编辑页时申请锁。即使使用锁，也仍需处理：

- 锁超时、断网和浏览器异常关闭。
- 同一用户多标签页。
- 只读查看者与编辑者的状态刷新。
- 保存事务中的最终版本检查。

因此悲观锁改善交互提示，但不能替代服务端乐观并发校验。

## 上线检查

- 加载响应是否包含服务端版本。
- 保存接口是否原子检查期望版本。
- 冲突时是否保留本地输入并提供明确选择。
- 路由、抽屉关闭、切换单据是否统一检查 dirty。
- 浏览器刷新或关闭是否配置最后保护。
- 保存中重复点击和迟到响应是否被正确处理。
- 自动保存失败或冲突时是否仍显示真实未保存状态。

## 相关文档

[完整编辑提交流程](../examples/form-workflow.md) · [分页与跨页编辑](./pagination-and-cross-page-editing.md) · [受控数据流](../architecture/controlled-data-flow.md)
