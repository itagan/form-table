<template>
  <div class="debug-view">
    <h1>自定义组件调试页面</h1>
    
    <div class="debug-section">
      <h2>直接使用自定义组件</h2>
      
      <div class="component-test">
        <h3>PhoneInput 组件</h3>
        <PhoneInput 
          v-model="phoneValue" 
          placeholder="请输入手机号"
          @change="handlePhoneChange"
        />
        <p>当前值: {{ phoneValue }}</p>
      </div>
      
      <div class="component-test">
        <h3>StatusTag 组件</h3>
        <StatusTag 
          v-model="statusValue"
          :options="statusOptions"
          @change="handleStatusChange"
        />
        <p>当前值: {{ statusValue }}</p>
      </div>
      
      <div class="component-test">
        <h3>TestComponent 组件</h3>
        <TestComponent 
          v-model="testValue"
          @change="handleTestChange"
        />
        <p>当前值: {{ testValue }}</p>
      </div>
    </div>
    
    <div class="debug-section">
      <h2>在 FormTable 中使用</h2>
      <FormTable
        :table-data="tableData"
        :columns="columns"
        :custom-components="customComponents"
        @update:tableData="handleTableDataUpdate"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@/components/FormTable/index.vue'
import PhoneInput from '@/components/CustomComponents/PhoneInput.vue'
import StatusTag from '@/components/CustomComponents/StatusTag.vue'
import TestComponent from '@/components/CustomComponents/TestComponent.vue'
import type { ColumnConfig } from '@/components/FormTable/types'

// 测试数据
const phoneValue = ref('13800138000')
const statusValue = ref('processing')
const testValue = ref('test')

const tableData = ref([
  { 
    name: '张三', 
    phone: '13800138000',
    status: 'processing',
    test: 'test'
  }
])

// 状态选项
const statusOptions = [
  { value: 'processing', label: '处理中', type: 'info' },
  { value: 'pending', label: '待处理', type: 'warning' },
  { value: 'completed', label: '已完成', type: 'success' },
  { value: 'failed', label: '失败', type: 'danger' }
]

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
  }
])

// 列配置
const columns = ref<ColumnConfig[]>([
  {
    name: '姓名',
    props: { width: '100px' },
    children: [{
      children: [
        {
          key: 'name',
          type: 'input',
          colSpan: 24,
          placeholder: '请输入姓名'
        }
      ]
    }]
  },
  {
    name: '手机号',
    props: { width: '200px' },
    children: [{
      children: [
        {
          key: 'phone',
          type: 'custom',
          customComponent: 'PhoneInput',
          colSpan: 24
        }
      ]
    }]
  },
  {
    name: '状态',
    props: { width: '150px' },
    children: [{
      children: [
        {
          key: 'status',
          type: 'custom',
          customComponent: 'StatusTag',
          colSpan: 24,
          options: statusOptions
        }
      ]
    }]
  },
  {
    name: '测试',
    props: { width: '150px' },
    children: [{
      children: [
        {
          key: 'test',
          type: 'custom',
          customComponent: 'TestComponent',
          colSpan: 24
        }
      ]
    }]
  }
])

// 事件处理
const handlePhoneChange = (value: string) => {
  console.log('PhoneInput changed:', value)
}

const handleStatusChange = (value: string) => {
  console.log('StatusTag changed:', value)
}

const handleTestChange = (value: string) => {
  console.log('TestComponent changed:', value)
}

const handleTableDataUpdate = (newData: any[]) => {
  tableData.value = newData
  console.log('Table data updated:', newData)
}
</script>

<style lang="less" scoped>
.debug-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    color: #303133;
    margin-bottom: 30px;
    text-align: center;
  }

  .debug-section {
    margin-bottom: 40px;
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background: #fff;

    h2 {
      color: #606266;
      margin-bottom: 20px;
    }

    .component-test {
      margin-bottom: 20px;
      padding: 15px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;

      h3 {
        margin-bottom: 10px;
        color: #409eff;
      }

      p {
        margin-top: 10px;
        color: #909399;
        font-size: 14px;
      }
    }
  }
}
</style>
