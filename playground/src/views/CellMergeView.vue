<template>
  <main class="merge-page">
    <router-link to="/">← 返回调试台</router-link>
    <h1>单元格合并调试台</h1>
    <p class="page-description">
      通过 <code>tableProps.spanMethod</code> 使用 Element UI 原生合并能力。
      示例同时演示按采购部门纵向合并，以及小计行横跨“物料、数量、含税金额”三列。
    </p>

    <section class="demo-card">
      <div class="toolbar">
        <el-switch v-model="mergeDepartment" active-text="合并部门" />
        <el-switch v-model="mergeSummary" active-text="合并小计行" />
        <el-switch v-model="showHeader" active-text="显示表头" />
        <el-button size="small" @click="reverseGroups">交换部门顺序</el-button>
        <el-button size="small" @click="resetRows">恢复数据</el-button>
      </div>

      <el-alert
        title="被合并覆盖的单元格不会挂载内部 FormItem；需要逐行编辑和校验的字段不应直接合并。"
        type="warning"
        :closable="false"
        show-icon
      />

      <FormTable
        :table-data="tableData"
        :columns="columns"
        row-key="id"
        :table-props="tableProps"
        :form-props="{ size: 'small' }"
        @update:tableData="handleTableDataUpdate"
      />

      <div class="explanation-grid">
        <article>
          <h2>纵向合并</h2>
          <p>预先计算连续部门分组的 rowspan，渲染时只进行数组读取。</p>
        </article>
        <article>
          <h2>横向合并</h2>
          <p>小计行从 <code>itemDisplay</code> 开始 colspan 3，其余被覆盖列返回 0/0。</p>
        </article>
        <article>
          <h2>稳定列定位</h2>
          <p>规则根据 <code>column.property</code> 判断列，不依赖动态显隐后可能变化的 columnIndex。</p>
        </article>
      </div>

      <DemoCollapsiblePanel class="span-panel" title="当前跨度计算">
        <pre>{{ JSON.stringify({ departmentSpans, mergeDepartment, mergeSummary }, null, 2) }}</pre>
      </DemoCollapsiblePanel>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'

interface MergeDemoRow extends TableRow {
  id: string
  departmentCode: string
  departmentName: string
  rowType: 'detail' | 'summary'
  itemDisplay: string
  quantity: number
  amountDisplay: string
  note: string
}

interface SpanMethodContext {
  row: MergeDemoRow
  column: { property?: string }
  rowIndex: number
}

interface CellSpan {
  rowspan: number
  colspan: number
}

const initialRows: MergeDemoRow[] = [
  { id: 'hz-1', departmentCode: 'HZ', departmentName: '杭州采购部', rowType: 'detail', itemDisplay: '工业控制器', quantity: 2, amountDisplay: '¥ 25,600.00', note: '项目一期' },
  { id: 'hz-2', departmentCode: 'HZ', departmentName: '杭州采购部', rowType: 'detail', itemDisplay: '温度传感器', quantity: 8, amountDisplay: '¥ 6,240.00', note: '备件库存' },
  { id: 'hz-total', departmentCode: 'HZ', departmentName: '杭州采购部', rowType: 'summary', itemDisplay: '杭州采购部小计：10 件，¥ 31,840.00', quantity: 0, amountDisplay: '', note: '待部门负责人确认' },
  { id: 'sz-1', departmentCode: 'SZ', departmentName: '深圳采购部', rowType: 'detail', itemDisplay: '屏蔽控制电缆', quantity: 500, amountDisplay: '¥ 9,500.00', note: '按米采购' },
  { id: 'sz-2', departmentCode: 'SZ', departmentName: '深圳采购部', rowType: 'detail', itemDisplay: '工业交换机', quantity: 4, amountDisplay: '¥ 18,000.00', note: '生产网络扩容' },
  { id: 'sz-total', departmentCode: 'SZ', departmentName: '深圳采购部', rowType: 'summary', itemDisplay: '深圳采购部小计：504 件，¥ 27,500.00', quantity: 0, amountDisplay: '', note: '预算内采购' }
]

const cloneInitialRows = () => initialRows.map(row => ({ ...row }))

const tableData = ref<MergeDemoRow[]>(cloneInitialRows())
const mergeDepartment = ref(true)
const mergeSummary = ref(true)
const showHeader = ref(true)

