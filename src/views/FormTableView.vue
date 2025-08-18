<template>
  <div class="form-table-demo">
    <h1>FormTable 组件演示</h1>
    
    <div class="demo-section">
      <h2>基础用法</h2>
      <FormTable
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        :rules="rules"
        :form-data="formData"
        @update:table-data="handleTableDataUpdate"
        @update:form-data="handleFormDataUpdate"
      >
        <template #table-school="{ row, index }">
          <el-select v-model="row.school" placeholder="请选择学校">
            <el-option label="县一小" value="县一小"></el-option>
            <el-option label="县二中" value="县二中"></el-option>
            <el-option label="市一中" value="市一中"></el-option>
          </el-select>
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
import FormTable from '@/components/FormTable.vue'

const tableData = ref([
  { name: '小米', age: 16, sex: '男', school: '县一小' },
  { name: '小2米', age: 32, sex: '男', school: '' }
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
  'tableData.*.sex': [{ required: true, message: '请选择性别', trigger: 'change' }],
  'tableData.*.school': [{ required: true, message: '请选择学校', trigger: 'change' }]
})

const columns = ref([
  {
    name: '姓名和年龄',
    props: { width: '300px' },
    children: [{
      bind: { gutter: 10 },
      children: [
        {
          colSpan: 12,
          elFormItemProps: { key: 'name' },
          elInputProps: { placeholder: '请输入姓名' },
          type: 'input'
        },
        {
          colSpan: 12,
          elFormItemProps: { key: 'age' },
          elInputProps: { placeholder: '请输入年龄', type: 'number' },
          type: 'input'
        }
      ]
    }]
  },
  {
    name: '性别',
    props: { width: '150px' },
    children: [{
      bind: {},
      children: [{
        bind: {},
        isUseTooltip: true,
        elFormItemProps: { key: 'sex' },
        elInputProps: { placeholder: '请输入性别' },
        type: 'input'
      }]
    }]
  },
  {
    name: '学校',
    props: { width: '200px' },
    children: [{
      bind: {},
      children: [{
        bind: {},
        isUseTooltip: false,
        elFormItemProps: { key: 'school' },
        type: 'slotComponent',
        slotName: 'table-school'
      }]
    }]
  }
] as any)

const formTableRef = ref()

const handleTableDataUpdate = (newData: any[]) => {
  tableData.value = newData
  formData.tableData = newData
}

const handleFormDataUpdate = (newData: any) => {
  Object.assign(formData, newData)
}

const handleSubmit = async () => {
  try {
    await formTableRef.value?.validate()
    console.log('表单验证通过', tableData.value)
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

const handleReset = () => {
  formTableRef.value?.resetFields()
}

const handleAddRow = () => {
  tableData.value.push({ name: '', age: 0, sex: '', school: '' })
}

const handleRemoveRow = () => {
  if (tableData.value.length > 1) {
    tableData.value.pop()
  }
}
</script>

<style lang="less" scoped>
.form-table-demo {
  padding: 20px;
  max-width: 1200px;
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
