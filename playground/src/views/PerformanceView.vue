<template>
  <main class="performance-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">PERFORMANCE LAB</p>
        <h1>大数据量性能实验</h1>
        <p>比较纯展示、常规编辑和动态配置；所有耗时均为当前浏览器单次测量，不作为固定性能承诺。</p>
      </div>
      <el-tag type="warning" effect="plain">Element UI Table · 非虚拟滚动</el-tag>
    </header>

    <section class="panel control-panel">
      <el-form inline size="small" label-position="top">
        <el-form-item label="场景">
          <el-select v-model="draftScenario" style="width: 180px">
            <el-option label="cellSlot 纯展示" value="display" />
            <el-option label="内置 Input 编辑" value="edit" />
            <el-option label="动态配置编辑" value="dynamic" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据行数">
          <el-select v-model="draftRowCount" style="width: 130px">
            <el-option v-for="count in rowCountOptions" :key="count" :label="count" :value="count" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据列数">
          <el-select v-model="draftFieldCount" style="width: 130px">
            <el-option v-for="count in fieldCountOptions" :key="count" :label="count" :value="count" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行">
          <el-button type="primary" :loading="isMeasuring" @click="applyScenario">生成并测量首次渲染</el-button>
        </el-form-item>
      </el-form>

      <div class="scenario-summary">
        <strong>{{ scenarioLabel }}</strong>
        <span>{{ currentConfig.rowCount }} 行 × {{ currentConfig.fieldCount }} 数据列</span>
        <span>{{ formattedCellCount }} 个数据单元格</span>
        <span v-if="currentConfig.scenario !== 'display'">另含 1 个 updateRow 操作列</span>
      </div>

      <div class="operation-buttons">
        <el-button size="small" :disabled="isMeasuring || currentConfig.scenario === 'display'" @click="measureInputUpdate">
          测量单字段输入
        </el-button>
        <el-button size="small" :disabled="isMeasuring || currentConfig.scenario === 'display'" @click="measureUpdateRow">
          测量 updateRow
        </el-button>
        <el-button size="small" :disabled="isMeasuring" @click="measureAddRow">测量新增行</el-button>
        <el-button size="small" :disabled="isMeasuring || tableData.length <= 1" @click="measureRemoveRow">测量删除行</el-button>
        <el-button size="small" :disabled="isMeasuring" @click="measureToggleColumn">测量末列显隐</el-button>
      </div>
    </section>

    <section class="metric-grid" aria-label="性能指标">
      <article v-for="metric in metricCards" :key="metric.key" class="metric-card">
        <span>{{ metric.label }}</span>
        <strong>{{ formatMetric(metric.value) }}</strong>
        <small>{{ metric.description }}</small>
      </article>
      <article class="metric-card">
        <span>当前 DOM 节点</span>
        <strong>{{ domNodeCount.toLocaleString('zh-CN') }}</strong>
        <small>仅统计 FormTable 实验容器后代节点</small>
      </article>
    </section>

    <section class="panel callback-panel">
      <div>
        <h2>动态配置回调计数</h2>
        <p>仅“动态配置编辑”场景累计。修改一个字段后可观察无关配置是否重新求值。</p>
      </div>
      <div class="counter-list">
        <span>Column <strong>{{ callbackSnapshot.column }}</strong></span>
        <span>Row <strong>{{ callbackSnapshot.row }}</strong></span>
        <span>Item <strong>{{ callbackSnapshot.item }}</strong></span>
        <span>Component <strong>{{ callbackSnapshot.component }}</strong></span>
      </div>
    </section>

    <section class="panel table-panel">
      <div class="table-heading">
        <div>
          <h2>实验表格</h2>
          <p>固定高度只限制可见区域，Element UI 仍会创建全部行和字段组件。</p>
        </div>
        <el-tag size="small">当前 {{ tableData.length }} 行</el-tag>
      </div>

      <div ref="tableHost" class="table-host">
        <PerformanceFormTable
          v-model="tableData"
          :columns="columns"
          :form-props="{ size: 'mini' }"
          :table-props="{ border: true, stripe: true, rowKey: 'id', height: 520 }"
        >
          <template #perf-display="{ row, columnConfig }">
            <span class="display-value">{{ row[columnConfig.key] }}</span>
          </template>

          <template #perf-actions="{ index, updateRow }">
            <el-button
              v-if="index === 0"
              class="perf-row-update"
              type="text"
              size="mini"
              @click="runRowPatch(updateRow)"
            >批量更新首行</el-button>
            <span v-else class="muted">—</span>
          </template>
        </PerformanceFormTable>
      </div>
    </section>

    <section class="panel notes-panel">
      <h2>如何解读</h2>
      <ul>
        <li>开发模式包含调试开销；记录基线时应使用 production build，并重复执行后取中位数。</li>
        <li>编辑组件、校验和动态回调通常比纯展示消耗更多；应比较相同机器和浏览器中的相对变化。</li>
        <li>数百行以上的复杂编辑建议分页或分批编辑；数千行持续编辑需要虚拟表格方案。</li>
      </ul>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'
