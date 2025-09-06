# FormTable 插槽修复示例

## 修复前的问题

### 硬编码插槽名称
```vue
<!-- 修复前：硬编码特定插槽名称 -->
<template #table-school="slotProps">
  <slot name="table-school" v-bind="slotProps" />
</template>
<template #table-gender="slotProps">
  <slot name="table-gender" v-bind="slotProps" />
</template>
<template #table-actions="slotProps">
  <slot name="table-actions" v-bind="slotProps" />
</template>
```

**问题：**
- 违反公共组件设计原则
- 无法支持用户自定义插槽名称
- 扩展性差，维护困难

## 修复后的解决方案

### 动态插槽传递
```vue
<!-- 修复后：动态传递所有具名插槽 -->
<template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
  <slot :name="slotName" v-bind="slotProps" />
</template>
```

**优势：**
- ✅ 完全动态，支持任意插槽名称
- ✅ 符合公共组件设计原则
- ✅ 无需修改组件代码即可添加新插槽
- ✅ 代码简洁，维护性好

## 使用示例

### 基础用法
```vue
<template>
  <FormTable
    :table-data="tableData"
    :columns="columns"
    :rules="rules"
  >
    <!-- 现在可以使用任意插槽名称 -->
    <template #custom-select="{ row, index }">
      <el-select v-model="row.customField" placeholder="自定义选择">
        <el-option label="选项1" value="option1"></el-option>
        <el-option label="选项2" value="option2"></el-option>
      </el-select>
    </template>
    
    <template #status-tag="{ row, index }">
      <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
        {{ row.status === 'active' ? '激活' : '禁用' }}
      </el-tag>
    </template>
    
    <template #action-buttons="{ row, index }">
      <el-button size="small" @click="editRow(row, index)">编辑</el-button>
      <el-button size="small" type="danger" @click="deleteRow(index)">删除</el-button>
    </template>
  </FormTable>
</template>
```

### 配置示例
```typescript
const columns = [
  {
    name: '自定义选择',
    children: [{
      children: [{
        key: 'customField',
        type: 'slotComponent',
        slotName: 'custom-select' // 对应插槽名称
      }]
    }]
  },
  {
    name: '状态',
    children: [{
      children: [{
        key: 'status',
        type: 'slotComponent',
        slotName: 'status-tag'
      }]
    }]
  },
  {
    name: '操作',
    children: [{
      children: [{
        key: 'actions',
        type: 'slotComponent',
        slotName: 'action-buttons'
      }]
    }]
  }
]
```

## 向后兼容性

修复后的组件完全向后兼容：

- ✅ 原有的 `table-school`、`table-gender`、`table-actions` 插槽仍然可用
- ✅ 现有的配置无需修改
- ✅ 可以同时使用新旧插槽名称

## 技术实现

### Vue 3 动态插槽语法
```vue
<!-- 使用 v-for 和动态插槽名称 -->
<template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
  <slot :name="slotName" v-bind="slotProps" />
</template>
```

### 类型定义更新
```typescript
// 新增插槽配置类型
export interface SlotConfig {
  name: string
  scope?: Record<string, any>
}

// 表单项配置支持新的插槽方式
export interface FormItemConfig {
  // ... 其他属性
  slotName?: string // 兼容旧版本
  slot?: SlotConfig // 新的插槽配置方式
}
```

## 总结

通过这次修复，FormTable组件现在：

1. **完全动态化** - 支持任意插槽名称
2. **符合设计原则** - 真正的公共组件设计
3. **向后兼容** - 不影响现有使用
4. **易于扩展** - 无需修改组件代码即可添加新功能
5. **维护性好** - 代码简洁，逻辑清晰

这是一个典型的公共组件设计改进案例，从硬编码转向动态配置，大大提升了组件的灵活性和可维护性。
