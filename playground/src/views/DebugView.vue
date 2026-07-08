<template>
  <div class="debug-view">
    <header class="debug-header">
      <div>
        <el-button plain size="small" icon="el-icon-arrow-left" @click="$router.push('/')">
          返回首页
        </el-button>
        <h1>自定义组件诊断台</h1>
        <p>
          同屏对比组件直连和 FormTable 注册后的行为，用于确认 v-model、change 事件和字段更新链路。
        </p>
      </div>
      <div class="status-strip">
        <div>
          <strong>{{ customComponents.length }}</strong>
          <span>已注册组件</span>
        </div>
        <div>
          <strong>{{ tableData.length }}</strong>
          <span>调试行</span>
        </div>
        <div>
          <strong>{{ debugLogs.length }}</strong>
          <span>最近日志</span>
        </div>
      </div>
    </header>

    <section class="debug-section direct-section">
      <div class="section-heading">
        <div>
          <h2>组件直连验证</h2>
          <p>先确认组件自身的 v-model 和事件表现，再与表格内渲染结果对照。</p>
        </div>
      </div>

      <div class="component-grid">
        <article class="component-card">
          <div class="component-card__header">
            <h3>PhoneInput</h3>
            <el-tag size="mini" type="success">input/change</el-tag>
          </div>
          <PhoneInput
            v-model="phoneValue"
            placeholder="请输入手机号"
            @change="handlePhoneChange"
          />
          <p>当前值：{{ phoneValue }}</p>
        </article>

        <article class="component-card">
          <div class="component-card__header">
            <h3>StatusTag</h3>
            <el-tag size="mini" type="info">display</el-tag>
          </div>
          <StatusTag
            v-model="statusValue"
            :options="statusOptions"
            @change="handleStatusChange"
          />
          <p>当前值：{{ statusValue }}</p>
        </article>

        <article class="component-card">
          <div class="component-card__header">
            <h3>TestComponent</h3>
            <el-tag size="mini" type="warning">click update</el-tag>
          </div>
          <TestComponent
            v-model="testValue"
            @change="handleTestChange"
          />
          <p>当前值：{{ testValue }}</p>
        </article>

        <article class="component-card">
          <div class="component-card__header">
            <h3>SimpleTest</h3>
            <el-tag size="mini">minimal</el-tag>
          </div>
          <SimpleTest
            v-model="simpleValue"
            @change="handleSimpleChange"
          />
          <p>当前值：{{ simpleValue }}</p>
        </article>
      </div>
    </section>

    <section class="debug-section table-section">
      <div class="section-heading">
        <div>
          <h2>FormTable 注册验证</h2>
          <p>相同组件通过 customComponents 注入后，应继续走统一的 update:tableData 更新路径。</p>
        </div>
        <el-button size="small" @click="resetTableData">重置数据</el-button>
      </div>
      <FormTable
        :table-data="tableData"
        :columns="columns"
        :rules="rules"
        :form-data="formData"
        :custom-components="customComponents"
        @update:tableData="handleTableDataUpdate"
      />
    </section>

    <section class="debug-section logs-section">
      <div class="section-heading">
        <div>
          <h2>调试日志</h2>
          <p>保留最近 6 条组件和表格事件，便于复现时确认事件顺序。</p>
        </div>
        <el-button size="small" plain @click="debugLogs = []">清空日志</el-button>
      </div>
      <el-empty v-if="debugLogs.length === 0" description="暂无调试日志" :image-size="80" />
      <ul v-else class="log-list">
        <li v-for="log in debugLogs" :key="log">{{ log }}</li>
      </ul>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@itagan/form-table'
import PhoneInput from '@/components/CustomComponents/PhoneInput.vue'
import StatusTag from '@/components/CustomComponents/StatusTag.vue'
import TestComponent from '@/components/CustomComponents/TestComponent.vue'
import SimpleTest from '@/components/CustomComponents/SimpleTest.vue'
import type { ColumnConfig, CustomComponentConfig, TableRow } from '@itagan/form-table'

const createDefaultTableData = (): TableRow[] => [
  {
    name: '张三',
    phone: '13800138000',
    status: 'processing',
    test: 'test',
    simple: '默认值'
  }
]

// 测试数据
const phoneValue = ref('13800138000')
const statusValue = ref('processing')
const testValue = ref('test')
const simpleValue = ref('默认值')

const tableData = ref<TableRow[]>(createDefaultTableData())
const rules = ref({})
const formData = ref({})

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
const debugLogs = ref<string[]>(['页面已加载，可开始验证自定义组件。'])

const formatTime = () => {
  return new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const recordDebugLog = (message: string) => {
  debugLogs.value = [`${formatTime()} ${message}`, ...debugLogs.value].slice(0, 6)
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
            name: 'PhoneInput'
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
            name: 'StatusTag',
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
            name: 'TestComponent'
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
            name: 'SimpleTest'
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

const resetTableData = () => {
  tableData.value = createDefaultTableData()
  recordDebugLog('Table data reset')
}
</script>

<style lang="less" scoped>
.debug-view {
  padding: 28px;
  max-width: 1200px;
  margin: 0 auto;
  color: #1f2937;

  .debug-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;
    padding-bottom: 22px;
    border-bottom: 1px solid #d8dee9;

    h1 {
      margin: 18px 0 10px;
      color: #111827;
      font-size: 30px;
      font-weight: 700;
      line-height: 1.25;
    }

    p {
      max-width: 720px;
      margin: 0;
      color: #4b5563;
    }
  }

  .status-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(92px, 1fr));
    gap: 10px;

    div {
      min-width: 92px;
      padding: 12px 14px;
      background: #fff;
      border: 1px solid #dfe5ef;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
    }

    strong,
    span {
      display: block;
    }

    strong {
      color: #2563eb;
      font-size: 22px;
      line-height: 1.1;
    }

    span {
      margin-top: 6px;
      color: #6b7280;
      font-size: 12px;
    }
  }

  .debug-section {
    margin-bottom: 20px;
    padding: 20px;
    border: 1px solid #dfe5ef;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);

    .section-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;

      h2 {
        margin: 0;
        color: #111827;
        font-size: 20px;
        font-weight: 700;
      }

      p {
        margin: 6px 0 0;
        color: #6b7280;
      }
    }
  }

  .component-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .component-card {
    min-height: 150px;
    padding: 16px;
    border: 1px solid #e5eaf3;
    border-radius: 8px;
    background: #fbfdff;

    .component-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;

      h3 {
        margin: 0;
        color: #111827;
        font-size: 16px;
        font-weight: 700;
      }
    }

    p {
      margin: 12px 0 0;
      color: #6b7280;
      font-size: 13px;
    }
  }

  .table-section {
    overflow: hidden;
  }

  .log-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      padding: 10px 12px;
      color: #374151;
      background: #f8fafc;
      border: 1px solid #e5eaf3;
      border-radius: 6px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 12px;
    }
  }
}

@media (max-width: 860px) {
  .debug-view {
    padding: 20px;

    .debug-header,
    .debug-section .section-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .status-strip,
    .component-grid {
      grid-template-columns: 1fr;
      width: 100%;
    }
  }
}
</style>
