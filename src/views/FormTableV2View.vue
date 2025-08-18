<template>
  <div class="form-table-v2-demo">
    <h1>FormTable V2 优化版本演示</h1>
    
    <div class="demo-section">
      <h2>基础用法</h2>
      <FormTableV2
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        :rules="rules"
        :form-data="formData"
        :loading="loading"
        @update:table-data="handleTableDataUpdate"
      />
      
      <div class="actions">
        <el-button type="primary" @click="handleSubmit">提交表单</el-button>
        <el-button @click="handleReset">重置表单</el-button>
        <el-button @click="handleAddRow">添加行</el-button>
        <el-button @click="handleRemoveRow">删除行</el-button>
        <el-button @click="toggleLoading">切换加载状态</el-button>
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
import FormTableV2 from '@/components/FormTableV2.vue'

const tableData = ref([
  { name: '张三', age: 25, department: '技术部', status: true },
  { name: '李四', age: 30, department: '产品部', status: true }
])

const formData = reactive({
  tableData: tableData.value
})

const loading = ref(false)

const rules = ref({
  'tableData.*.name': [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  'tableData.*.age': [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 18, max: 65, message: '年龄必须在18-65之间', trigger: 'blur' }
  ]
})

const columns = ref([
  {
    name: '基本信息',
    props: { width: '400px' },
    children: [{
      gutter: 10,
      children: [
        {
          key: 'name',
          type: 'input',
          colSpan: 12,
          placeholder: '请输入姓名'
        },
        {
          key: 'age',
          type: 'number',
          colSpan: 12,
          placeholder: '请输入年龄'
        }
      ]
    }]
  },
  {
    name: '工作信息',
    props: { width: '300px' },
    children: [{
      children: [
        {
          key: 'department',
          type: 'input',
          colSpan: 12,
          placeholder: '请输入部门'
        },
        {
          key: 'status',
          type: 'switch',
          colSpan: 12
        }
      ]
    }]
  }
])

const formTableRef = ref()

const handleTableDataUpdate = (newData: any[]) => {
  tableData.value = newData
  formData.tableData = newData
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
  formTableRef.value?.addRow({
    name: '',
    age: 0,
    department: '',
    status: true
  })
}

const handleRemoveRow = () => {
  if (tableData.value.length > 1) {
    formTableRef.value?.removeRow(tableData.value.length - 1)
  }
}

const toggleLoading = () => {
  loading.value = !loading.value
  if (loading.value) {
    setTimeout(() => {
      loading.value = false
    }, 2000)
  }
}
</script>

<style lang="less" scoped>
.form-table-v2-demo {
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