import { Message } from 'element-ui'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'

// 大量动态 Slot 表达式会触发旧版 vue-tsc 的递归深度上限；运行时仍使用同一个公开组件。
const PerformanceFormTable: any = FormTable

type Scenario = 'display' | 'edit' | 'dynamic'
type MetricKey = 'initialRender' | 'inputUpdate' | 'rowPatch' | 'addRow' | 'removeRow' | 'toggleColumn'

interface ScenarioConfig {
  scenario: Scenario
  rowCount: number
  fieldCount: number
}

interface CallbackCounts {
  column: number
  row: number
  item: number
  component: number
}

const rowCountOptions = [50, 100, 300, 500, 1000]
const fieldCountOptions = [2, 4, 6]
const scenarioLabels: Record<Scenario, string> = {
  display: 'cellSlot 纯展示',
  edit: '内置 Input 编辑',
  dynamic: '动态配置编辑'
}

const draftScenario = ref<Scenario>('edit')
const draftRowCount = ref(100)
const draftFieldCount = ref(4)
const currentConfig = ref<ScenarioConfig>({ scenario: 'edit', rowCount: 100, fieldCount: 4 })
const tableData = ref<TableRow[]>([])
const columns = shallowRef<ColumnConfig[]>([])
const tableHost = ref<HTMLElement | null>(null)
const hideLastColumn = ref(false)
const isMeasuring = ref(false)
const domNodeCount = ref(0)
const metrics = ref<Record<MetricKey, number | null>>({
  initialRender: null,
  inputUpdate: null,
  rowPatch: null,
  addRow: null,
  removeRow: null,
  toggleColumn: null
})

const callbackCounts: CallbackCounts = { column: 0, row: 0, item: 0, component: 0 }
const callbackSnapshot = ref<CallbackCounts>({ ...callbackCounts })

const scenarioLabel = computed(() => scenarioLabels[currentConfig.value.scenario])
const formattedCellCount = computed(() => (
  currentConfig.value.rowCount * currentConfig.value.fieldCount
).toLocaleString('zh-CN'))

const metricCards = computed(() => [
  { key: 'initialRender', label: '首次渲染', value: metrics.value.initialRender, description: '替换 rows/columns 到浏览器绘制完成' },
  { key: 'inputUpdate', label: '单字段输入', value: metrics.value.inputUpdate, description: '真实 input 事件到绘制完成' },
  { key: 'rowPatch', label: 'updateRow', value: metrics.value.rowPatch, description: '首行多字段 patch 到绘制完成' },
  { key: 'addRow', label: '新增一行', value: metrics.value.addRow, description: '父级不可变追加到绘制完成' },
  { key: 'removeRow', label: '删除一行', value: metrics.value.removeRow, description: '父级删除末行到绘制完成' },
  { key: 'toggleColumn', label: '末列显隐', value: metrics.value.toggleColumn, description: 'visible 变化到表格绘制完成' }
])

const resetCallbackCounts = () => {
  callbackCounts.column = 0
  callbackCounts.row = 0
  callbackCounts.item = 0
  callbackCounts.component = 0
  callbackSnapshot.value = { ...callbackCounts }
}

