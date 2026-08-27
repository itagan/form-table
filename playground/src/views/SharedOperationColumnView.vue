<template>
  <main class="demo-page">
    <router-link to="/">← 返回示例中心</router-link>

    <header class="page-heading">
      <div>
        <p class="eyebrow">SHARED CONFIG REGRESSION DEMO</p>
        <h1>多需求共享固定操作列</h1>
        <p>勾选需求项后通过 v-for 渲染多个 FormTable；所有实例复用同一个 columns 数组和固定操作列对象。</p>
      </div>
      <el-tag :type="isIsolated ? 'success' : 'danger'">
        {{ isIsolated ? '需求数据相互隔离' : '检测到数据异常' }}
      </el-tag>
    </header>

    <section class="demo-card selector-card">
      <strong>选择要填写的需求项</strong>
      <el-checkbox-group v-model="selectedDemandKeys">
        <el-checkbox
          v-for="demand in demandOptions"
          :key="demand.key"
          :label="demand.key"
        >
          {{ demand.label }}
        </el-checkbox>
      </el-checkbox-group>
      <p class="note">取消勾选只隐藏表单，不清空已填写数据；重新勾选后继续编辑原数据。</p>
    </section>

    <section v-if="selectedDemands.length === 0" class="demo-card empty-card">
      请至少勾选一个需求项。
    </section>

    <section
      v-for="demand in selectedDemands"
      :key="demand.key"
      class="demo-card demand-card"
      :data-demand-key="demand.key"
    >
      <div class="demand-heading">
        <div>
          <h2>{{ demand.label }}</h2>
          <span>{{ demand.description }}</span>
        </div>
        <div class="demand-summary">
          <el-tag size="small" type="info">{{ demandRows[demand.key].length }} 行</el-tag>
          <el-button size="small" type="primary" @click="appendRow(demand.key)">末尾新增</el-button>
        </div>
      </div>

      <FormTable
        :table-data="demandRows[demand.key]"
        :columns="sharedColumns"
        row-key="id"
        :form-props="{ size: 'small' }"
        :table-props="{ border: true, emptyText: '暂无明细，请点击末尾新增' }"
        @update:tableData="replaceRows(demand.key, $event)"
      >
        <template #demand-actions="{ row }">
          <div class="row-actions">
            <el-button type="text" @click="insertAfter(demand.key, row)">后插一行</el-button>
            <el-button type="text" class="danger" @click="removeRow(demand.key, row)">删除</el-button>
          </div>
        </template>
      </FormTable>
    </section>

    <section class="demo-card result-card">
      <div>
        <h2>操作核对</h2>
        <p class="note">每次操作记录目标需求及操作前后行数，可直接观察共享操作列是否串到其他表格。</p>
      </div>
      <el-table :data="operationLogs" size="mini" border empty-text="尚未执行新增或删除">
        <el-table-column prop="demandLabel" label="目标需求" width="140" />
        <el-table-column prop="action" label="操作" width="100" />
        <el-table-column prop="change" label="目标表行数变化" width="150" />
        <el-table-column prop="unchanged" label="其他需求" />
      </el-table>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'

type DemandKey = 'venue' | 'hotel' | 'meal'

interface DemandOption {
  key: DemandKey
  label: string
  description: string
}

interface DemandRow extends TableRow {
  id: string
  content: string
  quantity: number
  remark: string
}

interface OperationLog {
  id: number
  demandLabel: string
  action: string
  change: string
  unchanged: string
}

const demandOptions: DemandOption[] = [
  { key: 'venue', label: '会场需求', description: '会场、会议室和设备明细' },
  { key: 'hotel', label: '住宿需求', description: '酒店、房型和间夜明细' },
  { key: 'meal', label: '用餐需求', description: '餐次、桌数和人数明细' }
]

const selectedDemandKeys = ref<DemandKey[]>(['venue', 'hotel'])
const selectedDemands = computed(() => demandOptions.filter(item => selectedDemandKeys.value.includes(item.key)))

let rowSequence = 10
const createRow = (content = '', quantity = 1, remark = ''): DemandRow => ({
  id: `demand-row-${++rowSequence}`,
  content,
  quantity,
  remark
})

const demandRows = ref<Record<DemandKey, DemandRow[]>>({
  venue: [createRow('主会场 LED 屏', 1, '含调试')],
  hotel: [createRow('高级双床房', 8, '入住两晚')],
  meal: [createRow('会议午餐', 60, '含素食 3 份')]
})

