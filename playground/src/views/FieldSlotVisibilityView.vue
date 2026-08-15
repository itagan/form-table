<template>
  <main class="demo-page">
    <router-link to="/">← 返回</router-link>
    <h1>字段 Slot 与动态显隐</h1>
    <p>Slot 保留 el-col、el-form-item 和字段更新能力，内部模板由调用方控制；visible 可在 Column、Row、Item 三层按需判断。</p>

    <section class="demo-card">
      <FormTable
        v-model="tableData"
        :columns="columns"
        :table-props="{ border: true }"
      >
        <template #score="{ value, setValue, component }">
          <el-rate
            v-bind="component.props"
            v-on="component.listeners"
            :value="value"
            @input="setValue"
          />
        </template>

        <template #detail="{ row, updateRow, component }">
          <el-input
            v-bind="component.props"
            :value="row.detail"
            @input="updateRow({ detail: $event })"
          />
        </template>

        <template #actions="{ index, component }">
          <el-button type="text" @click="removeRow(index)">{{ component.props.label }}</el-button>
        </template>
      </FormTable>

      <el-button class="add-button" type="primary" @click="addRow">添加行</el-button>
    </section>

    <DemoCollapsiblePanel class="demo-card" title="组件配置">
      <pre>{{ columnsCode }}</pre>
    </DemoCollapsiblePanel>

    <DemoCollapsiblePanel class="demo-card docs-section" title="Slot 如何绑定">
      <p><code>component.renderer</code> 是具名 Slot 的 key。配置中的 props、listeners 和 options 会先解析，再通过 Slot 上下文的 <code>component</code> 返回。</p>
      <pre>{{ slotCode }}</pre>
      <ul>
        <li><code>value / setValue</code> 负责当前字段的读取与更新。</li>
        <li><code>updateRow</code> 用于一次更新当前行的多个字段。</li>
        <li>配置不会自动绑定到 Slot 内部组件，应按组件接口使用 <code>v-bind</code>、<code>v-on</code> 或显式属性。</li>
      </ul>
    </DemoCollapsiblePanel>

    <DemoCollapsiblePanel class="demo-card docs-section" title="动态显隐层级">
      <table>
        <thead><tr><th>层级</th><th>隐藏范围</th><th>可用上下文</th></tr></thead>
        <tbody>
          <tr><td>Column</td><td>整列</td><td><code>tableData, columnConfig</code></td></tr>
          <tr><td>rowProps</td><td>单元格内唯一 Flex Row</td><td><code>Column 上下文 + row, index</code></td></tr>
          <tr><td>Item</td><td>当前字段及 el-col</td><td><code>Row 上下文 + fieldKey, value, itemConfig</code></td></tr>
        </tbody>
      </table>
      <p>显隐只改变渲染，不会删除字段值。需要关闭时清空详情，应由业务事件更新数据，不要在 visible 判断中修改 row。</p>
      <pre>{{ visibleCode }}</pre>
    </DemoCollapsiblePanel>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'
import { formatFormTableConfig } from '../utils/formatFormTableConfig'

const tableData = ref<TableRow[]>([
  { title: '第一项', showDetail: true, detail: '可编辑详情', score: 4 },
  { title: '第二项', showDetail: false, detail: '', score: 3 }
])
const columns: ColumnConfig[] = [
  {
    label: '内容',
    props: { minWidth: 420 },
    rowProps: { gutter: 10 },
    formItems: [
      { fieldKey: 'title', type: 'input', colProps: { span: 16 } },
      {
        fieldKey: 'showDetail',
        type: 'switch',
        colProps: { span: 8 },
        formItemProps: { label: '详情', labelWidth: '48px' }
      },
      {
        fieldKey: 'detail',
        type: 'slot',
        component: {
          renderer: 'detail',
          props: ({ row }) => ({
            type: 'textarea',
            rows: 2,
            disabled: row.locked === true,
            placeholder: '仅在开启详情时显示'
          })
        },
        visible: ({ row }) => row.showDetail === true
      }
    ]
  },
  {
    label: '评分',
    props: { width: 180 },
    formItems: [{
      fieldKey: 'score',
      type: 'slot',
      component: { renderer: 'score', props: { showScore: true } }
    }]
  },
  {
    label: '操作',
    props: { width: 90, align: 'center' },
    formItems: [{
      fieldKey: '__actions',
      type: 'slot',
      component: { renderer: 'actions', props: { label: '删除' } }
    }]
  }
]
const columnsCode = formatFormTableConfig(columns)
const slotCode = `<template #score="{ value, setValue, component, columnConfig, itemConfig }">
  <!-- columnConfig/itemConfig 是原始配置，component 是当前行解析结果 -->
  <el-rate
    v-bind="component.props"
    v-on="component.listeners"
    :value="value"
    @input="setValue"
  />
</template>`
const visibleCode = `{
  label: '内容',
  visible: ({ tableData }) => tableData.length > 0, // Column
  rowProps: ({ index }) => ({ gutter: index ? 8 : 10 }),
  formItems: [{
    fieldKey: 'detail',
    type: 'slot',
    component: { renderer: 'detail' },
    visible: ({ row }) => row.showDetail === true // Item
  }]
}`

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
.docs-section p, .docs-section li { line-height: 1.7; }
.docs-section table { width: 100%; border-collapse: collapse; }
.docs-section th, .docs-section td { padding: 10px 12px; border: 1px solid #e5e7eb; text-align: left; }
.docs-section th { background: #f6f8fa; }
</style>
