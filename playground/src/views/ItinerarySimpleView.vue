<template>
  <main class="demo-page">
    <router-link to="/">← 返回调试台</router-link>

    <div class="page-heading">
      <div>
        <p class="eyebrow">SIMPLE BUSINESS DEMO</p>
        <h1>多日议程编排</h1>
        <p>日期和主题属于每日分组，多条议程共用；其余字段仍按行独立编辑。</p>
      </div>
      <div class="heading-actions">
        <el-switch v-model="dragEnabled" active-text="启用拖拽" />
        <el-button @click="resetRows">恢复示例数据</el-button>
        <el-button type="primary" @click="submitRows">生成提交数据</el-button>
      </div>
    </div>

    <section class="design-note">
      <strong>实现重点：</strong>
      <span>SortableJS 只增强示例页面的主表体；拖拽排序限定在同一天内，合并字段仍由业务数据同步维护。</span>
    </section>

    <el-alert
      class="drag-tip"
      title="按住“议程”列左侧手柄拖动；输入控件不会触发拖拽，上下移动按钮仍可作为操作兜底。"
      type="info"
      :closable="false"
      show-icon
    />

    <section class="table-card">
      <FormTable
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        :form-props="{ size: 'small' }"
        :table-props="tableProps"
        @update:tableData="replaceTableData"
      >
        <template #day-date="{ row }">
          <el-input
            :value="row.dateLabel"
            placeholder="例如：第一天"
            @input="updateGroupField(row, 'dateLabel', $event)"
          />
        </template>

        <template #day-topic="{ row }">
          <el-input
            :value="row.topic"
            placeholder="请输入议程主题"
            @input="updateGroupField(row, 'topic', $event)"
          />
        </template>

        <template #time-plan="{ row }">
          <el-time-picker
            is-range
            :value="row.timeRange"
            value-format="HH:mm"
            format="HH:mm"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            range-separator="~"
            @input="updateRow(row, { timeRange: $event })"
          />
        </template>

        <template #sequence-label="{ value }">
          <div class="sequence-cell">
            <i
              class="el-icon-rank itinerary-drag-handle"
              :class="{ 'is-disabled': !dragEnabled }"
              role="button"
              aria-label="拖动调整议程顺序"
              title="拖动调整议程顺序"
            />
            <el-tag size="small">议程{{ value }}</el-tag>
          </div>
        </template>

        <template #itinerary-name="{ row }">
          <div class="name-editor">
            <el-input
              :value="row.name"
              placeholder="请输入议程名称"
              @input="updateRow(row, { name: $event })"
            />
            <el-tooltip content="模拟从内部议程库选择" placement="top">
              <el-button icon="el-icon-search" circle @click="selectPresetName(row)" />
            </el-tooltip>
          </div>
        </template>

        <template #row-actions="{ row }">
          <div class="row-actions">
            <el-tooltip content="在本日新增议程" placement="top">
              <el-button type="primary" icon="el-icon-plus" circle size="mini" @click="addItinerary(row)" />
            </el-tooltip>
            <el-button icon="el-icon-delete" circle size="mini" @click="removeItinerary(row)" />
            <el-button icon="el-icon-top" circle size="mini" :disabled="!canMove(row, -1)" @click="moveItinerary(row, -1)" />
            <el-button icon="el-icon-bottom" circle size="mini" :disabled="!canMove(row, 1)" @click="moveItinerary(row, 1)" />
          </div>
        </template>
      </FormTable>
    </section>

    <section class="result-card">
      <h2>提交数据</h2>
      <p v-if="!submittedRows" class="empty-result">点击“生成提交数据”后显示，提交前会按日期分组。</p>
      <pre v-else>{{ JSON.stringify(submittedRows, null, 2) }}</pre>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Message } from 'element-ui'
import Sortable from 'sortablejs'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose, TableRow } from '@itagan/form-table'

/** 表格的编辑行；同一 dayId 的行共同组成一天的议程。 */
interface ItineraryRow extends TableRow {
  _rowKey: string
  dayId: string
  dateLabel: string
  topic: string
  sequence: number
  timeRange: string[]
  name: string
  city: string
  location: string
}

interface SpanMethodContext {
  column: { property?: string }
  rowIndex: number
}

type GroupField = 'dateLabel' | 'topic'