/** 同一数组（包括 actionColumn 对象）直接传给每一个 FormTable，用于覆盖共享配置场景。 */
const actionColumn: ColumnConfig = {
  key: 'shared-action-column',
  label: '操作',
  props: { width: 150, fixed: 'right', align: 'center' },
  cellSlot: 'demand-actions'
}

const sharedColumns: ColumnConfig[] = [
  {
    key: 'content-column',
    label: '需求内容',
    props: { minWidth: 240 },
    formItems: [{
      key: 'content-field',
      fieldKey: 'content',
      type: 'input',
      formItemProps: { rules: [{ required: true, message: '请输入需求内容', trigger: 'blur' }] },
      component: { props: { placeholder: '请输入需求内容', clearable: true } }
    }]
  },
  {
    key: 'quantity-column',
    label: '数量',
    props: { width: 180 },
    formItems: [{
      key: 'quantity-field',
      fieldKey: 'quantity',
      type: 'number',
      component: { props: { min: 1, controlsPosition: 'right' } }
    }]
  },
  {
    key: 'remark-column',
    label: '备注',
    props: { minWidth: 220 },
    formItems: [{
      key: 'remark-field',
      fieldKey: 'remark',
      type: 'input',
      component: { props: { placeholder: '选填', clearable: true } }
    }]
  },
  actionColumn
]

const operationLogs = ref<OperationLog[]>([])
let logSequence = 0

const demandLabel = (key: DemandKey) => demandOptions.find(item => item.key === key)?.label || key
const rowCounts = (): Record<DemandKey, number> => ({
  venue: demandRows.value.venue.length,
  hotel: demandRows.value.hotel.length,
  meal: demandRows.value.meal.length
})

const recordOperation = (
  key: DemandKey,
  action: string,
  before: Record<DemandKey, number>
) => {
  const after = rowCounts()
  const otherChanges = demandOptions
    .filter(item => item.key !== key && before[item.key] !== after[item.key])
    .map(item => item.label)

  operationLogs.value = [{
    id: ++logSequence,
    demandLabel: demandLabel(key),
    action,
    change: `${before[key]} → ${after[key]}`,
    unchanged: otherChanges.length ? `异常变更：${otherChanges.join('、')}` : '行数未变化'
  }, ...operationLogs.value].slice(0, 8)
}

const isIsolated = computed(() => operationLogs.value.every(log => log.unchanged === '行数未变化'))

const replaceRows = (key: DemandKey, rows: TableRow[]) => {
  demandRows.value = { ...demandRows.value, [key]: rows as DemandRow[] }
}

const appendRow = (key: DemandKey) => {
  const before = rowCounts()
  replaceRows(key, [...demandRows.value[key], createRow()])
  recordOperation(key, '末尾新增', before)
}

const insertAfter = (key: DemandKey, source: TableRow) => {
  const before = rowCounts()
  const sourceIndex = demandRows.value[key].findIndex(row => row.id === source.id)
  if (sourceIndex < 0) return
  replaceRows(key, [
    ...demandRows.value[key].slice(0, sourceIndex + 1),
    createRow(),
    ...demandRows.value[key].slice(sourceIndex + 1)
  ])
  recordOperation(key, '后插一行', before)
}

const removeRow = (key: DemandKey, source: TableRow) => {
  const before = rowCounts()
  replaceRows(key, demandRows.value[key].filter(row => row.id !== source.id))
  recordOperation(key, '删除', before)
}
</script>

<style scoped>
.demo-page { max-width: 1180px; margin: 0 auto; padding: 32px; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-top: 20px; }
.page-heading h1, .demand-heading h2, .result-card h2 { margin: 0; }
.page-heading p { margin: 10px 0 0; color: #64748b; }
.eyebrow { color: #2563eb !important; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
.demo-card { margin-top: 20px; padding: 22px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; }
.selector-card { display: flex; align-items: center; flex-wrap: wrap; gap: 18px; }
.selector-card .note { flex-basis: 100%; }
.demand-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
.demand-heading span, .note { color: #64748b; font-size: 13px; }
.demand-summary, .row-actions { display: flex; align-items: center; gap: 10px; }
.row-actions { justify-content: center; white-space: nowrap; }
.danger { color: #f56c6c; }
.empty-card { color: #64748b; text-align: center; }
.result-card { display: grid; grid-template-columns: 260px 1fr; gap: 24px; }
@media (max-width: 760px) {
  .demo-page { padding: 20px; }
  .page-heading, .demand-heading { align-items: flex-start; flex-direction: column; }
  .result-card { grid-template-columns: 1fr; }
}
</style>
