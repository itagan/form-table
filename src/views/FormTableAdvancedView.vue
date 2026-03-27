<template>
  <div class="form-table-advanced-demo">
    <h1>FormTable 高级示例</h1>
    
    <div class="demo-section">
      <h2>Slot 插槽使用说明</h2>
      <p>本示例展示了如何使用 slot 插槽来自定义表格列的内容：</p>
      <ul>
        <li><strong>学校选择插槽 (#table-school)</strong>: 使用 el-select 组件进行学校选择</li>
        <li><strong>性别选择插槽 (#table-gender)</strong>: 使用 el-radio-group 组件进行性别选择</li>
        <li><strong>操作按钮插槽 (#table-actions)</strong>: 使用自定义按钮进行行操作</li>
      </ul>
      <p>在 columns 配置中，使用 <code>type: 'slotComponent'</code> 和 <code>slotName: 'table-xxx'</code> 来指定插槽。</p>
    </div>
    
    <div class="demo-section">
      <h2>基础用法</h2>
      
      <!-- 直接测试自定义组件 -->
      <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc;">
        <h3>直接测试自定义组件</h3>
        <SimpleTest v-model="tableData[0].simpleTest" />
        <p>当前值: {{ tableData[0].simpleTest }}</p>
      </div>
      
      <FormTable
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        :rules="rules"
        :form-data="formData"
        :loading="loading"
        :custom-components="customComponents"
        @update:tableData="handleTableDataUpdate"
        @event="handleFormTableEvent"
      >
        <!-- 学校选择插槽 -->
        <template #table-school="{ row, index }">
          <el-select v-model="row.school" placeholder="请选择学校">
            <el-option label="县一小" value="县一小"></el-option>
            <el-option label="县二中" value="县二中"></el-option>
            <el-option label="市一中" value="市一中"></el-option>
            <el-option label="省实验中学" value="省实验中学"></el-option>
          </el-select>
        </template>
        
        <!-- 性别选择插槽 -->
        <template #table-gender="{ row, index }">
          <el-radio-group v-model="row.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </template>
        
        <!-- 操作按钮插槽 -->
        <template #table-actions="{ row, index }">
          <el-button size="small" type="primary" @click="handleEditRow(index)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDeleteRow(index)">删除</el-button>
        </template>
      </FormTable>
      
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

    <div class="demo-section">
      <h2>统一事件日志</h2>
      <pre>{{ JSON.stringify(eventLog, null, 2) }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue'
import FormTable from '@/components/FormTable/index.vue'
import PhoneInput from '@/components/CustomComponents/PhoneInput.vue'
import StatusTag from '@/components/CustomComponents/StatusTag.vue'
import TestComponent from '@/components/CustomComponents/TestComponent.vue'
import SimpleTest from '@/components/CustomComponents/SimpleTest.vue'
import type { ColumnConfig } from '@/components/FormTable/types'

const tableData = ref([
  { 
    name: '张三', 
    age: 25, 
    department: '技术部', 
    level: 'senior',
    remark: '负责核心模块与需求拆解。',
    status: true,
    phone: '13800138000',
    workStatus: 'processing',
    testValue: 'test',
    simpleTest: '默认值',
    school: '县一小',
    gender: '男'
  },
  { 
    name: '李四', 
    age: 30, 
    department: '产品部', 
    level: 'mid',
    remark: '跟进跨部门协作与需求排期。',
    status: false,
    phone: '13900139000',
    workStatus: 'pending',
    testValue: 'success',
    simpleTest: '新值',
    school: '市一中',
    gender: '女'
  }
])

const formData = reactive({
  tableData: tableData.value
})

// 监听 tableData 变化，同步更新 formData
watch(tableData, (newData: any[]) => {
  formData.tableData = newData
}, { deep: true, immediate: true })

const loading = ref(false)
const eventLog = ref<Array<{ type: string; args: any[] }>>([])

// 自定义组件配置
const customComponents = ref([
  {
    name: 'PhoneInput',
    component: PhoneInput
  },
  {
    name: 'StatusTag',
    component: StatusTag
  },
  {
    name: 'TestComponent',
    component: TestComponent
  },
  {
    name: 'SimpleTest',
    component: SimpleTest
  }
])





const rules = ref({
  'tableData.*.name': [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  'tableData.*.age': [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 18, max: 65, message: '年龄必须在18-65之间', trigger: 'blur' }
  ],
  'tableData.*.level': [{ required: true, message: '请选择职级', trigger: 'change' }],
  'tableData.*.phone': [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  'tableData.*.school': [{ required: true, message: '请选择学校', trigger: 'change' }],
  'tableData.*.gender': [{ required: true, message: '请选择性别', trigger: 'change' }]
})

const columns = ref<ColumnConfig[]>([
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
          placeholder: '请输入姓名',
          bind: {
            maxlength: 20,
            clearable: true
          }
        },
        {
          key: 'age',
          type: 'number',
          colSpan: 12,
          placeholder: '请输入年龄',
          bind: {
            controlsPosition: 'right'
          }
        }
      ]
    }]
  },
  {
    name: '联系方式',
    props: { width: '300px' },
    children: [{
      children: [
        {
          key: 'phone',
          type: 'custom',
          customComponent: 'PhoneInput',
          colSpan: 24,
          placeholder: '请输入手机号',
          bind: {
            clearable: true
          }
        }
      ]
    }]
  },
  {
    name: '工作信息',
    props: { width: '420px' },
    children: [{
      children: [
        {
          key: 'department',
          type: 'input',
          colSpan: 10,
          placeholder: '请输入部门'
        },
        {
          key: 'level',
          type: 'select',
          colSpan: 14,
          placeholder: '请选择职级',
          options: [
            { label: '初级', value: 'junior' },
            { label: '中级', value: 'mid' },
            { label: '高级', value: 'senior' }
          ],
          bind: {
            filterable: true
          }
        },
        {
          key: 'remark',
          type: 'textarea',
          colSpan: 24,
          placeholder: '请输入备注',
          bind: {
            rows: 2,
            maxlength: 60,
            showWordLimit: true
          }
        },
        {
          key: 'status',
          type: 'switch',
          colSpan: 24
        }
      ]
    }]
  },
  {
    name: '工作状态',
    props: { width: '200px' },
    children: [{
      children: [
        {
          key: 'workStatus',
          type: 'custom',
          customComponent: 'StatusTag',
          colSpan: 24,
          options: [
            { value: 'processing', label: '处理中', type: 'info' },
            { value: 'pending', label: '待处理', type: 'warning' },
            { value: 'completed', label: '已完成', type: 'success' },
            { value: 'failed', label: '失败', type: 'danger' }
          ]
        }
      ]
    }]
  },
  {
    name: '测试组件',
    props: { width: '150px' },
    children: [{
      children: [
        {
          key: 'testValue',
          type: 'custom',
          customComponent: 'TestComponent',
          colSpan: 24
        }
      ]
    }]
  },
  {
    name: '简单测试',
    props: { width: '200px' },
    children: [{
      children: [
        {
          key: 'simpleTest',
          type: 'custom',
          customComponent: 'SimpleTest',
          colSpan: 24
        }
      ]
    }]
  },
  {
    name: '学校',
    props: { width: '200px' },
    children: [{
      children: [
        {
          key: 'school',
          type: 'slotComponent',
          slotName: 'table-school',
          colSpan: 24
        }
      ]
    }]
  },
  {
    name: '性别',
    props: { width: '150px' },
    children: [{
      children: [
        {
          key: 'gender',
          type: 'slotComponent',
          slotName: 'table-gender',
          colSpan: 24
        }
      ]
    }]
  },
  {
    name: '操作',
    props: { width: '150px' },
    children: [{
      children: [
        {
          key: 'actions',
          type: 'slotComponent',
          slotName: 'table-actions',
          colSpan: 24
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

const handleFormTableEvent = (payload: { type: string; args: any[] }) => {
  eventLog.value = [payload, ...eventLog.value].slice(0, 8)
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
    level: 'junior',
    remark: '',
    status: true,
    phone: '',
    workStatus: 'processing',
    testValue: '',
    simpleTest: '',
    school: '',
    gender: '男'
  })
}

const handleRemoveRow = () => {
  if (tableData.value.length > 1) {
    formTableRef.value?.removeRow(tableData.value.length - 1)
  }
}

const handleEditRow = (index: number) => {
  console.log('编辑行:', index, tableData.value[index])
  // 这里可以添加编辑逻辑，比如打开编辑对话框
}

const handleDeleteRow = (index: number) => {
  if (tableData.value.length > 1) {
    formTableRef.value?.removeRow(index)
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
.form-table-advanced-demo {
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
