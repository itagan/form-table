<template>
  <main class="demo-page">
    <router-link to="/">← 返回</router-link>
    <h1>组件直传调试</h1>
    <p>自定义组件对象直接写入 component.is，不再经过 customComponents 注册表。</p>

    <section class="demo-card">
      <FormTable
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        :table-props="{ border: true }"
        @update:tableData="tableData = $event"
      />

      <div class="actions">
        <el-button @click="logRefs">打印原生 Ref</el-button>
      </div>
      <h2>组件配置</h2>
      <pre>{{ columnsCode }}</pre>
      <h2>当前数据</h2>
      <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose, TableRow } from '@itagan/form-table'
import PhoneInput from '../components/CustomComponents/PhoneInput.vue'
import StatusTag from '../components/CustomComponents/StatusTag.vue'
import { formatFormTableConfig } from '../utils/formatFormTableConfig'

const tableData = ref<TableRow[]>([{ phone: '+8613800138000', status: 'enabled' }])
const formTableRef = ref<FormTableExpose>()
const columns: ColumnConfig[] = [
  {
    name: '手机',
    children: [{ children: [{
      key: 'phone',
      component: {
        is: PhoneInput,
        props: { size: 'small' },
        listeners: { change: ({ value }) => console.log('change', value) }
      }
    }] }]
  },
  {
    name: '状态展示',
    children: [{ children: [{
      key: 'status',
      component: {
        is: StatusTag,
        props: {
          options: [
            { label: '启用', value: 'enabled', type: 'success' },
            { label: '停用', value: 'disabled', type: 'info' }
          ]
        }
      }
    }] }]
  }
]
const columnsCode = formatFormTableConfig(columns)
const logRefs = () => {
  console.log('form', formTableRef.value?.getFormRef())
  console.log('table', formTableRef.value?.getTableRef())
}
</script>

<style scoped>
.demo-page { max-width: 900px; margin: 0 auto; padding: 32px; }
.demo-card { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
.actions { margin-top: 20px; }
pre { padding: 16px; background: #f6f8fa; border-radius: 8px; }
</style>
