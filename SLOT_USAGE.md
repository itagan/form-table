# FormTable Slot 插槽使用指南

## 概述

FormTable 组件支持使用 slot 插槽来自定义表格列的内容，这提供了极大的灵活性来创建复杂的表单控件。

## 基本用法

### 1. 在 columns 配置中定义插槽

```javascript
const columns = ref([
  {
    name: '学校',
    props: { width: '200px' },
    children: [{
      children: [
        {
          key: 'school',
          type: 'slotComponent',  // 指定类型为插槽组件
          slotName: 'table-school',  // 指定插槽名称
          colSpan: 24
        }
      ]
    }]
  }
])
```

### 2. 在模板中定义插槽内容

```vue
<FormTable
  :table-data="tableData"
  :columns="columns"
  :rules="rules"
  :form-data="formData"
>
  <!-- 学校选择插槽 -->
  <template #table-school="{ row, index }">
    <el-select v-model="row.school" placeholder="请选择学校">
      <el-option label="县一小" value="县一小"></el-option>
      <el-option label="县二中" value="县二中"></el-option>
      <el-option label="市一中" value="市一中"></el-option>
    </el-select>
  </template>
</FormTable>
```

## 插槽参数

每个插槽都会接收以下参数：

- `row`: 当前行的数据对象
- `index`: 当前行的索引

## 示例

### 1. 下拉选择框

```vue
<template #table-school="{ row, index }">
  <el-select v-model="row.school" placeholder="请选择学校">
    <el-option label="县一小" value="县一小"></el-option>
    <el-option label="县二中" value="县二中"></el-option>
    <el-option label="市一中" value="市一中"></el-option>
  </el-select>
</template>
```

### 2. 单选按钮组

```vue
<template #table-gender="{ row, index }">
  <el-radio-group v-model="row.gender">
    <el-radio label="男">男</el-radio>
    <el-radio label="女">女</el-radio>
  </el-radio-group>
</template>
```

### 3. 操作按钮

```vue
<template #table-actions="{ row, index }">
  <el-button size="small" type="primary" @click="handleEditRow(index)">编辑</el-button>
  <el-button size="small" type="danger" @click="handleDeleteRow(index)">删除</el-button>
</template>
```

### 4. 自定义组件

```vue
<template #table-custom="{ row, index }">
  <MyCustomComponent 
    v-model="row.customValue"
    :config="row.config"
    @change="handleCustomChange(index, $event)"
  />
</template>
```

## 注意事项

1. **插槽名称**: 插槽名称必须以 `table-` 开头，例如 `table-school`、`table-gender` 等
2. **数据绑定**: 在插槽中直接使用 `v-model="row.fieldName"` 来绑定数据
3. **事件处理**: 可以通过 `index` 参数来识别当前行，处理行特定的操作
4. **验证规则**: 记得为插槽字段添加相应的验证规则
5. **Vue 2.7 兼容性**: 由于 Vue 2.7 中动态插槽传递的限制，需要在组件中明确定义所有需要传递的插槽名称

## Vue 2.7 兼容性说明

在 Vue 2.7 中，动态插槽传递 `#[slotName]` 语法可能不被完全支持。因此，FormTable 组件采用了显式定义插槽的方式：

```vue
<!-- 在 FormTable 组件中 -->
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

如果需要添加新的插槽，需要在以下组件中都添加相应的定义：
- `src/components/FormTable/index.vue`
- `src/components/FormTable/FormTableColumn.vue`
- `src/components/FormTable/FormTableRow.vue`

## 完整示例

参考 `src/views/FormTableV2View.vue` 文件中的完整示例，包含了多种插槽的使用方式。
