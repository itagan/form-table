<template>
  <main class="demo-page">
    <router-link to="/">← 返回</router-link>
    <h1>组件对象直传与原生 Ref</h1>
    <p>使用 type: 'component' 和 component.renderer 直接传入组件对象，不经过业务注册表。</p>

    <section class="demo-card">
      <FormTable
        ref="formTableRef"
        v-model="tableData"
        :columns="columns"
        :table-props="{ border: true }"
      />

      <div class="actions">
        <el-button @click="logRefs">打印原生 Ref</el-button>
      </div>

      <DemoCollapsiblePanel class="embedded-panel" title="组件配置">
        <pre>{{ columnsCode }}</pre>
      </DemoCollapsiblePanel>
      <DemoCollapsiblePanel class="embedded-panel" title="当前数据">
        <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
      </DemoCollapsiblePanel>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose, TableRow } from '@itagan/form-table'
import PhoneInput from '../components/CustomComponents/PhoneInput.vue'
import StatusTag from '../components/CustomComponents/StatusTag.vue'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'
import { formatFormTableConfig } from '../utils/formatFormTableConfig'

const tableData = ref<TableRow[]>([{ phone: '+8613800138000', status: 'enabled' }])
const formTableRef = ref<FormTableExpose>()
const columns: ColumnConfig[] = [
  {
    label: '手机',
    children: [{ children: [{
      fieldKey: 'phone',
      type: 'component',
      component: {
        renderer: PhoneInput,
        props: { size: 'small' },
        listeners: { change: ({ value }) => console.log('change', value) }
      }
    }] }]
  },
  {
    label: '状态展示',
    children: [{ children: [{
      fieldKey: 'status',
      type: 'component',
      component: {
        renderer: StatusTag,
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
.embedded-panel { margin-top: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
pre { padding: 16px; background: #f6f8fa; border-radius: 8px; }
</style>
