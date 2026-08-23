<template>
  <main class="demo-page">
    <router-link to="/">← 返回示例中心</router-link>
    <div class="page-heading">
      <div>
        <p class="eyebrow">BUSINESS MIGRATION DEMO</p>
        <h1>多需求费用明细</h1>
        <p>一个 FormTable 保持公共表头；普通字段使用动态配置，复杂场景按需求类型加载独立业务组件。</p>
      </div>
      <div class="heading-actions">
        <el-switch v-model="readonlyMode" active-text="只读模式" />
        <el-button @click="resetRows">恢复示例数据</el-button>
        <el-button type="primary" @click="submitDemands">校验并生成提交数据</el-button>
      </div>
    </div>

    <section class="architecture-note">
      <strong>数据边界：</strong>
      <span>需求类型是唯一分组且不可编辑；同类明细连续存放并合并类型单元格，差异字段放入 detail。</span>
    </section>

    <section class="table-card">
      <FormTable
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        row-key="_rowKey"
        :form-props="{ size: 'small' }"
        :table-props="tableProps"
        @update:tableData="replaceTableData"
      >
        <template #demand-type="{ row }">
          <strong class="demand-type-label">{{ getDemandTypeLabel(row.type) }}</strong>
        </template>

        <template #total-budget="{ row }">
          <strong class="budget">¥ {{ formatMoney(calculateDemandTotal(row)) }}</strong>
        </template>

        <template #row-actions="{ row }">
          <div class="row-actions">
            <el-tooltip content="在当前行后新增相同类型需求" placement="top">
              <el-button :disabled="readonlyMode" type="primary" icon="el-icon-plus" circle size="mini" @click="addSameType(row)" />
            </el-tooltip>
            <el-button :disabled="readonlyMode" icon="el-icon-delete" circle size="mini" @click="removeRow(row)" />
          </div>
        </template>
      </FormTable>
    </section>

    <section class="result-grid">
      <DemoCollapsiblePanel class="result-card" title="当前响应式行数据">
        <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
      </DemoCollapsiblePanel>
      <DemoCollapsiblePanel
        class="result-card"
        title="归一化提交数据"
        :default-open="submittedPayload !== null"
      >
        <p v-if="!submittedPayload" class="empty-result">点击“校验并生成提交数据”后显示。</p>
        <pre v-else>{{ JSON.stringify(submittedPayload, null, 2) }}</pre>
      </DemoCollapsiblePanel>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { Component } from 'vue'
import { Message } from 'element-ui'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose, TableRow } from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'
import VenueDemandEditor from '../components/demand-demo/VenueDemandEditor.vue'
import HotelDemandEditor from '../components/demand-demo/HotelDemandEditor.vue'
import MealDemandEditor from '../components/demand-demo/MealDemandEditor.vue'
import TransportDemandEditor from '../components/demand-demo/TransportDemandEditor.vue'
import DemandScheduleEditor from '../components/demand-demo/DemandScheduleEditor.vue'
import DemandPricingEditor from '../components/demand-demo/DemandPricingEditor.vue'
import UnsupportedDemandEditor from '../components/demand-demo/UnsupportedDemandEditor.vue'
import {
  calculateDemandTotal,
  createDemandRow,
  demandTypeLabels,
  requiresDemandEndTime,
  requiresDemandSchedule
} from '../components/demand-demo/types'
import type { ComplexDemandType, DemandDetail, DemandRow, DemandSchedule, DemandType } from '../components/demand-demo/types'

type ValidationCallback = (error?: Error) => void
type SpanMethodContext = { column: { property?: string }, rowIndex: number }
type CellSpan = { rowspan: number, colspan: number }

const descriptionEditors: Record<ComplexDemandType, Component> = {
  venue: VenueDemandEditor,
  hotel: HotelDemandEditor,
  meal: MealDemandEditor,
  flight: TransportDemandEditor,
  train: TransportDemandEditor,
  car: TransportDemandEditor
}

