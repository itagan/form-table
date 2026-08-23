<template>
  <main class="workflow-page">
    <router-link to="/">← 返回调试台</router-link>
    <header class="page-header">
      <div>
        <h1>完整编辑提交流程</h1>
        <p>从接口快照开始，演示受控编辑、行操作、校验保存和撤销恢复。</p>
      </div>
      <div class="status-list">
        <el-tag :type="dirty ? 'warning' : 'success'">
          {{ dirty ? '有未保存修改' : '已与服务端同步' }}
        </el-tag>
        <el-tag v-if="saving" type="info">保存中</el-tag>
      </div>
    </header>

    <section class="workflow-card">
      <div class="toolbar">
        <el-button type="primary" size="small" :disabled="loading || saving" @click="addRow">
          新增明细
        </el-button>
        <el-button size="small" :loading="loading" :disabled="saving" @click="loadData">
          重新加载
        </el-button>
        <el-button size="small" :disabled="!dirty || saving" @click="resetChanges">
          撤销修改
        </el-button>
        <el-button
          type="success"
          size="small"
          :loading="saving"
          :disabled="loading || !dirty"
          @click="saveData"
        >
          校验并保存
        </el-button>
      </div>

      <FormTable
        ref="formTableRef"
        v-model="tableData"
        v-loading="loading"
        :columns="columns"
        :form-props="{ size: 'small', labelPosition: 'top' }"
        :table-props="{ border: true, emptyText: '暂无明细，请新增一行' }"
        row-key="id"
      >
        <template #line-total="{ row }">
          <strong>¥ {{ formatAmount(asOrderRow(row).quantity * asOrderRow(row).unitPrice) }}</strong>
        </template>

        <template #row-actions="{ row, index }">
          <el-button type="text" @click="copyRow(asOrderRow(row), index)">复制</el-button>
          <el-button type="text" class="danger-button" @click="removeRow(index)">删除</el-button>
        </template>
      </FormTable>

      <p class="workflow-note">
        保存成功后才更新服务端快照；撤销只恢复最近一次加载或保存成功的数据。
      </p>
    </section>

    <DemoCollapsiblePanel class="workflow-card" title="最近一次提交载荷">
      <pre>{{ lastSubmittedPayload || '尚未提交' }}</pre>
    </DemoCollapsiblePanel>
  </main>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { Message } from 'element-ui'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose, TableRow } from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'

interface OrderRow extends TableRow {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  remark: string
}

const wait = (duration: number) => new Promise(resolve => window.setTimeout(resolve, duration))
const cloneRows = (rows: readonly OrderRow[]) => rows.map(row => ({ ...row }))
const asOrderRow = (row: Readonly<TableRow>) => row as Readonly<OrderRow>
const formatAmount = (value: number) => Number(value || 0).toFixed(2)

let nextRowId = 3
const createEmptyRow = (): OrderRow => ({
  id: `draft-${nextRowId++}`,
  productName: '',
  quantity: 1,
  unitPrice: 0,
  remark: ''
})

const serverRows: OrderRow[] = [
  { id: 'line-1', productName: '会议手册', quantity: 100, unitPrice: 8.5, remark: '双面彩印' },
  { id: 'line-2', productName: '参会证件', quantity: 120, unitPrice: 3.2, remark: '' }
]

const formTableRef = ref<FormTableExpose | null>(null)
const tableData = ref<OrderRow[]>([])
const savedSnapshot = ref<OrderRow[]>([])
const loading = ref(false)
const saving = ref(false)
const lastSubmittedPayload = ref('')

const dirty = computed(() => JSON.stringify(tableData.value) !== JSON.stringify(savedSnapshot.value))

const required = (message: string, trigger = 'blur') => [{ required: true, message, trigger }]
const columns: ColumnConfig[] = [
  {
    key: 'product',
    label: '商品',
    props: { minWidth: 240 },
    formItems: [{
      fieldKey: 'productName',
      type: 'input',
      formItemProps: { rules: required('请输入商品名称') },
      component: { props: { placeholder: '请输入商品名称', clearable: true } }
    }]
  },
  {
    key: 'amount',
    label: '数量与单价',
    props: { minWidth: 280 },
    rowProps: { gutter: 8 },
    formItems: [
      {
        fieldKey: 'quantity',
        type: 'number',
        colProps: { span: 12 },
        formItemProps: { label: '数量', rules: required('请输入数量', 'change') },
        component: { props: { min: 1, step: 1 } }
      },
      {
        fieldKey: 'unitPrice',
        type: 'number',
        colProps: { span: 12 },
        formItemProps: { label: '含税单价', rules: required('请输入单价', 'change') },
        component: { props: { min: 0, precision: 2, step: 0.1 } }
      }
    ]
  },
  {
    key: 'total',
    label: '小计',
    props: { width: 130, align: 'right' },
    cellSlot: 'line-total'
  },
  {
    key: 'remark',
    label: '备注',
    props: { minWidth: 200 },
    formItems: [{
      fieldKey: 'remark',
      type: 'input',
      component: { props: { placeholder: '选填', maxlength: 60, showWordLimit: true } }
    }]
  },
  {
    key: 'actions',
    label: '操作',
    props: { width: 120, fixed: 'right' },
    cellSlot: 'row-actions'
  }
]

const clearValidation = () => nextTick(() => formTableRef.value?.clearValidate())

const loadData = async () => {
  loading.value = true
  try {
    await wait(350)
    savedSnapshot.value = cloneRows(serverRows)
    tableData.value = cloneRows(serverRows)
    lastSubmittedPayload.value = ''
    await clearValidation()
  } finally {
    loading.value = false
  }
}

const addRow = () => {
  tableData.value = [...tableData.value, createEmptyRow()]
}

const copyRow = (row: Readonly<OrderRow>, index: number) => {
  const copied = { ...row, id: `draft-${nextRowId++}` }
  tableData.value = [
    ...tableData.value.slice(0, index + 1),
    copied,
    ...tableData.value.slice(index + 1)
  ]
}

const removeRow = (index: number) => {
  tableData.value = tableData.value.filter((_, rowIndex) => rowIndex !== index)
  void clearValidation()
}

const resetChanges = async () => {
  tableData.value = cloneRows(savedSnapshot.value)
  await clearValidation()
  Message.success('已恢复最近一次服务端快照')
}

const saveData = async () => {
  const valid = await formTableRef.value?.validate()
  if (!valid) {
    Message.error('请先完善必填字段')
    return
  }

  saving.value = true
  try {
    const payload = tableData.value.map(row => ({
      id: row.id.startsWith('draft-') ? undefined : row.id,
      productName: row.productName.trim(),
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
      remark: row.remark.trim()
    }))
    await wait(500)
    lastSubmittedPayload.value = JSON.stringify(payload, null, 2)
    savedSnapshot.value = cloneRows(tableData.value)
    Message.success('保存成功，已更新服务端快照')
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.workflow-page { max-width: 1180px; margin: 0 auto; padding: 32px; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-top: 18px; }
.page-header h1 { margin: 0; }
.page-header p { margin: 6px 0 0; color: #64748b; }
.status-list, .toolbar { display: flex; flex-wrap: wrap; gap: 10px; }
.workflow-card { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
.toolbar { margin-bottom: 18px; }
.workflow-note { margin: 16px 0 0; color: #64748b; }
.danger-button { color: #f56c6c; }
pre { margin: 0; padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }

@media (max-width: 760px) {
  .workflow-page { padding: 20px; }
  .page-header { align-items: flex-start; flex-direction: column; }
}
</style>
