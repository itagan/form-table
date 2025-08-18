# FormTable 组件使用示例

## 快速开始

### 1. 基础用法

```vue
<template>
  <div>
    <FormTable
      :table-data="tableData"
      :columns="columns"
      :rules="rules"
      :form-data="formData"
      @update:table-data="handleTableDataUpdate"
    />
    
    <el-button @click="handleSubmit">提交</el-button>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import FormTable from '@/components/FormTable.vue'

// 表格数据
const tableData = ref([
  { name: '张三', age: 25, department: '技术部' },
  { name: '李四', age: 30, department: '产品部' }
])

// 表单数据
const formData = reactive({
  tableData: tableData.value
})

// 验证规则
const rules = ref({
  'tableData.*.name': [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  'tableData.*.age': [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 18, max: 65, message: '年龄必须在18-65之间', trigger: 'blur' }
  ]
})

// 列配置
const columns = ref([
  {
    name: '姓名',
    props: { width: '150px' },
    children: [{
      bind: {},
      children: [{
        bind: {},
        elFormItemProps: { key: 'name' },
        elInputProps: { placeholder: '请输入姓名' },
        type: 'input'
      }]
    }]
  },
  {
    name: '年龄',
    props: { width: '150px' },
    children: [{
      bind: {},
      children: [{
        bind: {},
        elFormItemProps: { key: 'age' },
        elInputProps: { placeholder: '请输入年龄', type: 'number' },
        type: 'input'
      }]
    }]
  },
  {
    name: '部门',
    props: { width: '200px' },
    children: [{
      bind: {},
      children: [{
        bind: {},
        elFormItemProps: { key: 'department' },
        type: 'slotComponent',
        slotName: 'department-select'
      }]
    }]
  }
])

// 事件处理
const handleTableDataUpdate = (newData) => {
  tableData.value = newData
  formData.tableData = newData
}

const handleSubmit = async () => {
  // 表单验证和提交逻辑
  console.log('提交数据:', tableData.value)
}
</script>
```

### 2. 使用自定义插槽

```vue
<template>
  <FormTable
    :table-data="tableData"
    :columns="columns"
    :rules="rules"
    :form-data="formData"
  >
    <!-- 自定义部门选择器 -->
    <template #department-select="{ row }">
      <el-select v-model="row.department" placeholder="请选择部门">
        <el-option label="技术部" value="技术部"></el-option>
        <el-option label="产品部" value="产品部"></el-option>
        <el-option label="设计部" value="设计部"></el-option>
        <el-option label="运营部" value="运营部"></el-option>
      </el-select>
    </template>
  </FormTable>
</template>
```

### 3. 使用 Tooltip

```javascript
const columns = ref([
  {
    name: '备注',
    props: { width: '200px' },
    children: [{
      bind: {},
      children: [{
        bind: {},
        isUseTooltip: true, // 启用 tooltip
        elFormItemProps: { key: 'remark' },
        elTooltipProps: { placement: 'top' },
        elInputProps: { placeholder: '请输入备注' },
        type: 'input'
      }]
    }]
  }
])
```

### 4. 多列布局

```javascript
const columns = ref([
  {
    name: '基本信息',
    props: { width: '300px' },
    children: [{
      bind: { gutter: 10 }, // 设置列间距
      children: [
        {
          colSpan: 12, // 占一半宽度
          elFormItemProps: { key: 'name' },
          elInputProps: { placeholder: '姓名' },
          type: 'input'
        },
        {
          colSpan: 12, // 占一半宽度
          elFormItemProps: { key: 'age' },
          elInputProps: { placeholder: '年龄', type: 'number' },
          type: 'input'
        }
      ]
    }]
  }
])
```

## 配置说明

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| tableData | Array | [] | 表格数据数组 |
| columns | Array | [] | 列配置数组 |
| rules | Object | {} | 表单验证规则 |
| formData | Object | {} | 表单数据对象 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| update:tableData | (newData: Array) | 表格数据更新时触发 |
| update:formData | (newData: Object) | 表单数据更新时触发 |

### 列配置结构

```javascript
{
  name: '列名',
  props: {}, // el-table-column 的属性
  children: [
    {
      bind: {}, // el-row 的属性
      children: [
        {
          colSpan: 12, // el-col 的 span
          bind: {}, // el-col 的属性
          isUseTooltip: false, // 是否使用 tooltip
          elFormItemProps: {
            key: 'fieldName', // 表单字段名
            rules: [] // 验证规则
          },
          elTooltipProps: {}, // el-tooltip 的属性
          elInputProps: {}, // el-input 的属性
          type: 'input', // 类型: input, text, slotComponent
          slotName: 'slot-name' // 插槽名称（当 type 为 slotComponent 时）
        }
      ]
    }
  ]
}
```

## 访问演示页面

启动开发服务器后，访问以下地址查看完整演示：

- 首页: `http://localhost:5173/`
- FormTable 演示: `http://localhost:5173/form-table`

演示页面包含：
- 基础用法示例
- 表单验证演示
- 动态添加/删除行
- 自定义插槽组件
- 实时数据展示
