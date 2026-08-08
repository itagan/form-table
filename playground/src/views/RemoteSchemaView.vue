<template>
  <main class="remote-schema-page">
    <router-link to="/">← 返回</router-link>
    <h1>远程 JSON + 本地增强</h1>
    <p>服务端只返回可序列化的布局、type、props 和 options；组件对象、事件及 slot 实现在页面本地补充。</p>

    <FormTable
      :table-data.sync="tableData"
      :columns="columns"
      :form-props="{ size: 'small' }"
      :table-props="{ border: true }"
    >
      <template #actions="{ row, updateRow }">
        <el-button type="text" @click="updateRow({ enabled: !row.enabled })">
          {{ row.enabled ? '停用' : '启用' }}
        </el-button>
      </template>
    </FormTable>

    <section class="config-grid">
      <div>
        <h2>远程 JSON</h2>
        <pre>{{ remoteSchemaJson }}</pre>
      </div>
      <div>
        <h2>本地增强后的 columns</h2>
        <pre>{{ enhancedConfig }}</pre>
      </div>
    </section>

    <h2>当前数据</h2>
    <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import FormTable, { type ColumnConfig, type FormItemConfig, type TableRow } from '@itagan/form-table'
import PhoneInput from '../components/CustomComponents/PhoneInput.vue'
import { enhanceFormTableColumns } from '../utils/enhanceFormTableColumns'
import { formatFormTableConfig } from '../utils/formatFormTableConfig'

const remoteSchemaJson = `[
  {
    "label": "联系人",
    "children": [
      {
        "children": [
          {
            "fieldKey": "name",
            "type": "input",
            "colProps": { "span": 6 },
            "component": { "props": { "placeholder": "请输入姓名" } }
          },
          {
            "fieldKey": "phone",
            "type": "input",
            "colProps": { "span": 8 },
            "component": { "props": { "placeholder": "请输入手机号" } }
          },
          {
            "fieldKey": "enabled",
            "type": "switch",
            "colProps": { "span": 5 }
          },
          {
            "fieldKey": "actions",
            "slot": "actions",
            "colProps": { "span": 5 }
          }
        ]
      }
    ]
  }
]`

const remoteColumns = JSON.parse(remoteSchemaJson) as ColumnConfig[]
const columns = enhanceFormTableColumns(remoteColumns, {
  phone(item) {
    const { type: _remoteFallback, component: remoteComponent, ...layout } = item as any
    return {
      ...layout,
      component: {
        is: PhoneInput,
        props: remoteComponent?.props,
        listeners: {
          change(context, value) {
            context.setValue(value)
            context.updateRow({ phoneTouched: true })
          }
        }
      }
    } as FormItemConfig
  }
})

const tableData = ref<TableRow[]>([{
  name: '张三',
  phone: '+8613800000000',
  enabled: true,
  phoneTouched: false
}])
const enhancedConfig = computed(() => formatFormTableConfig(columns))
</script>

<style scoped>
.remote-schema-page { max-width: 1200px; margin: 0 auto; padding: 32px; }
.config-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-top: 24px; }
pre { padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }
@media (max-width: 900px) { .config-grid { grid-template-columns: 1fr; } }
</style>
