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
        @update:tableData="handleTableDataUpdate"
      >
        <!-- 自定义学校选择器 -->
        <template #custom-school="{ value, setValue }">
          <el-select
            :value="value"
            placeholder="请选择学校"
            style="width: 100%"
            @input="setValue"
          >
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
        <template #rating-input="{ value, setValue }">
          <el-rate 
            :value="value" 
            :max="5" 
            show-score 
            text-color="#ff9900"
            @input="setValue"
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
import { Message } from 'element-ui'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose, TableRow } from '@itagan/form-table'

const tableData = ref<TableRow[]>([
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

const columns = ref<ColumnConfig[]>([
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
          layout: {
            span: 24
          },
          component: {
            bind: {
              placeholder: '请输入姓名'
            }
          }
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
        layout: {
          span: 24
        },
        component: {
          bind: {
            placeholder: '请输入年龄'
          }
        }
      }]
    }]
  },
  {
    name: '学校',
    props: { width: '200px' },
    children: [{
      children: [{
        key: 'school',
        type: 'slot',
        label: '学校',
        layout: {
          span: 24
        },
        component: {
          slotName: 'custom-school'
        }
      }]
    }]
  },
  {
    name: '状态',
    props: { width: '120px' },
    children: [{
      children: [{
        key: 'status',
        type: 'slot',
        label: '状态',
        layout: {
          span: 24
        },
        component: {
          slotName: 'status-display'
        }
      }]
    }]
  },
  {
    name: '评分',
    props: { width: '150px' },
    children: [{
      children: [{
        key: 'rating',
        type: 'slot',
        label: '评分',
        layout: {
          span: 24
        },
        component: {
          slotName: 'rating-input'
        }
      }]
    }]
  },
  {
    name: '操作',
    props: { width: '200px' },
    children: [{
      children: [{
        key: 'actions',
        type: 'slot',
        label: '操作',
        layout: {
          span: 24
        },
        component: {
          slotName: 'row-actions'
        }
      }]
    }]
  }
])

const formTableRef = ref<FormTableExpose>()

const handleTableDataUpdate = (newData: TableRow[]) => {
  tableData.value = newData
}

const handleSubmit = async () => {
  const valid = await formTableRef.value?.validate()
  if (valid) {
    Message.success('表单提交成功！')
    return
  }

  Message.error('表单验证失败，请检查输入')
}

const handleReset = () => {
  formTableRef.value?.resetFields()
  Message.info('表单已重置')
}

const handleAddRow = () => {
  formTableRef.value?.addRow({
    name: '', 
    age: 0, 
    school: '', 
    status: 'active',
    rating: 0
  })
  Message.success('已添加新行')
}

const handleRemoveRow = () => {
  if (tableData.value.length > 1) {
    formTableRef.value?.removeRow(tableData.value.length - 1)
    Message.success('已删除最后一行')
  } else {
    Message.warning('至少需要保留一行数据')
  }
}

const getStatusType = (status: string) => {
  return status === 'active' ? 'success' : 'danger'
}

const getStatusText = (status: string) => {
  return status === 'active' ? '激活' : '禁用'
}

const editRow = (row: TableRow, index: number) => {
  Message.info(`编辑第 ${index + 1} 行: ${row.name}`)
}

const copyRow = (row: TableRow, index: number) => {
  const newRow = { ...row, name: row.name + '_副本' }
  formTableRef.value?.insertRow(index + 1, newRow)
  Message.success(`已复制第 ${index + 1} 行`)
}

const deleteRow = (index: number) => {
  if (tableData.value.length > 1) {
    formTableRef.value?.removeRow(index)
    Message.success(`已删除第 ${index + 1} 行`)
  } else {
    Message.warning('至少需要保留一行数据')
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