const updateDiagnostics = () => {
  domNodeCount.value = tableHost.value?.querySelectorAll('*').length || 0
  callbackSnapshot.value = { ...callbackCounts }
}

const waitForPaint = async () => {
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  await nextTick()
}

const createRow = (index: number, fieldCount: number): TableRow => {
  const row: TableRow = { id: index + 1, touched: false }
  for (let fieldIndex = 0; fieldIndex < fieldCount; fieldIndex += 1) {
    row[`field${fieldIndex}`] = `R${index + 1}-C${fieldIndex + 1}`
  }
  return row
}

const createRows = (rowCount: number, fieldCount: number) => (
  Array.from({ length: rowCount }, (_, index) => createRow(index, fieldCount))
)

const createDisplayColumn = (fieldIndex: number, fieldCount: number): ColumnConfig => ({
  key: `field${fieldIndex}`,
  label: `字段 ${fieldIndex + 1}`,
  cellSlot: 'perf-display',
  visible: fieldIndex === fieldCount - 1 ? () => !hideLastColumn.value : true,
  props: { minWidth: 140, showOverflowTooltip: true }
})

const createEditColumn = (
  fieldIndex: number,
  fieldCount: number,
  dynamic: boolean
): ColumnConfig => {
  const fieldKey = `field${fieldIndex}`
  const isLast = fieldIndex === fieldCount - 1

  return {
    key: fieldKey,
    label: `字段 ${fieldIndex + 1}`,
    visible: dynamic
      ? () => {
          callbackCounts.column += 1
          return !isLast || !hideLastColumn.value
        }
      : (isLast ? () => !hideLastColumn.value : true),
    props: dynamic
      ? () => {
          callbackCounts.column += 1
          return { minWidth: 170 }
        }
      : { minWidth: 170 },
    children: [{
      key: `${fieldKey}-row`,
      props: dynamic
        ? ({ index }) => {
            callbackCounts.row += 1
            return { gutter: index % 2 === 0 ? 0 : 2 }
          }
        : undefined,
      children: [{
        key: `${fieldKey}-item`,
        fieldKey,
        type: 'input',
        visible: dynamic
          ? ({ row }) => {
              callbackCounts.item += 1
              return row.id != null
            }
          : true,
        colProps: dynamic
          ? () => {
              callbackCounts.item += 1
              return { span: 24 }
            }
          : { span: 24 },
        formItemProps: dynamic
          ? () => {
              callbackCounts.item += 1
              return { class: 'perf-form-item' }
            }
          : { class: 'perf-form-item' },
        component: {
          props: dynamic
            ? ({ index }) => {
                callbackCounts.component += 1
                return { clearable: index < 20, placeholder: fieldKey }
              }
            : { clearable: false }
        }
      }]
    }]
  }
}

const createColumns = (config: ScenarioConfig): ColumnConfig[] => {
  const dataColumns = Array.from({ length: config.fieldCount }, (_, fieldIndex) => (
    config.scenario === 'display'
      ? createDisplayColumn(fieldIndex, config.fieldCount)
      : createEditColumn(fieldIndex, config.fieldCount, config.scenario === 'dynamic')
  ))

  if (config.scenario === 'display') return dataColumns

  return [...dataColumns, {
    key: 'perf-actions',
    label: '操作',
    cellSlot: 'perf-actions',
    props: { width: 130, fixed: 'right', align: 'center' }
  }]
}

const measure = async (key: MetricKey, operation: () => void | Promise<void>) => {
  if (isMeasuring.value) return
  isMeasuring.value = true
  const startedAt = performance.now()
  try {
    await operation()
    await waitForPaint()
    metrics.value = { ...metrics.value, [key]: performance.now() - startedAt }
    updateDiagnostics()
  } finally {
    isMeasuring.value = false
  }
}