/** 初始数据保持同一天连续排列，确保纵向合并结果稳定。 */
const createInitialRows = (): ItineraryRow[] => [
  { _rowKey: 'day-1:1', dayId: 'day-1', dateLabel: '第一天', topic: '产品与团队共创', sequence: 1, timeRange: ['09:00', '10:30'], name: '产品战略分享', city: '杭州', location: '国际会议中心 A 厅' },
  { _rowKey: 'day-1:2', dayId: 'day-1', dateLabel: '第一天', topic: '产品与团队共创', sequence: 2, timeRange: ['10:45', '12:00'], name: '业务案例研讨', city: '杭州', location: '国际会议中心 B 厅' },
  { _rowKey: 'day-1:3', dayId: 'day-1', dateLabel: '第一天', topic: '产品与团队共创', sequence: 3, timeRange: ['14:00', '17:00'], name: '分组工作坊', city: '杭州', location: '创新中心 3 楼' },
  { _rowKey: 'day-2:1', dayId: 'day-2', dateLabel: '第二天', topic: '客户现场参访', sequence: 1, timeRange: ['09:30', '11:30'], name: '标杆客户参访', city: '上海', location: '客户体验中心' },
  { _rowKey: 'day-2:2', dayId: 'day-2', dateLabel: '第二天', topic: '客户现场参访', sequence: 2, timeRange: ['13:30', '15:30'], name: '交流与复盘', city: '上海', location: '园区会议室' }
]

let rowSequence = 0
const tableData = ref<ItineraryRow[]>(createInitialRows())
const submittedRows = ref<unknown[] | null>(null)
const formTableRef = ref<FormTableExpose>()
const dragEnabled = ref(true)
let sortableInstance: Sortable | null = null

/** 预计算连续日期分组跨度，spanMethod 渲染时只读取结果，不重复扫描全表。 */
const daySpans = computed(() => {
  const spans = new Array(tableData.value.length).fill(0)
  for (let start = 0; start < tableData.value.length;) {
    let end = start + 1
    while (end < tableData.value.length && tableData.value[end].dayId === tableData.value[start].dayId) end += 1
    spans[start] = end - start
    start = end
  }
  return spans
})

/** 日期和主题使用相同的 dayId 分组跨度进行纵向合并。 */
const spanMethod = ({ column, rowIndex }: SpanMethodContext) => {
  if (!['dateLabel', 'topic'].includes(column.property || '')) return
  const rowspan = daySpans.value[rowIndex]
  return rowspan > 0 ? { rowspan, colspan: 1 } : { rowspan: 0, colspan: 0 }
}

const tableProps = computed(() => ({ border: true, rowKey: '_rowKey', spanMethod }))

const columns: ColumnConfig[] = [
  {
    key: 'date-column', label: '议程日期', props: { prop: 'dateLabel', width: 150, align: 'center' },
    children: [{ children: [{ key: 'date-field', fieldKey: 'dateLabel', type: 'slot', component: { renderer: 'day-date' } }] }]
  },
  {
    key: 'topic-column', label: '议程主题', props: { prop: 'topic', minWidth: 200 },
    children: [{ children: [{ key: 'topic-field', fieldKey: 'topic', type: 'slot', component: { renderer: 'day-topic' } }] }]
  },
  {
    key: 'sequence-column', label: '议程', props: { width: 82, align: 'center' },
    children: [{ children: [{
      key: 'sequence-field', fieldKey: 'sequence', type: 'slot',
      component: { renderer: 'sequence-label' }
    }] }]
  },
  {
    key: 'time-column', label: '时间计划', props: { minWidth: 230 },
    children: [{ children: [{ key: 'time-field', fieldKey: 'timeRange', type: 'slot', component: { renderer: 'time-plan' } }] }]
  },
  {
    key: 'name-column', label: '议程名称', props: { minWidth: 280 },
    children: [{ children: [{ key: 'name-field', fieldKey: 'name', type: 'slot', component: { renderer: 'itinerary-name' } }] }]
  },
  {
    key: 'city-column', label: '议程城市', props: { minWidth: 150 },
    children: [{ children: [{
      key: 'city-field', fieldKey: 'city', type: 'select',
      component: {
        props: { placeholder: '请选择城市', filterable: true },
        options: ['杭州', '上海', '北京', '深圳', '广州'].map(value => ({ label: value, value }))
      }
    }] }]
  },
  {
    key: 'location-column', label: '议程地点', props: { minWidth: 220 },
    children: [{ children: [{
      key: 'location-field', fieldKey: 'location', type: 'input',
      component: { props: { placeholder: '请输入议程地点', clearable: true } }
    }] }]
  },
  {
    key: 'action-column', label: '操作', props: { width: 190, fixed: 'right', align: 'center' },
    children: [{ children: [{ key: 'action-field', fieldKey: '_rowKey', type: 'slot', component: { renderer: 'row-actions' } }] }]
  }
]

