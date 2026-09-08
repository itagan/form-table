# FormTable 复合字段连续更新显示旧值

## 问题概述

当一个字段通过 `binding.map` 把多个行字段组合成一个复合组件值时，连续修改两个子控件，第二次修改可能基于旧的组合值提交，导致第一次修改被覆盖。最终表现为：表格数据和事件载荷短暂出现新值，但复合组件重新渲染后其中一个控件又显示旧值。

这不是 `binding.map` 的路径拆装错误，而是受控更新的响应时序问题。

## 复现方式

准备一个接收 `value` 并通过 `input` 回传整个对象的复合组件：

```vue
<template>
  <div>
    <el-time-select
      :value="value.start"
      :picker-options="pickerOptions"
      @input="update('start', $event)"
    />
    <el-time-select
      :value="value.end"
      :picker-options="pickerOptions"
      @input="update('end', $event)"
    />
  </div>
</template>

<script>
export default {
  props: { value: { type: Object, default: () => ({ start: '', end: '' }) } },
  data: () => ({
    pickerOptions: { start: '08:00', step: '00:30', end: '22:00' }
  }),
  methods: {
    update(key, value) {
      this.$emit('input', { ...this.value, [key]: value })
    }
  }
}
</script>
```

字段配置：

```ts
{
  fieldKey: 'start',
  type: 'component',
  component: { is: TimeRangeEditor },
  binding: {
    map: [
      { fieldPath: 'start', valuePath: 'start' },
      { fieldPath: 'end', valuePath: 'end' }
    ]
  }
}
```

初始数据：

```ts
{ start: '09:00', end: '18:00' }
```

操作顺序：

1. 先把开始时间改为 `10:00`。
2. 不等待表格父组件完成下一轮渲染，立即把结束时间改为 `18:30`。
3. 观察第二次提交的组合值或组件显示。

实际风险是第二次事件仍从旧的 `{ start: '09:00', end: '18:00' }` 构造对象，提交 `{ start: '09:00', end: '18:30' }`，从而覆盖第一次的 `start` 修改。

## 根因

`useControlledTableUpdate` 已经用 `synchronousUpdateBase` 处理了父组件回写前的连续更新：后续写入会基于最近一次事务结果合并。这只能保证“写回数据”使用最新快照。

但是 `synchronousUpdateBase` 是普通变量，不是响应式状态。字段上下文中的 `bindingValue` 仍然只会在 `tableData` prop 被父组件回写后重新计算：

```text
第一次 input
  → updateRows 生成最新行
  → emit update:tableData
  → synchronousUpdateBase 已更新，但组件未重新渲染
第二次 input
  → 复合组件仍持有旧 value
  → 用旧 value 合并第二个字段
  → 第二次结果覆盖第一次字段
```

## 解决方案

在 `useControlledTableUpdate` 中增加一个响应式 revision：

```ts
const revision = ref(0)

// 每次成功提交事务后
revision.value++
```

把读取 revision 和解析当前行快照的函数通过内部更新协议暴露给字段上下文，并在计算 `bindingValue` 时同时使用它们：

```ts
const bindingValue = computed(() => {
  updateApi.getRevision?.()
  const currentRow = updateApi.getCurrentRow?.(targetRow) ?? targetRow
  return binding ? resolveBindingValue(currentRow, binding) : context.value
})
```

仅增加 revision 并不足够：字段原有的 `targetRow` 仍可能是渲染时旧引用，重新计算后依然会读出旧值。`getCurrentRow` 必须按当前同步快照和行身份重新定位目标行。这样每次同步事务都会触发字段上下文重新计算，即使父组件尚未回写 `tableData`，复合组件也会立即收到最新组合值。下一次子控件事件就会基于 `{ start: '10:00', end: '18:00' }` 继续合并。

该方案具有以下约束：

- 不改变 `binding.map`、`updateRow` 或公开组件 API。
- 仍然以父组件受控 `tableData` 为长期数据来源；同步快照只覆盖当前微任务。
- 不直接修改原始行对象。
- 普通单字段输入也会获得同样的即时响应式刷新，但不会改变其值语义。
- 配置 listener 仍接收事件触发时的字段上下文快照，不会因 model 写回后的 revision 递增而变成新值。

## 验收测试

至少覆盖以下场景：

1. 复合字段连续修改两个子控件，第二次结果同时保留第一次修改。
2. 两次修改之间等待父组件回写，结果与不等待时一致。
3. 连续修改同一子控件，最终值为最后一次输入。
4. `binding.map` 中存在两个以上路径时，所有路径均基于最新组合值提交。
5. 父组件在微任务结束后传入外部新数据时，内部 revision 不会继续覆盖受控 prop。
6. 普通非复合字段、`field-change` 事件和不可变行更新的现有测试继续通过。

浏览器回归建议使用真实 Element 控件，验证两个输入框最终显示最新值，而不仅仅断言 `update:tableData` 事件载荷。