const seedRow = (
  type: DemandType,
  detail: DemandDetail,
  schedule: DemandSchedule,
  quantity: number,
  unitPrice: number
): DemandRow => {
  const row = createDemandRow(type)
  return {
    ...row,
    detail: { ...row.detail, ...detail },
    schedule: { ...row.schedule, ...schedule },
    pricing: { ...row.pricing, quantity, unitPrice }
  }
}

const createInitialRows = (): DemandRow[] => [
  seedRow('venue', { venueType: 'meeting', attendeeCount: 80, equipment: '投影、音响' }, { start: '2026-09-18 09:00:00', end: '2026-09-18 17:00:00' }, 1, 6800),
  seedRow('hotel', { hotelName: '城市会议酒店', roomName: '高级双床房', roomCount: 12, roomType: 'twin', guestCount: 24, breakfast: true }, { start: '2026-09-17 14:00:00', end: '2026-09-19 12:00:00' }, 24, 520),
  seedRow('hotel', { hotelName: '城市会议酒店', roomName: '商务大床房', roomCount: 4, roomType: 'king', guestCount: 4, breakfast: true, remark: '嘉宾楼层' }, { start: '2026-09-17 14:00:00', end: '2026-09-19 12:00:00' }, 8, 680),
  seedRow('meal', { mealType: 'dinner', supplies: '桌餐', remark: '含素食席位' }, { start: '2026-09-18 18:00:00' }, 80, 160),
  seedRow('flight', { seatClass: 'economy', departure: '北京', arrival: '杭州' }, { start: '2026-09-17 10:30:00' }, 3, 1280),
  seedRow('car', { carType: 'bus', departure: '酒店', arrival: '会场' }, { start: '2026-09-18 08:00:00', end: '2026-09-18 18:00:00' }, 1, 1800),
  seedRow('other', { expenseType: '物料制作', description: '会议背景板及指引牌' }, {}, 1, 2600),
  seedRow('guest', { guestCount: 2, remark: '嘉宾接待及礼品' }, {}, 2, 800)
]

const tableData = ref<DemandRow[]>(createInitialRows())
const submittedPayload = ref<unknown[] | null>(null)
const formTableRef = ref<FormTableExpose>()
const readonlyMode = ref(false)

const asDemandRow = (row: Readonly<TableRow>) => row as Readonly<DemandRow>
const isComplexType = (type: DemandType): type is ComplexDemandType => Object.prototype.hasOwnProperty.call(descriptionEditors, type)

/** 连续同类型分组的首行保存跨度，其余行保存 0，避免 spanMethod 重复扫描数据。 */
const demandTypeSpans = computed(() => {
  const spans = new Array(tableData.value.length).fill(0)
  for (let start = 0; start < tableData.value.length;) {
    let end = start + 1
    while (end < tableData.value.length && tableData.value[end].type === tableData.value[start].type) {
      end += 1
    }
    spans[start] = end - start
    start = end
  }
  return spans
})

/** 仅合并需求类型列；被覆盖行返回 0/0，由分组首行单元格承载展示。 */
const spanMethod = ({ column, rowIndex }: SpanMethodContext): CellSpan | undefined => {
  if (column.property !== 'demandType') return
  const rowspan = demandTypeSpans.value[rowIndex]
  return rowspan > 0 ? { rowspan, colspan: 1 } : { rowspan: 0, colspan: 0 }
}

const tableProps = computed(() => ({
  border: true,
  spanMethod
}))

const detailRequiredFields: Record<DemandType, string[]> = {
  venue: ['venueType', 'attendeeCount'],
  hotel: ['hotelName', 'roomName', 'roomCount', 'roomType', 'guestCount'],
  meal: ['mealType'],
  flight: ['seatClass', 'departure', 'arrival'],
  train: ['seatClass', 'departure', 'arrival'],
  car: ['carType', 'departure', 'arrival'],
  other: ['expenseType', 'description'],
  guest: ['guestCount']
}

const validateDetail = (type: DemandType, value: DemandDetail, callback: ValidationCallback) => {
  const complete = detailRequiredFields[type].every(key => {
    const fieldValue = value?.[key]
    return fieldValue !== '' && fieldValue !== null && fieldValue !== undefined
  })
  callback(complete ? undefined : new Error(`请完善${demandTypeLabels[type]}需求说明`))
}

