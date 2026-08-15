<template>
  <main class="demo-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">FEATURE DEMO</p>
        <h1>cellSlot 列级单元格</h1>
        <p>一个独立页面对比列级 cellSlot 与字段 Slot，并展示实际 scope 和更新事件。</p>
      </div>
      <el-button @click="resetRows">恢复示例数据</el-button>
    </header>

    <section class="boundary-card">
      <div>
        <strong>cellSlot</strong>
        <span>row / index / columnConfig / updateRow</span>
        <small>无 fieldKey、value、propPath 和表单包装</small>
      </div>
      <div>
        <strong>字段 Slot</strong>
        <span>value / setValue / propPath / component</span>
        <small>保留 fieldKey、el-form-item 和校验能力</small>
      </div>
    </section>

    <section class="table-card">
      <FormTable
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        :form-props="{ size: 'small' }"
        row-key="id"
        :table-props="{ border: true }"
        @update:tableData="handleTableDataUpdate"
        @field-change="handleFieldChange"
      >
        <template #profile-card="context">
          <button class="profile-card inspectable" type="button" @click="inspectContext(context)">
            <span class="avatar">{{ context.row.name.slice(0, 1) }}</span>
            <span>
              <strong>{{ context.row.name }}</strong>
              <small>{{ context.row.department }}</small>
            </span>
          </button>
        </template>

        <template #status-cell="context">
          <button class="plain-cell inspectable" type="button" @click="inspectContext(context)">
            <el-tag size="small" :type="statusMeta(context.row.status).type">
              {{ statusMeta(context.row.status).label }}
            </el-tag>
          </button>
        </template>

        <template #amount-cell="context">
          <button class="amount inspectable" type="button" @click="inspectContext(context)">
            ¥ {{ formatMoney(context.row.quantity * context.row.unitPrice) }}
          </button>
        </template>

        <template #score-editor="{ value, setValue, propPath }">
          <div class="score-editor">
            <el-input-number :value="value" :min="0" :max="100" controls-position="right" @input="setValue" />
            <small>{{ propPath }}</small>
          </div>
        </template>

        <template #row-actions="context">
          <div class="row-actions">
            <el-button type="text" @click="context.updateRow({ status: context.row.status === 'enabled' ? 'disabled' : 'enabled' })">
              切换
            </el-button>
            <el-button type="text" @click="approveLater(context)">异步通过</el-button>
            <el-button type="text" class="danger" @click="removeRow(context.row)">删除</el-button>
            <el-button type="text" @click="inspectContext(context)">查看 scope</el-button>
          </div>
        </template>
      </FormTable>
    </section>

    <section class="details-grid">
      <DemoCollapsiblePanel
        class="detail-card"
        title="当前 cellSlot scope"
        :default-open="inspectedContext !== null"
      >
        <p v-if="!inspectedContext" class="empty">点击组合信息、状态、金额或“查看 scope”。</p>
        <pre v-else>{{ JSON.stringify(inspectedContext, null, 2) }}</pre>
      </DemoCollapsiblePanel>
      <DemoCollapsiblePanel
        class="detail-card"
        title="最近 field-change"
        :default-open="fieldEvents.length > 0"
      >
        <p v-if="fieldEvents.length === 0" class="empty">修改评分、切换状态或执行异步通过后显示。</p>
        <pre v-else>{{ JSON.stringify(fieldEvents, null, 2) }}</pre>
      </DemoCollapsiblePanel>
    </section>

    <DemoCollapsiblePanel class="code-card" title="配置对照">
      <pre>{{ configurationExample }}</pre>
    </DemoCollapsiblePanel>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Message } from 'element-ui'
import FormTable from '@itagan/form-table'
import type {
  ColumnConfig,
  FormTableCellSlotContext,
  FormTableExpose,
  FormTableFieldChangePayload,
  TableRow
} from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'

interface DemoRow extends TableRow {
  id: number
  name: string
  department: string
  status: 'enabled' | 'disabled' | 'approved'
  quantity: number
  unitPrice: number
  score: number
  audit?: { approved: boolean }
}

const createRows = (): DemoRow[] => [
  { id: 1, name: '张三', department: '产品中心', status: 'enabled', quantity: 3, unitPrice: 1280, score: 88 },
  { id: 2, name: '李四', department: '客户成功', status: 'disabled', quantity: 2, unitPrice: 860, score: 72 },
  { id: 3, name: '王五', department: '技术平台', status: 'approved', quantity: 5, unitPrice: 1560, score: 95 }
]

const tableData = ref<DemoRow[]>(createRows())
const formTableRef = ref<FormTableExpose>()
const inspectedContext = ref<Record<string, unknown> | null>(null)
const fieldEvents = ref<FormTableFieldChangePayload[]>([])

