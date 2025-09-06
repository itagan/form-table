<template>
  <div class="dynamic-slot-test">
    <h1>FormTable 动态插槽测试</h1>
    
    <div class="demo-section">
      <h2>动态插槽功能演示</h2>
      <FormTable
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        :rules="rules"
        :form-data="formData"
        @update:table-data="handleTableDataUpdate"
      >
        <!-- 自定义学校选择器 -->
        <template #custom-school="{ row, index }">
          <el-select v-model="row.school" placeholder="请选择学校" style="width: 100%">
            <el-option label="清华大学" value="清华大学"></el-option>
            <el-option label="北京大学" value="北京大学"></el-option>
            <el-option label="复旦大学" value="复旦大学"></el-option>
            <el-option label="上海交大" value="上海交大"></el-option>
          </el-select>
        </template>
        
        <!-- 状态标签 -->
        <template #status-display="{ row, index }">
          <el-tag 
            :type="getStatusType(row.status)" 
            size="small"
          >
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
        
        <!-- 操作按钮 -->
        <template #row-actions="{ row, index }">
          <el-button-group size="small">
            <el-button type="primary" @click="editRow(row, index)">编辑</el-button>
            <el-button type="success" @click="copyRow(row, index)">复制</el-button>
            <el-button type="danger" @click="deleteRow(index)">删除</el-button>
          </el-button-group>
        </template>
        
        <!-- 评分组件 -->
        <template #rating-input="{ row, index }">
          <el-rate 
            v-model="row.rating" 
            :max="5" 
            show-score 
            text-color="#ff9900"
          />
        </template>
      </FormTable>
      
      <div class="actions">
        <el-button type="primary" @click="handleSubmit">提交表单</el-button>
        <el-button @click="handleReset">重置表单</el-button>
        <el-button @click="handleAddRow">添加行</el-button>
        <el-button @click="handleRemoveRow">删除行</el-button>
      </div>
    </div>

    <div class="demo-section">
      <h2>当前数据</h2>
      <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import FormTable from '@/components/FormTable/index.vue'

const tableData = ref([
  { 
    name: '张三', 
    age: 20, 
    school: '清华大学', 
    status: 'active',
    rating: 4
  },
  { 
    name: '李四', 
    age: 22, 
    school: '北京大学', 
    status: 'inactive',
    rating: 3
  }
])

const formData = reactive({
  tableData: tableData.value
})

const rules = ref({
  'tableData.*.name': [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  'tableData.*.age': [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 1, max: 120, message: '年龄必须在1-120之间', trigger: 'blur' }
  ],
  'tableData.*.school': [{ required: true, message: '请选择学校', trigger: 'change' }],
  'tableData.*.status': [{ required: true, message: '请选择状态', trigger: 'change' }]
})

const columns = ref([
  {
    name: '基本信息',
    props: { width: '200px' },
    children: [{
      bind: { gutter: 10 },
      children: [
        {
          key: 'name',
          type: 'input',
          label: '姓名',
          placeholder: '请输入姓名',
          colSpan: 24
        }
      ]
    }]
  },
  {
    name: '年龄',
    props: { width: '100px' },
    children: [{
      children: [{
        key: 'age',
        type: 'number',
        label: '年龄',
        placeholder: '请输入年龄',
        colSpan: 24
      }]
    }]
  },
  {
    name: '学校',
    props: { width: '200px' },
    children: [{
      children: [{
        key: 'school',
        type: 'slotComponent',
        slotName: 'custom-school',
        label: '学校',
        colSpan: 24
      }]
    }]
  },
  {
    name: '状态',
    props: { width: '120px' },
    children: [{
      children: [{
        key: 'status',
        type: 'slotComponent',
        slotName: 'status-display',
        label: '状态',
        colSpan: 24
      }]
    }]
  },
  {
    name: '评分',
    props: { width: '150px' },
    children: [{
      children: [{
        key: 'rating',
        type: 'slotComponent',
        slotName: 'rating-input',
        label: '评分',
        colSpan: 24
      }]
    }]
  },
  {
    name: '操作',
    props: { width: '200px' },
    children: [{
      children: [{
        key: 'actions',
        type: 'slotComponent',
        slotName: 'row-actions',
        label: '操作',
        colSpan: 24
      }]
    }]
  }
] as any)

const formTableRef = ref()

const handleTableDataUpdate = (newData: any[]) => {
  tableData.value = newData
  formData.tableData = newData
}

const handleSubmit = async () => {
  try {
    await formTableRef.value?.validate()
    console.log('表单验证通过', tableData.value)
    ElMessage.success('表单提交成功！')
  } catch (error) {
    console.log('表单验证失败', error)
    ElMessage.error('表单验证失败，请检查输入')
  }
}

const handleReset = () => {
  formTableRef.value?.resetFields()
  ElMessage.info('表单已重置')
}

const handleAddRow = () => {
  tableData.value.push({ 
    name: '', 
    age: 0, 
    school: '', 
    status: 'active',
    rating: 0
  })
  ElMessage.success('已添加新行')
}

const handleRemoveRow = () => {
  if (tableData.value.length > 1) {
    tableData.value.pop()
    ElMessage.success('已删除最后一行')
  } else {
    ElMessage.warning('至少需要保留一行数据')
  }
}

const getStatusType = (status: string) => {
  return status === 'active' ? 'success' : 'danger'
}

const getStatusText = (status: string) => {
  return status === 'active' ? '激活' : '禁用'
}

const editRow = (row: any, index: number) => {
  ElMessage.info(`编辑第 ${index + 1} 行: ${row.name}`)
}

const copyRow = (row: any, index: number) => {
  const newRow = { ...row, name: row.name + '_副本' }
  tableData.value.splice(index + 1, 0, newRow)
  ElMessage.success(`已复制第 ${index + 1} 行`)
}

const deleteRow = (index: number) => {
  if (tableData.value.length > 1) {
    tableData.value.splice(index, 1)
    ElMessage.success(`已删除第 ${index + 1} 行`)
  } else {
    ElMessage.warning('至少需要保留一行数据')
  }
}
</script>

<style lang="less" scoped>
.dynamic-slot-test {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  h1 {
    color: #303133;
    margin-bottom: 30px;
    text-align: center;
  }

  .demo-section {
    margin-bottom: 40px;
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background: #fff;

    h2 {
      color: #606266;
      margin-bottom: 20px;
    }

    .actions {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;

      .el-button {
        margin-right: 10px;
      }
    }

    pre {
      background: #f5f7fa;
      padding: 15px;
      border-radius: 4px;
      font-size: 12px;
      overflow-x: auto;
    }
  }
}
</style>
