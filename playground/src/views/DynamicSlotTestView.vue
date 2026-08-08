<template>
  <main class="demo-page">
    <router-link to="/">← 返回</router-link>
    <h1>Slot 与动态显隐</h1>
    <p>Slot 保留 el-col 和 el-form-item，复杂渲染完全交给调用方。</p>

    <section class="demo-card">
      <FormTable
        :table-data="tableData"
        :columns="columns"
        :table-props="{ border: true }"
        @update:tableData="tableData = $event"
      >
        <template #score="{ value, setValue }">
          <el-rate :value="value" @input="setValue" />
        </template>

        <template #detail="{ row, updateRow }">
          <el-input
            :value="row.detail"
            type="textarea"
            :rows="2"
            placeholder="仅在开启详情时显示"
            @input="updateRow({ detail: $event })"
          />
        </template>

        <template #actions="{ index }">
          <el-button type="text" @click="removeRow(index)">删除</el-button>
        </template>
      </FormTable>

      <el-button class="add-button" type="primary" @click="addRow">添加行</el-button>
    </section>

    <section class="demo-card">
      <h2>组件配置</h2>
      <pre>{{ columnsCode }}</pre>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'
import { formatFormTableConfig } from '../utils/formatFormTableConfig'

const tableData = ref<TableRow[]>([
  { title: '第一项', showDetail: true, detail: '可编辑详情', score: 4 },
  { title: '第二项', showDetail: false, detail: '', score: 3 }
])
const columns: ColumnConfig[] = [
  {
    label: '内容',
    props: { minWidth: 420 },
    children: [
      {
        props: { gutter: 10 },
        children: [
          { fieldKey: 'title', type: 'input', colProps: { span: 16 } },
          {
            fieldKey: 'showDetail',
            type: 'switch',
            colProps: { span: 8 },
            formItemProps: { label: '详情', labelWidth: '48px' }
          }
        ]
      },
      {
        children: [{
          fieldKey: 'detail',
          slot: 'detail',
          visible: ({ row }) => row.showDetail === true
        }]
      }
    ]
  },
  {
    label: '评分',
    props: { width: 180 },
    children: [{ children: [{ fieldKey: 'score', slot: 'score' }] }]
  },
  {
    label: '操作',
    props: { width: 90, align: 'center' },
    children: [{ children: [{ fieldKey: '__actions', slot: 'actions' }] }]
  }
]
const columnsCode = formatFormTableConfig(columns)

const addRow = () => {
  tableData.value = [...tableData.value, { title: '', showDetail: true, detail: '', score: 0 }]
}
const removeRow = (index: number) => {
  tableData.value = tableData.value.filter((_, rowIndex) => rowIndex !== index)
}
</script>

<style scoped>
.demo-page { max-width: 1100px; margin: 0 auto; padding: 32px; }
.demo-card { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
.add-button { margin-top: 20px; }
pre { padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }
</style>
