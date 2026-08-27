<template>
  <main class="demo-page">
    <router-link to="/">← 返回示例中心</router-link>

    <header class="page-heading">
      <div>
        <p class="eyebrow">SHARED CONFIG REGRESSION DEMO</p>
        <h1>多需求共享固定操作列</h1>
        <p>父页面接收独立选择组件的结果，再通过 props 传给表单列表组件循环渲染多个 FormTable。</p>
      </div>
      <el-tag :type="isIsolated ? 'success' : 'danger'">
        {{ isIsolated ? '需求数据相互隔离' : '检测到数据异常' }}
      </el-tag>
    </header>

    <DemandItemSelector
      :options="demandOptions"
      :selected-keys="selectedDemandKeys"
      @change="handleDemandSelection"
    />

    <p class="selection-parameter">
      传给 DemandFormList 的 props.selectedKeys：<code>{{ selectedDemandKeys.join(', ') || '[]' }}</code>
    </p>

    <DemandFormList
      :selected-keys="selectedDemandKeys"
      :demand-options="demandOptions"
      :demand-rows="demandRows"
      :columns="sharedColumns"
      @replace-rows="replaceRows"
      @append-row="appendRow"
      @insert-after="insertAfter"
      @remove-row="removeRow"
    />

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
import type { ColumnConfig, TableRow } from '@itagan/form-table'
import DemandFormList from '../components/DemandFormList.vue'
import DemandItemSelector from '../components/DemandItemSelector.vue'

type DemandKey = 'hotel' | 'meal' | 'car' | 'train' | 'flight'

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
  { key: 'hotel', label: '酒店需求', description: '酒店、房型、间数和间夜明细' },
  { key: 'meal', label: '用餐需求', description: '餐次、餐标和人数明细' },
  { key: 'car', label: '用车需求', description: '车型、接送路线和车辆数明细' },
  { key: 'train', label: '火车需求', description: '出发到达站、席别和乘车人数明细' },
  { key: 'flight', label: '机票需求', description: '出发到达机场、舱位和乘机人数明细' }
]

const selectedDemandKeys = ref<DemandKey[]>(['hotel', 'meal', 'car'])
const demandKeySet = new Set<DemandKey>(demandOptions.map(item => item.key))

const handleDemandSelection = (selectedKeys: string[]) => {
  selectedDemandKeys.value = selectedKeys.filter((key): key is DemandKey => demandKeySet.has(key as DemandKey))
}

let rowSequence = 10
const createRow = (content = '', quantity = 1, remark = ''): DemandRow => ({
  id: `demand-row-${++rowSequence}`,
  content,
  quantity,
  remark
})

const demandRows = ref<Record<DemandKey, DemandRow[]>>({
  hotel: [createRow('高级双床房', 8, '入住两晚')],
  meal: [createRow('会议午餐', 60, '含素食 3 份')],
  car: [createRow('机场至酒店接机', 2, '7 座商务车')],
  train: [createRow('杭州东至上海虹桥', 4, '二等座')],
  flight: [createRow('北京首都至杭州萧山', 3, '经济舱')]
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
const rowCounts = (): Record<DemandKey, number> => demandOptions.reduce((counts, item) => {
  counts[item.key] = demandRows.value[item.key].length
  return counts
}, {} as Record<DemandKey, number>)

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
.page-heading h1, .result-card h2 { margin: 0; }
.page-heading p { margin: 10px 0 0; color: #64748b; }
.eyebrow { color: #2563eb !important; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
.demo-card { margin-top: 20px; padding: 22px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; }
.selection-parameter { margin: 10px 2px 0; color: #64748b; font-size: 13px; }
.selection-parameter code { color: #1d4ed8; }
.note { color: #64748b; font-size: 13px; }
.result-card { display: grid; grid-template-columns: 260px 1fr; gap: 24px; }
@media (max-width: 760px) {
  .demo-page { padding: 20px; }
  .page-heading { align-items: flex-start; flex-direction: column; }
  .result-card { grid-template-columns: 1fr; }
}
</style>