/** 接收 FormTable 内置表单组件产生的新行数组。 */
const replaceTableData = (rows: TableRow[]) => {
  tableData.value = rows as ItineraryRow[]
  submittedRows.value = null
}

/** 获取非固定列对应的主表体，避免把 Sortable 绑定到 Element UI 的固定列副本。 */
const getMainTableBody = () => {
  const tableElement = formTableRef.value?.getTableRef()?.$el as HTMLElement | undefined
  return tableElement?.querySelector<HTMLElement>('.el-table__body-wrapper > table > tbody') || null
}

/**
 * 把稳定行标识写到主表体 DOM，供 Sortable 在拖动期间识别源行和目标日期分组。
 * 这些属性仅用于第三方库适配，不作为业务数据来源。
 */
const syncSortableRowMetadata = () => {
  const tableBody = getMainTableBody()
  if (!tableBody) return
  Array.from(tableBody.children).forEach((element, index) => {
    const row = tableData.value[index]
    const rowElement = element as HTMLElement
    rowElement.dataset.id = row?._rowKey || ''
    rowElement.dataset.dayId = row?.dayId || ''
  })
}

/** Sortable 修改 DOM 后，将最终下标转换为受控 tableData 的不可变排序。 */
const applyDragResult = (oldIndex?: number, newIndex?: number) => {
  if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
  const sourceRow = tableData.value[oldIndex]
  const targetRow = tableData.value[newIndex]

  if (!sourceRow || !targetRow || sourceRow.dayId !== targetRow.dayId) {
    // 双重保护：即使外部 DOM 事件绕过 onMove，也恢复为受控数据顺序。
    sortableInstance?.sort(tableData.value.map(row => row._rowKey), true)
    Message.warning('议程只能在同一天内拖动排序')
    return
  }

  const nextRows = [...tableData.value]
  const [movedRow] = nextRows.splice(oldIndex, 1)
  nextRows.splice(newIndex, 0, movedRow)
  tableData.value = normalizeSequence(nextRows, sourceRow.dayId)
  submittedRows.value = null
}

/** 在 FormTable 完成挂载后为主表体初始化独立的 SortableJS 适配层。 */
const initializeSortable = async () => {
  await nextTick()
  const tableBody = getMainTableBody()
  if (!tableBody || sortableInstance) return

  syncSortableRowMetadata()
  sortableInstance = Sortable.create(tableBody, {
    animation: 160,
    disabled: !dragEnabled.value,
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 3,
    handle: '.itinerary-drag-handle',
    draggable: 'tr',
    filter: 'input, textarea, button, .el-select, .el-time-panel',
    ghostClass: 'itinerary-sortable-ghost',
    chosenClass: 'itinerary-sortable-chosen',
    dragClass: 'itinerary-sortable-drag',
    onMove: event => event.dragged.dataset.dayId === event.related.dataset.dayId,
    onEnd: event => applyDragResult(event.oldIndex, event.newIndex)
  })
}

/** 更新单行插槽字段，同时维持不可变数组更新。 */
const updateRow = (target: ItineraryRow, patch: Partial<ItineraryRow>) => {
  tableData.value = tableData.value.map(row => row._rowKey === target._rowKey ? { ...row, ...patch } : row)
  submittedRows.value = null
}

/** 合并字段在组首编辑后同步到整组，避免提交数据出现同组值不一致。 */
const updateGroupField = (target: ItineraryRow, field: GroupField, value: string) => {
  tableData.value = tableData.value.map(row => row.dayId === target.dayId ? { ...row, [field]: value } : row)
  submittedRows.value = null
}

/** 模拟通过企业内部选择器回填议程名称。 */
const selectPresetName = (row: ItineraryRow) => {
  updateRow(row, { name: '内部议程库：创新实践分享' })
  Message.success('已模拟选择内部议程')
}

/** 在当前行后新增同一天的议程，并重新生成当天序号。 */
const addItinerary = (source: ItineraryRow) => {
  const sourceIndex = tableData.value.findIndex(row => row._rowKey === source._rowKey)
  const lastGroupIndex = tableData.value.reduce((last, row, index) => row.dayId === source.dayId ? index : last, sourceIndex)
  const newRow: ItineraryRow = {
    ...source,
    _rowKey: `${source.dayId}:new-${Date.now()}-${++rowSequence}`,
    sequence: 0,
    timeRange: ['09:00', '10:00'],
    name: '',
    location: ''
  }
  const nextRows = [...tableData.value]
  nextRows.splice(lastGroupIndex + 1, 0, newRow)
  tableData.value = normalizeSequence(nextRows, source.dayId)
  submittedRows.value = null
}