const columns: ColumnConfig[] = [
  {
    key: 'profile-column',
    label: '组合信息',
    cellSlot: 'profile-card',
    props: { minWidth: 200 }
  },
  {
    key: 'status-column',
    label: '状态',
    cellSlot: 'status-cell',
    props: { width: 110, align: 'center' }
  },
  {
    key: 'amount-column',
    label: '派生金额',
    cellSlot: 'amount-cell',
    props: { width: 140, align: 'right' }
  },
  {
    key: 'score-column',
    label: '评分（字段 Slot）',
    props: { minWidth: 220 },
    formItems: [{
      key: 'score-field',
      fieldKey: 'score',
      type: 'slot',
      formItemProps: { rules: [{ required: true, message: '请输入评分' }] },
      component: { renderer: 'score-editor' }
    }]
  },
  {
    key: 'actions-column',
    label: '操作',
    cellSlot: 'row-actions',
    props: { width: 260, fixed: 'right', align: 'center' }
  }
]

const statusMeta = (status: DemoRow['status']) => ({
  enabled: { type: 'success', label: '启用' },
  disabled: { type: 'info', label: '停用' },
  approved: { type: 'primary', label: '已通过' }
}[status])

const formatMoney = (value: number) => value.toLocaleString('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const inspectContext = (context: FormTableCellSlotContext) => {
  inspectedContext.value = {
    row: context.row,
    index: context.index,
    columnConfig: context.columnConfig,
    updateRow: 'Function',
    notProvided: ['tableData', 'columnIndex', 'fieldKey', 'value', 'setValue', 'propPath', 'component']
  }
}

const approveLater = async (context: FormTableCellSlotContext) => {
  await new Promise(resolve => setTimeout(resolve, 250))
  context.updateRow({ status: 'approved', 'audit.approved': true })
  Message.success('已通过 rowKey 重新定位并更新原行')
}

const removeRow = (row: Readonly<TableRow>) => {
  tableData.value = tableData.value.filter(item => item.id !== row.id)
  formTableRef.value?.clearValidate()
}

const handleFieldChange = (event: FormTableFieldChangePayload) => {
  fieldEvents.value = [event, ...fieldEvents.value].slice(0, 6)
}

const handleTableDataUpdate = (nextTableData: TableRow[]) => {
  // FormTable 的公开事件支持任意 TableRow；本页的输入数据始终由 DemoRow 创建。
  tableData.value = nextTableData as DemoRow[]
}

const resetRows = () => {
  tableData.value = createRows()
  inspectedContext.value = null
  fieldEvents.value = []
  formTableRef.value?.clearValidate()
}

const configurationExample = `// 列级 cellSlot：无 fieldKey，直接使用 row
{
  key: 'amount-column',
  label: '派生金额',
  cellSlot: 'amount-cell'
}

<template #amount-cell="{ row }">
  ¥ {{ row.quantity * row.unitPrice }}
</template>

// 字段 Slot：保留 fieldKey、setValue、propPath 和 rules
{
  fieldKey: 'score',
  type: 'slot',
  formItemProps: { rules: [{ required: true }] },
  component: { renderer: 'score-editor' }
}`
</script>

<style scoped>
.demo-page { max-width: 1380px; margin: 0 auto; padding: 40px 32px; color: #1f2937; }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
.page-heading h1 { margin: 4px 0 8px; }
.page-heading p { margin: 0; color: #667085; }
.eyebrow { color: #2563eb !important; font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.boundary-card { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 22px; }
.boundary-card div { display: grid; gap: 5px; padding: 16px 18px; border: 1px solid #dbe4f0; border-radius: 10px; background: #f8fafc; }
.boundary-card strong { color: #1d4ed8; }
.boundary-card span { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.boundary-card small, .score-editor small { color: #667085; }
.table-card, .detail-card, .code-card { margin-top: 18px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; box-shadow: 0 6px 20px rgba(15, 23, 42, .05); }
.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.detail-card { min-width: 0; }
.detail-card h2, .code-card h2 { margin-top: 0; font-size: 18px; }
.profile-card, .plain-cell, .amount { width: 100%; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: inherit; cursor: pointer; }
.profile-card { display: flex; align-items: center; gap: 10px; }
.profile-card span:last-child { display: grid; gap: 3px; }
.profile-card small { color: #667085; }
.avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: #1d4ed8; background: #dbeafe; font-weight: 700; }
.plain-cell { text-align: center; }
.amount { font-variant-numeric: tabular-nums; text-align: right; font-weight: 700; }
.inspectable:hover { color: #2563eb; }
.score-editor { display: flex; align-items: center; gap: 10px; }
.score-editor :deep(.el-input-number) { width: 130px; }
.row-actions { display: flex; justify-content: center; white-space: nowrap; }
.danger { color: #ef4444; }
.empty { color: #98a2b3; }
pre { max-height: 400px; margin: 0; padding: 16px; overflow: auto; border-radius: 8px; background: #f6f8fa; line-height: 1.55; }
@media (max-width: 900px) {
  .page-heading { align-items: flex-start; flex-direction: column; }
  .boundary-card, .details-grid { grid-template-columns: 1fr; }
}
</style>