const validateSchedule = (type: DemandType, value: DemandSchedule, callback: ValidationCallback) => {
  if (!requiresDemandSchedule(type)) return callback()
  const complete = Boolean(value?.start) && (!requiresDemandEndTime(type) || Boolean(value?.end))
  callback(complete ? undefined : new Error(`请完善${demandTypeLabels[type]}使用时间`))
}

const columns: ColumnConfig[] = [
  {
    key: 'type-column',
    label: '需求类型',
    props: { prop: 'demandType', width: 132, fixed: 'left', align: 'center' },
    cellSlot: 'demand-type'
  },
  {
    key: 'description-column',
    label: '需求说明 *',
    props: { minWidth: 560 },
    formItems: [{
        key: 'complex-description',
        fieldKey: 'detail',
        type: 'component',
        visible: ({ row }) => isComplexType(asDemandRow(row).type),
        formItemProps: ({ row }) => ({
          rules: [{ validator: (_rule: unknown, value: DemandDetail, callback: ValidationCallback) => validateDetail(asDemandRow(row).type, value, callback), trigger: 'change' }]
        }),
        component: {
          is: UnsupportedDemandEditor,
          resolveComponent: ({ row }) => {
            const type = asDemandRow(row).type
            return isComplexType(type) ? descriptionEditors[type] : undefined
          },
          props: ({ row }) => {
            const type = asDemandRow(row).type
            return { demandType: type, readonly: readonlyMode.value }
          },
          model: { prop: 'value', event: 'change' }
        }
      },
      {
        key: 'other-expense-type',
        fieldKey: 'detail.expenseType',
        type: 'select',
        visible: ({ row }) => asDemandRow(row).type === 'other',
        colProps: { span: 7 },
        formItemProps: { rules: [{ required: true, message: '请选择费用类型', trigger: 'change' }] },
        component: {
          props: () => ({ placeholder: '费用类型', disabled: readonlyMode.value }),
          options: [{ label: '物料制作', value: 'material' }, { label: '服务费', value: 'service' }, { label: '其他', value: 'other' }]
        }
      },
      {
        key: 'other-description',
        fieldKey: 'detail.description',
        type: 'input',
        visible: ({ row }) => asDemandRow(row).type === 'other',
        colProps: { span: 17 },
        formItemProps: { rules: [{ required: true, message: '请输入费用描述', trigger: 'blur' }] },
        component: { props: () => ({ placeholder: '描述（必填）', disabled: readonlyMode.value }) }
      },
      {
        key: 'guest-count',
        fieldKey: 'detail.guestCount',
        type: 'number',
        visible: ({ row }) => asDemandRow(row).type === 'guest',
        colProps: { span: 7 },
        formItemProps: { rules: [{ required: true, message: '请输入嘉宾数量', trigger: 'change' }] },
        component: { props: () => ({ min: 1, controlsPosition: 'right', disabled: readonlyMode.value }) }
      },
      {
        key: 'guest-remark',
        fieldKey: 'detail.remark',
        type: 'input',
        visible: ({ row }) => asDemandRow(row).type === 'guest',
        colProps: { span: 17 },
        component: { props: () => ({ placeholder: '备注（非必填）', disabled: readonlyMode.value }) }
      }]
  },
  {
    key: 'schedule-column',
    label: '使用时间 *',
    props: { minWidth: 430 },
    formItems: [{
      key: 'schedule-field',
      fieldKey: 'schedule',
      type: 'component',
      formItemProps: ({ row }) => ({
        rules: [{ validator: (_rule: unknown, value: DemandSchedule, callback: ValidationCallback) => validateSchedule(asDemandRow(row).type, value, callback), trigger: 'change' }]
      }),
      component: {
        is: DemandScheduleEditor,
        props: ({ row }) => ({ demandType: asDemandRow(row).type, readonly: readonlyMode.value }),
        model: { prop: 'value', event: 'change' }
      }
    }]
  },
  {
    key: 'pricing-column',
    label: '数量/单价 *',
    props: { minWidth: 330 },
    formItems: [{
      key: 'pricing-field',
      fieldKey: 'pricing',
      type: 'component',
      component: {
        is: DemandPricingEditor,
        props: ({ row }) => ({ demandType: asDemandRow(row).type, readonly: readonlyMode.value }),
        model: { prop: 'value', event: 'change' }
      }
    }]
  },
  {
    key: 'budget-column',
    label: '总费用预算',
    props: { width: 150, align: 'right' },
    cellSlot: 'total-budget'
  },
  {
    key: 'actions-column',
    label: '操作',
    props: { width: 112, fixed: 'right', align: 'center' },
    cellSlot: 'row-actions'
  }
]