/** 每天至少保留一条议程，防止分组信息随最后一行一同丢失。 */
const removeItinerary = (target: ItineraryRow) => {
  const groupRows = tableData.value.filter(row => row.dayId === target.dayId)
  if (groupRows.length === 1) {
    Message.warning('每天至少保留一条议程')
    return
  }
  tableData.value = normalizeSequence(
    tableData.value.filter(row => row._rowKey !== target._rowKey),
    target.dayId
  )
  submittedRows.value = null
}

/** 议程只允许在同一天的范围内调整顺序。 */
const canMove = (target: ItineraryRow, offset: number) => {
  const groupRows = tableData.value.filter(row => row.dayId === target.dayId)
  const index = groupRows.findIndex(row => row._rowKey === target._rowKey)
  return index + offset >= 0 && index + offset < groupRows.length
}

const moveItinerary = (target: ItineraryRow, offset: number) => {
  if (!canMove(target, offset)) return
  const from = tableData.value.findIndex(row => row._rowKey === target._rowKey)
  const to = from + offset
  const nextRows = [...tableData.value]
  const [moved] = nextRows.splice(from, 1)
  nextRows.splice(to, 0, moved)
  tableData.value = normalizeSequence(nextRows, target.dayId)
  submittedRows.value = null
}

/** 根据当前视觉顺序生成一天内连续的议程序号。 */
const normalizeSequence = (rows: ItineraryRow[], dayId: string) => {
  let sequence = 0
  return rows.map(row => row.dayId === dayId ? { ...row, sequence: ++sequence } : row)
}

/** 将平铺编辑数据归一化为接口更常用的“日期 + 议程列表”结构。 */
const submitRows = () => {
  const days = new Map<string, { dayId: string, dateLabel: string, topic: string, itineraries: object[] }>()
  tableData.value.forEach(({ _rowKey, dayId, dateLabel, topic, ...itinerary }) => {
    if (!days.has(dayId)) days.set(dayId, { dayId, dateLabel, topic, itineraries: [] })
    days.get(dayId)?.itineraries.push(itinerary)
  })
  submittedRows.value = [...days.values()]
  Message.success('已按日期生成提交数据')
}

const resetRows = () => {
  tableData.value = createInitialRows()
  submittedRows.value = null
}

/** 数据增删或重排后等待 Element UI 更新行 DOM，再刷新拖拽识别属性。 */
watch(tableData, () => nextTick(syncSortableRowMetadata))

/** 开关只更新现有实例配置，避免反复创建 DOM 监听器。 */
watch(dragEnabled, enabled => sortableInstance?.option('disabled', !enabled))

onMounted(initializeSortable)
onBeforeUnmount(() => {
  sortableInstance?.destroy()
  sortableInstance = null
})
</script>

<style scoped>
.demo-page { max-width: 1720px; margin: 0 auto; padding: 32px; }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-top: 16px; }
.eyebrow { margin: 0 0 6px; color: #409eff; font-size: 12px; font-weight: 700; letter-spacing: .08em; }
h1 { margin: 0; color: #1f2937; }
.page-heading p:last-child { margin: 8px 0 0; color: #667085; }
.heading-actions, .name-editor, .row-actions { display: flex; align-items: center; gap: 8px; }
.design-note { margin-top: 20px; padding: 14px 18px; color: #475467; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; }
.design-note strong { color: #1d4ed8; }
.drag-tip { margin-top: 14px; }
.table-card, .result-card { margin-top: 18px; padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 6px 20px rgba(15, 23, 42, .05); }
.table-card { overflow: hidden; }
.name-editor :deep(.el-input) { flex: 1; }
.sequence-cell { display: inline-flex; align-items: center; gap: 7px; }
.itinerary-drag-handle { color: #409eff; font-size: 17px; cursor: grab; }
.itinerary-drag-handle:active { cursor: grabbing; }
.itinerary-drag-handle.is-disabled { color: #c0c4cc; cursor: not-allowed; }
.row-actions { justify-content: center; white-space: nowrap; }
.table-card :deep(.itinerary-sortable-ghost) { opacity: .35; background: #ecf5ff; }
.table-card :deep(.itinerary-sortable-chosen) { box-shadow: inset 3px 0 #409eff; }
.table-card :deep(.itinerary-sortable-drag) { background: #fff; }
.result-card h2 { margin-top: 0; }
.empty-result { color: #98a2b3; }
pre { max-height: 420px; padding: 16px; overflow: auto; background: #f8fafc; border-radius: 8px; }
@media (max-width: 900px) { .page-heading { align-items: flex-start; flex-direction: column; } }
</style>
