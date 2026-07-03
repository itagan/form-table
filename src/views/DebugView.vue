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

      <div class="component-test">
        <h3>SimpleTest 组件</h3>
        <SimpleTest
          v-model="simpleValue"
          @change="handleSimpleChange"
        />
        <p>当前值: {{ simpleValue }}</p>
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

    <div class="debug-section">
      <h2>调试日志</h2>
      <pre>{{ JSON.stringify(debugLogs, null, 2) }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@/components/FormTable/index.vue'
import PhoneInput from '@/components/CustomComponents/PhoneInput.vue'
import StatusTag from '@/components/CustomComponents/StatusTag.vue'
import TestComponent from '@/components/CustomComponents/TestComponent.vue'
import SimpleTest from '@/components/CustomComponents/SimpleTest.vue'
import type { ColumnConfig, CustomComponentConfig, TableRow } from '@/components/FormTable/types'

// 测试数据
const phoneValue = ref('13800138000')
const statusValue = ref('processing')
const testValue = ref('test')
const simpleValue = ref('simple')

const tableData = ref<TableRow[]>([
  { 
    name: '张三', 
    phone: '13800138000',
    status: 'processing',
    test: 'test',
    simple: 'simple'
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
const customComponents = ref<CustomComponentConfig[]>([
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
const debugLogs = ref<string[]>([])

const recordDebugLog = (message: string) => {
  debugLogs.value = [message, ...debugLogs.value].slice(0, 6)
}

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
    name: '手机号',
    props: { width: '200px' },
    children: [{
      children: [
        {
          key: 'phone',
          type: 'custom',
          layout: {
            span: 24
          },
          component: {
            customComponent: 'PhoneInput'
          }
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
          layout: {
            span: 24
          },
          component: {
            customComponent: 'StatusTag',
            options: statusOptions
          }
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
          layout: {
            span: 24
          },
          component: {
            customComponent: 'TestComponent'
          }
        }
      ]
    }]
  },
  {
    name: '简单测试',
    props: { width: '150px' },
    children: [{
      children: [
        {
          key: 'simple',
          type: 'custom',
          layout: {
            span: 24
          },
          component: {
            customComponent: 'SimpleTest'
          }
        }
      ]
    }]
  }
])

// 事件处理
const handlePhoneChange = (value: string) => {
  recordDebugLog(`PhoneInput changed: ${value}`)
}

const handleStatusChange = (value: string) => {
  recordDebugLog(`StatusTag changed: ${value}`)
}

const handleTestChange = (value: string) => {
  recordDebugLog(`TestComponent changed: ${value}`)
}

const handleSimpleChange = (value: string) => {
  recordDebugLog(`SimpleTest changed: ${value}`)
}

const handleTableDataUpdate = (newData: TableRow[]) => {
  tableData.value = newData
  recordDebugLog(`Table data updated: ${newData.length} row(s)`)
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
