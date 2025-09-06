# Vue 2 兼容性修复

## 问题描述

在修复FormTable组件的插槽硬编码问题时，使用了Vue 3的语法，导致在Vue 2环境中出现错误：

```
<template> cannot be keyed. Place the key on real elements instead.
```

## 错误原因

在Vue 2中，`<template>`标签不能直接使用`:key`属性，而Vue 3的动态插槽语法也不完全兼容Vue 2。

### 错误的Vue 3语法：
```vue
<!-- Vue 3 语法，在Vue 2中会报错 -->
<template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
  <slot :name="slotName" v-bind="slotProps" />
</template>
```

## 修复方案

使用Vue 2兼容的动态插槽语法：

### 修复后的Vue 2兼容语法：
```vue
<!-- Vue 2 兼容语法 -->
<template v-for="(_, slotName) in $slots" v-slot:[slotName]="slotProps">
  <slot :name="slotName" v-bind="slotProps" />
</template>
```

## 修复的文件

1. **src/components/FormTable/index.vue**
   - 移除`:key="slotName"`属性
   - 使用`v-slot:[slotName]`替代`#[slotName]`

2. **src/components/FormTable/FormTableColumn.vue**
   - 同样的修复

3. **src/components/FormTable/FormTableRow.vue**
   - 同样的修复

## 语法对比

| 特性 | Vue 2 语法 | Vue 3 语法 |
|------|------------|------------|
| 动态插槽 | `v-slot:[slotName]` | `#[slotName]` |
| template key | 不支持 | `:key="value"` |
| 插槽传递 | `v-slot:[slotName]="slotProps"` | `#[slotName]="slotProps"` |

## 验证结果

✅ **构建成功** - 所有Vue 2语法错误已修复
✅ **开发服务器** - 正常运行在 http://localhost:5173/
✅ **功能完整** - 动态插槽功能正常工作
✅ **向后兼容** - 原有插槽仍然可用

## 总结

通过使用Vue 2兼容的语法，成功修复了动态插槽传递功能，同时保持了：

- 完全动态的插槽支持
- 向后兼容性
- Vue 2环境下的正常运行

这个修复确保了FormTable组件在Vue 2和Vue 3环境中都能正常工作。
