# 宽表横向滚动与字段定位

当列数很多或列宽固定时，Element Table 会在主表体底部出现横向滚动条。页面可以通过 FormTable 的 `getTableRef()` 提供“滚到首列”“滚到末列”或“定位指定字段”等快捷操作，无需把横向滚动状态放进 FormTable 数据模型。

可运行示例：[`/horizontal-scroll`](http://localhost:5173/horizontal-scroll)

## 获取当前表格的滚动容器

始终从当前 FormTable Ref 向下查询，避免页面存在多个表格时操作到错误实例：

```ts
const getHorizontalScroller = () => {
  const tableElement = formTableRef.value?.getTableRef()?.$el as HTMLElement | undefined
  return tableElement?.querySelector<HTMLElement>('.el-table__body-wrapper') || null
}
```

`.el-table__body-wrapper` 是 Element UI 2.x 的主表体滚动容器。FormTable 不复制滚动位置，也不额外创建滚动层。

## 滚动到首部或末尾

```ts
const scrollToEdge = async (edge: 'start' | 'end') => {
  await nextTick()
  const scroller = getHorizontalScroller()
  if (!scroller) return false

  scroller.scrollTo({
    left: edge === 'start' ? 0 : scroller.scrollWidth,
    behavior: 'smooth'
  })
  return true
}
```

`scrollWidth` 大于可滚动上限没有关系，浏览器会自动限制为 `scrollWidth - clientWidth`。不需要动画时直接设置 `scroller.scrollLeft`，也更适合需要兼容旧浏览器的项目。

```ts
scroller.scrollLeft = edge === 'start'
  ? 0
  : scroller.scrollWidth - scroller.clientWidth
```

## 定位到指定字段节点

先通过现有透传入口添加稳定业务 class。根据想定位的层级，可以使用 `colProps.class`、`formItemProps.class` 或 `component.props.class`：

```ts
{
  label: '配送地址',
  props: { width: 280 },
  formItems: [{
    fieldKey: 'address',
    type: 'input',
    colProps: { class: 'scroll-target-address' }
  }]
}
```

然后只在主表体中寻找目标，并通过矩形差值计算新的横向位置：

```ts
const scrollToTarget = async (selector: string) => {
  await nextTick()
  const scroller = getHorizontalScroller()
  const target = scroller?.querySelector<HTMLElement>(selector)
  if (!scroller || !target) return false

  const scrollerRect = scroller.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const centeredLeft = scroller.scrollLeft
    + targetRect.left - scrollerRect.left
    - (scroller.clientWidth - targetRect.width) / 2

  const maxLeft = scroller.scrollWidth - scroller.clientWidth
  scroller.scrollTo({
    left: Math.min(maxLeft, Math.max(0, centeredLeft)),
    behavior: 'smooth'
  })
  return true
}

await scrollToTarget('.scroll-target-address')
```

这种计算只修改表格横向滚动位置。不要直接调用 `target.scrollIntoView()`，因为它可能同时滚动页面或外层纵向容器。

## 与字段 API 的区别

`focusField(row, fieldKey)` 面向某一行已挂载字段的聚焦与表单导航；这里的横向定位面向整个宽表的展示位置。两者可以组合：

```ts
await scrollToTarget('.scroll-target-address')
await formTableRef.value?.focusField(tableData.value[0], 'address')
```

如果目标只是某一行的具体字段，也可以先用 `getFieldProp(row, fieldKey)` 得到 FormItem 路径，再在主表体内查找对应的 `data-form-table-field-prop`。业务 class 更适合稳定列定位，字段路径更适合指定行定位。

## 边界与封装建议

- 动态列或字段尚未挂载时查询会返回 `null`；替换 `columns` 后应等待 `nextTick()`。
- 固定列由 Element UI 渲染为独立镜像区域。目标查询应限定在 `.el-table__body-wrapper`，避免命中固定列副本。
- 多行数据会产生多个同名业务 class；列定位通常取主表体中第一个即可，指定行时应结合字段路径。
- `.el-table__body-wrapper` 属于 Element UI 2.x 的 DOM 结构，而不是 FormTable 新增的公共 API。项目升级到其他表格实现时应重新验证。
- 多个页面重复使用时，将上述函数封装为业务侧 `useFormTableHorizontalScroll`；滚动行为、居中方式和动画偏好继续由页面决定。
- SSR 阶段没有 DOM，只在挂载完成后的用户事件或 `nextTick()` 中调用。

节点 class 的具体透传层级见[样式定位与属性透传](./style-props.md)，Element Table Ref 的能力边界见[事件与 Ref API](../api/events-and-ref.md#ref)。