const getDemandTypeLabel = (type: DemandType) => demandTypeLabels[type]
const formatMoney = (value: number) => value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const replaceTableData = (rows: TableRow[]) => {
  tableData.value = rows as DemandRow[]
  submittedPayload.value = null
}

const clearValidation = () => nextTick(() => formTableRef.value?.clearValidate())

const addSameType = (row: DemandRow) => {
  if (readonlyMode.value) return
  const lastGroupIndex = tableData.value.reduce((lastIndex, item, index) => (
    item.type === row.type ? index : lastIndex
  ), -1)
  const insertIndex = lastGroupIndex + 1
  const nextRow = createDemandRow(row.type)
  tableData.value = [
    ...tableData.value.slice(0, insertIndex),
    nextRow,
    ...tableData.value.slice(insertIndex)
  ]
  submittedPayload.value = null
  clearValidation()
}

const removeRow = (row: DemandRow) => {
  if (readonlyMode.value) return
  tableData.value = tableData.value.filter(item => item._rowKey !== row._rowKey)
  submittedPayload.value = null
  clearValidation()
}

const resetRows = () => {
  tableData.value = createInitialRows()
  submittedPayload.value = null
  clearValidation()
}

const submitDemands = async () => {
  const valid = await formTableRef.value?.validate()
  if (!valid) {
    Message.warning('请先完善标记为必填的需求信息')
    return
  }

  submittedPayload.value = tableData.value.map(row => ({
    demandType: row.type,
    demandTypeName: demandTypeLabels[row.type],
    detail: row.detail,
    schedule: requiresDemandSchedule(row.type) ? row.schedule : undefined,
    pricing: row.pricing,
    totalBudget: calculateDemandTotal(row)
  }))
  Message.success('已生成不包含页面行标识的提交数据')
}
</script>

<style scoped>
.demo-page { min-height: 100vh; padding: 28px; background: #f5f7fa; color: #303133; }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin: 18px 0; }
.page-heading h1 { margin: 4px 0 8px; font-size: 28px; }
.page-heading p { margin: 0; color: #606266; }
.eyebrow { color: #2563eb !important; font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.heading-actions { display: flex; flex-shrink: 0; gap: 10px; }
.architecture-note { margin-bottom: 14px; padding: 12px 16px; color: #1f4f46; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; }
.table-card, .result-card { background: #fff; border: 1px solid #e4e7ed; border-radius: 8px; box-shadow: 0 8px 24px rgba(15, 23, 42, .05); }
.table-card { overflow: hidden; }
.row-actions { display: flex; align-items: center; gap: 6px; }
.budget { color: #1f2937; font-variant-numeric: tabular-nums; }
.demand-type-label { color: #374151; font-weight: 600; }
.empty-result { color: #909399; }
.result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
.result-card { min-width: 0; padding: 18px; }
.result-card h2 { margin: 0 0 12px; font-size: 17px; }
pre { max-height: 460px; margin: 0; padding: 14px; overflow: auto; color: #d1fae5; background: #111827; border-radius: 6px; font-size: 12px; line-height: 1.55; }
:deep(.el-table .cell) { overflow: visible; }
:deep(.el-form-item) { margin-bottom: 0; }
@media (max-width: 900px) {
  .demo-page { padding: 18px; }
  .page-heading { align-items: flex-start; flex-direction: column; }
  .result-grid { grid-template-columns: 1fr; }
}
</style>