const applyScenario = async () => {
  if (isMeasuring.value) return
  const nextConfig: ScenarioConfig = {
    scenario: draftScenario.value,
    rowCount: draftRowCount.value,
    fieldCount: draftFieldCount.value
  }
  if (nextConfig.rowCount >= 1000 && nextConfig.scenario !== 'display') {
    Message.warning('1000 行编辑场景会创建大量 Element UI 组件，页面可能短暂卡顿')
  }

  const nextRows = createRows(nextConfig.rowCount, nextConfig.fieldCount)
  resetCallbackCounts()
  hideLastColumn.value = false
  metrics.value = {
    initialRender: null,
    inputUpdate: null,
    rowPatch: null,
    addRow: null,
    removeRow: null,
    toggleColumn: null
  }
  currentConfig.value = nextConfig

  await measure('initialRender', () => {
    columns.value = createColumns(nextConfig)
    tableData.value = nextRows
  })
}

const measureInputUpdate = async () => {
  const input = tableHost.value?.querySelector<HTMLInputElement>('.el-table__body input')
  if (!input) {
    Message.info('当前场景没有可编辑 input')
    return
  }

  await measure('inputUpdate', () => {
    input.value = `${input.value}-updated`
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const runRowPatch = async (updateRow: (patch: Partial<TableRow>) => void) => {
  await measure('rowPatch', () => {
    updateRow({
      field0: `patched-${Date.now()}`,
      field1: 'batch-updated',
      touched: true
    })
  })
}

const measureUpdateRow = () => {
  const button = tableHost.value?.querySelector<HTMLButtonElement>('.perf-row-update')
  if (!button) {
    Message.info('当前场景不提供 updateRow 操作列')
    return
  }
  button.click()
}

const measureAddRow = async () => {
  await measure('addRow', () => {
    const nextId = tableData.value.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1
    tableData.value = [...tableData.value, createRow(nextId - 1, currentConfig.value.fieldCount)]
  })
}

const measureRemoveRow = async () => {
  await measure('removeRow', () => {
    tableData.value = tableData.value.slice(0, -1)
  })
}

const measureToggleColumn = async () => {
  await measure('toggleColumn', () => {
    hideLastColumn.value = !hideLastColumn.value
  })
}

const formatMetric = (value: number | null) => (
  value == null ? '—' : `${value.toFixed(value >= 100 ? 0 : 1)} ms`
)

onMounted(() => {
  applyScenario()
})
</script>

<style scoped>
.performance-page { max-width: 1420px; margin: 0 auto; padding: 40px 32px; color: #1f2937; }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
.page-heading h1 { margin: 4px 0 8px; }
.page-heading p { max-width: 820px; margin: 0; color: #64748b; }
.eyebrow { color: #2563eb !important; font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.panel { margin-top: 20px; padding: 22px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, .05); }
.control-panel :deep(.el-form-item) { margin-bottom: 8px; }
.scenario-summary, .operation-buttons, .counter-list { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; }
.scenario-summary { margin-top: 8px; color: #64748b; font-size: 14px; }
.scenario-summary strong { color: #1d4ed8; }
.operation-buttons { margin-top: 18px; }
.metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-top: 20px; }
.metric-card { display: grid; gap: 7px; padding: 18px; border: 1px solid #dbe5f1; border-radius: 10px; background: #f8fafc; }
.metric-card span { color: #64748b; font-size: 13px; }
.metric-card strong { color: #0f172a; font-size: 24px; font-variant-numeric: tabular-nums; }
.metric-card small { color: #94a3b8; line-height: 1.4; }
.callback-panel, .table-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.callback-panel h2, .table-heading h2, .notes-panel h2 { margin: 0; font-size: 18px; }
.callback-panel p, .table-heading p { margin: 6px 0 0; color: #64748b; }
.counter-list span { padding: 8px 10px; border-radius: 7px; background: #eff6ff; color: #475569; font-size: 13px; }
.counter-list strong { color: #1d4ed8; font-variant-numeric: tabular-nums; }
.table-host { margin-top: 16px; }
.display-value { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.muted { color: #cbd5e1; }
.notes-panel ul { margin-bottom: 0; padding-left: 20px; color: #475569; line-height: 1.8; }
:deep(.perf-form-item) { margin-bottom: 0; }
:deep(.perf-form-item .el-form-item__content) { line-height: normal; }
@media (max-width: 760px) {
  .performance-page { padding: 24px 16px; }
  .page-heading, .callback-panel, .table-heading { align-items: flex-start; flex-direction: column; }
}
</style>
