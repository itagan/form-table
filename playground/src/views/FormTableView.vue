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
        @update:tableData="handleTableDataUpdate"
        @update:formData="handleFormDataUpdate"
      />
      
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
import { Message } from 'element-ui'
import FormTable from '@itagan/form-table'
import type {
  ColumnConfig,
  FormTableExpose,
  FormTableRecord,
  TableRow
} from '@itagan/form-table'

const tableData = ref<TableRow[]>([
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

const columns = ref<ColumnConfig[]>([
  {
    name: '姓名和年龄',
    props: { width: '300px' },
    fieldRow: { gutter: 10 },
    fields: [
      {
        key: 'name',
        type: 'input',
        placeholder: '请输入姓名',
        required: true,
        layout: { span: 12 }
      },
      {
        key: 'age',
        type: 'number',
        placeholder: '请输入年龄',
        required: true,
        layout: { span: 12 }
      }
    ]
  },
  {
    name: '性别',
    props: { width: '150px' },
    fields: [
      {
        key: 'sex',
        type: 'input',
        placeholder: '请输入性别',
        required: true
      }
    ]
  },
  {
    name: '学校',
    props: { width: '200px' },
    fields: [
      {
        key: 'school',
        type: 'select',
        placeholder: '请选择学校',
        required: true,
        options: [
          { label: '县一小', value: '县一小' },
          { label: '县二中', value: '县二中' },
          { label: '市一中', value: '市一中' }
        ]
      }
    ]
  }
])

const formTableRef = ref<FormTableExpose>()

const handleTableDataUpdate = (newData: TableRow[]) => {
  tableData.value = newData
}

const handleFormDataUpdate = (newData: FormTableRecord) => {
  Object.assign(formData, newData)
}

const handleSubmit = async () => {
  const valid = await formTableRef.value?.validate()
  if (valid) {
    Message.success('表单验证通过')
    return
  }

  Message.error('表单验证失败，请检查输入')
}

const handleReset = () => {
  formTableRef.value?.resetFields()
}

const handleAddRow = () => {
  formTableRef.value?.addRow({ name: '', age: 0, sex: '', school: '' })
}

const handleRemoveRow = () => {
  if (tableData.value.length > 1) {
    formTableRef.value?.removeRow(tableData.value.length - 1)
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