/** 为连续的相同分组预计算跨度：组首保存长度，其余行保持 0。 */
const createRowSpans = (
  rows: readonly MergeDemoRow[],
  getGroupKey: (row: MergeDemoRow) => string
) => {
  const spans = new Array(rows.length).fill(0)

  for (let start = 0; start < rows.length;) {
    let end = start + 1
    while (end < rows.length && getGroupKey(rows[end]) === getGroupKey(rows[start])) {
      end += 1
    }
    spans[start] = end - start
    start = end
  }

  return spans
}

const departmentSpans = computed(() => (
  createRowSpans(tableData.value, row => row.departmentCode)
))

/** Element UI 按可见单元格调用该函数；返回 0/0 的位置由锚点单元格覆盖。 */
const spanMethod = ({ row, column, rowIndex }: SpanMethodContext): CellSpan | undefined => {
  if (mergeDepartment.value && column.property === 'departmentName') {
    const rowspan = departmentSpans.value[rowIndex]
    return rowspan > 0 ? { rowspan, colspan: 1 } : { rowspan: 0, colspan: 0 }
  }

  if (mergeSummary.value && row.rowType === 'summary') {
    if (column.property === 'itemDisplay') return { rowspan: 1, colspan: 3 }
    if (['quantity', 'amountDisplay'].includes(column.property || '')) {
      return { rowspan: 0, colspan: 0 }
    }
  }
}

const tableProps = computed(() => ({
  border: true,
  showHeader: showHeader.value,
  spanMethod
}))

const columns: ColumnConfig[] = [
  {
    key: 'department',
    label: '采购部门',
    props: { prop: 'departmentName', width: 150, align: 'center' },
    children: [{ children: [{ fieldKey: 'departmentName', type: 'text' }] }]
  },
  {
    key: 'item',
    label: '物料 / 部门小计',
    props: { prop: 'itemDisplay', minWidth: 280 },
    children: [{ children: [{ fieldKey: 'itemDisplay', type: 'text' }] }]
  },
  {
    key: 'quantity',
    label: '数量',
    props: { prop: 'quantity', width: 100, align: 'right' },
    children: [{ children: [{ fieldKey: 'quantity', type: 'text' }] }]
  },
  {
    key: 'amount',
    label: '含税金额',
    props: { prop: 'amountDisplay', width: 140, align: 'right' },
    children: [{ children: [{ fieldKey: 'amountDisplay', type: 'text' }] }]
  },
  {
    key: 'note',
    label: '业务备注（独立编辑）',
    props: { prop: 'note', minWidth: 220 },
    children: [{ children: [{
      fieldKey: 'note',
      type: 'input',
      component: {
        props: ({ row }) => ({
          disabled: (row as Readonly<MergeDemoRow>).rowType === 'summary',
          clearable: true
        })
      }
    }] }]
  }
]

const handleTableDataUpdate = (nextTableData: TableRow[]) => {
  tableData.value = nextTableData as MergeDemoRow[]
}

const reverseGroups = () => {
  const groupCodes = [...new Set(tableData.value.map(row => row.departmentCode))].reverse()
  tableData.value = groupCodes.reduce<MergeDemoRow[]>((rows, code) => (
    rows.concat(tableData.value.filter(row => row.departmentCode === code))
  ), [])
}

const resetRows = () => {
  tableData.value = cloneInitialRows()
}
</script>

<style scoped>
.merge-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px;
}

.page-description {
  max-width: 860px;
  color: #4b5563;
  line-height: 1.7;
}

.demo-card {
  margin-top: 20px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
}

.demo-card :deep(.el-alert) {
  margin-bottom: 18px;
}

.explanation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.explanation-grid article {
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.explanation-grid h2 {
  margin: 0 0 8px;
  font-size: 15px;
}

.explanation-grid p {
  margin: 0;
  color: #64748b;
}
.span-panel { margin-top: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }

pre {
  max-height: 300px;
  padding: 16px;
  overflow: auto;
  background: #f6f8fa;
  border-radius: 8px;
}

@media (max-width: 800px) {
  .merge-page {
    padding: 20px;
  }

  .explanation-grid {
    grid-template-columns: 1fr;
  }
}
</style>
