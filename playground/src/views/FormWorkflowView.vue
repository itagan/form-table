<template>
  <main class="workflow-page">
    <router-link to="/" @click.native.prevent="leavePage">← 返回示例中心</router-link>
    <header class="page-header">
      <div>
        <h1>完整编辑提交流程</h1>
        <p>从接口快照开始，演示受控编辑、校验保存、异常重试和过期响应保护。</p>
      </div>
      <div class="status-list">
        <el-tag :type="dirty ? 'warning' : 'success'">
          {{ dirty ? '有未保存修改' : '已与服务端同步' }}
        </el-tag>
        <el-tag v-if="saving" type="info">保存中</el-tag>
        <el-tag type="info">提交基线 {{ baseVersion }}</el-tag>
      </div>
    </header>

    <section class="workflow-card">
      <div class="toolbar">
        <el-button type="primary" size="small" :disabled="loading || saving" @click="addRow">
          新增明细
        </el-button>
        <el-button size="small" :loading="loading" :disabled="saving" @click="loadData()">
          重新加载
        </el-button>
        <el-button size="small" :disabled="saving" @click="simulateStaleLoad">
          模拟过期响应
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
        @field-change="handleFieldChange"
      >
        <template #line-total="{ row }">
          <strong>¥ {{ formatAmount(asOrderRow(row).quantity * asOrderRow(row).unitPrice) }}</strong>
        </template>

        <template #row-actions="{ row, index }">
          <el-button type="text" @click="copyRow(asOrderRow(row), index)">复制</el-button>
          <el-button type="text" class="danger-button" @click="removeRow(index)">删除</el-button>
        </template>
      </FormTable>

      <div v-if="serverErrors.length" class="server-errors">
        <strong>服务端校验未通过</strong>
        <ul>
          <li v-for="error in serverErrors" :key="`${error.rowId}:${error.fieldKey}`">
            {{ describeServerError(error) }}
          </li>
        </ul>
      </div>

      <div v-if="versionConflict" class="conflict-panel">
        <div>
          <strong>检测到服务端版本冲突</strong>
          <p>服务端版本 {{ versionConflict.serverVersion }} 已更新，本地修改尚未被覆盖。</p>
        </div>
        <div class="conflict-actions">
          <el-button size="small" @click="keepLocalChanges">保留本地并重试</el-button>
          <el-button size="small" type="warning" @click="acceptServerVersion">采用服务端版本</el-button>
        </div>
      </div>

      <p class="workflow-note">
        保存成功后才更新服务端快照；撤销只恢复最近一次加载或保存成功的数据。
      </p>
    </section>

    <DemoCollapsiblePanel class="workflow-card" title="异常流程开关">
      <div class="failure-controls">
        <el-checkbox v-model="failNextLoad">下一次加载失败</el-checkbox>
        <el-checkbox v-model="failNextSave">下一次保存失败</el-checkbox>
        <el-checkbox v-model="rejectFirstProduct">服务端拒绝第一行商品</el-checkbox>
        <el-checkbox v-model="conflictNextSave">下一次保存发生版本冲突</el-checkbox>
      </div>
      <p class="workflow-note">
        加载或保存失败不会清空当前编辑；服务端字段错误按稳定行 ID 映射，重新编辑后清除。
      </p>
    </DemoCollapsiblePanel>

    <DemoCollapsiblePanel class="workflow-card" title="最近一次提交载荷">
      <pre>{{ lastSubmittedPayload || '尚未提交' }}</pre>
    </DemoCollapsiblePanel>
  </main>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Message, MessageBox } from 'element-ui'
import FormTable from '@itagan/form-table'
import type {
  ColumnConfig,
  FormTableExpose,
  FormTableFieldChangePayload,
  TableRow
} from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'
import router from '../router'

interface OrderRow extends TableRow {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  remark: string
}

interface ServerFieldError {
  rowId: string
  fieldKey: keyof Pick<OrderRow, 'productName' | 'quantity' | 'unitPrice'>
  message: string
}

type ValidationCallback = (error?: Error) => void

class ServerValidationError extends Error {
  constructor(readonly fieldErrors: ServerFieldError[]) {
    super('服务端校验未通过')
  }
}

interface VersionConflict {
  serverVersion: string
  serverRows: OrderRow[]
}

class VersionConflictError extends Error {
  constructor(readonly conflict: VersionConflict) {
    super('服务端数据已被其他用户更新')
  }
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

const formTableRef = ref<FormTableExpose<OrderRow> | null>(null)
const tableData = ref<OrderRow[]>([])
const savedSnapshot = ref<OrderRow[]>([])
const loading = ref(false)
const saving = ref(false)
const lastSubmittedPayload = ref('')
const baseVersion = ref('v1')
const serverErrors = ref<ServerFieldError[]>([])
const failNextLoad = ref(false)
const failNextSave = ref(false)
const rejectFirstProduct = ref(false)
const conflictNextSave = ref(false)
const versionConflict = ref<VersionConflict | null>(null)
let latestLoadRequest = 0

const dirty = computed(() => JSON.stringify(tableData.value) !== JSON.stringify(savedSnapshot.value))

const required = (message: string, trigger = 'blur') => [{ required: true, message, trigger }]
const serverRule = (rowId: string, fieldKey: ServerFieldError['fieldKey']) => ({
  validator: (_rule: unknown, _value: unknown, callback: ValidationCallback) => {
    const error = serverErrors.value.find(item => item.rowId === rowId && item.fieldKey === fieldKey)
    callback(error ? new Error(error.message) : undefined)
  },
  trigger: 'change'
})
const columns: ColumnConfig[] = [
  {
    key: 'product',
    label: '商品',
    props: { minWidth: 240 },
    formItems: [{
      fieldKey: 'productName',
      type: 'input',
      formItemProps: ({ row }) => ({
        rules: [
          ...required('请输入商品名称'),
          serverRule(asOrderRow(row).id, 'productName')
        ]
      }),
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

const loadData = async (options: {
  delay?: number
  rows?: readonly OrderRow[]
  announceSuccess?: boolean
} = {}) => {
  const requestId = ++latestLoadRequest
  const shouldFail = failNextLoad.value
  failNextLoad.value = false
  loading.value = true
  try {
    await wait(options.delay ?? 350)
    if (shouldFail) throw new Error('模拟加载失败')
    if (requestId !== latestLoadRequest) {
      Message.info('已忽略过期的加载响应')
      return
    }

    const rows = options.rows || serverRows
    savedSnapshot.value = cloneRows(rows)
    tableData.value = cloneRows(rows)
    lastSubmittedPayload.value = ''
    baseVersion.value = 'v1'
    serverErrors.value = []
    versionConflict.value = null
    await clearValidation()
    if (options.announceSuccess) Message.success('加载成功')
  } catch (error) {
    if (requestId === latestLoadRequest) {
      Message.error(error instanceof Error ? error.message : '加载失败，请重试')
    }
  } finally {
    if (requestId === latestLoadRequest) loading.value = false
  }
}

const simulateStaleLoad = async () => {
  const staleRows = [{ ...serverRows[0], productName: '过期响应中的商品' }]
  void loadData({ delay: 700, rows: staleRows })
  await wait(50)
  await loadData({ delay: 150, rows: serverRows, announceSuccess: true })
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
  serverErrors.value = []
  versionConflict.value = null
  await clearValidation()
  Message.success('已恢复最近一次服务端快照')
}

const saveData = async () => {
  if (saving.value) return

  const valid = await formTableRef.value?.validate()
  if (!valid) {
    Message.error('请先完善必填字段')
    return
  }

  saving.value = true
  try {
    const payload = {
      expectedVersion: baseVersion.value,
      rows: tableData.value.map(row => ({
        id: row.id.startsWith('draft-') ? undefined : row.id,
        productName: row.productName.trim(),
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
        remark: row.remark.trim()
      }))
    }
    await wait(500)
    if (failNextSave.value) {
      failNextSave.value = false
      throw new Error('模拟保存失败，请检查网络后重试')
    }
    if (conflictNextSave.value) {
      conflictNextSave.value = false
      throw new VersionConflictError({
        serverVersion: 'v2',
        serverRows: serverRows.map(row => ({
          ...row,
          remark: row.id === 'line-1' ? '其他用户刚刚更新' : row.remark
        }))
      })
    }
    if (rejectFirstProduct.value && tableData.value[0]) {
      throw new ServerValidationError([{
        rowId: tableData.value[0].id,
        fieldKey: 'productName',
        message: '该商品已存在于其他采购明细中'
      }])
    }

    lastSubmittedPayload.value = JSON.stringify(payload, null, 2)
    savedSnapshot.value = cloneRows(tableData.value)
    baseVersion.value = `v${Number(baseVersion.value.slice(1) || 0) + 1}`
    serverErrors.value = []
    versionConflict.value = null
    Message.success('保存成功，已更新服务端快照')
  } catch (error) {
    if (error instanceof VersionConflictError) {
      versionConflict.value = error.conflict
      Message.warning('保存已停止，请选择如何处理服务端新版本')
    } else if (error instanceof ServerValidationError) {
      serverErrors.value = error.fieldErrors
      await nextTick()
      error.fieldErrors.forEach(fieldError => {
        const row = tableData.value.find(row => row.id === fieldError.rowId)
        if (row) void formTableRef.value?.validateField(row, fieldError.fieldKey)
      })
      await formTableRef.value?.scrollToFirstError()
      Message.error('请处理服务端返回的字段错误')
    } else {
      Message.error(error instanceof Error ? error.message : '保存失败，请重试')
    }
  } finally {
    saving.value = false
  }
}

const keepLocalChanges = () => {
  if (!versionConflict.value) return

  baseVersion.value = versionConflict.value.serverVersion
  versionConflict.value = null
  Message.warning('已基于服务端新版本保留本地值；再次保存可能覆盖冲突字段')
}

const acceptServerVersion = async () => {
  if (!versionConflict.value) return

  const rows = cloneRows(versionConflict.value.serverRows)
  savedSnapshot.value = cloneRows(rows)
  tableData.value = rows
  baseVersion.value = versionConflict.value.serverVersion
  serverErrors.value = []
  versionConflict.value = null
  await clearValidation()
  Message.success('已采用服务端最新版本')
}

const handleFieldChange = (event: FormTableFieldChangePayload) => {
  const row = asOrderRow(event.row)
  const nextErrors = serverErrors.value.filter(
    error => error.rowId !== row.id || error.fieldKey !== event.fieldKey
  )
  if (nextErrors.length === serverErrors.value.length) return

  serverErrors.value = nextErrors
  formTableRef.value?.getFormRef()?.clearValidate?.(
    `tableData.${event.index}.${event.fieldKey}`
  )
}

const describeServerError = (error: ServerFieldError) => {
  const index = tableData.value.findIndex(row => row.id === error.rowId)
  return `${index >= 0 ? `第 ${index + 1} 行` : error.rowId} · 商品：${error.message}`
}

const confirmDiscardChanges = async () => {
  if (!dirty.value) return true

  try {
    await MessageBox.confirm('当前存在未保存修改，确认离开并丢弃吗？', '离开确认', {
      type: 'warning',
      confirmButtonText: '丢弃并离开',
      cancelButtonText: '继续编辑'
    })
    return true
  } catch {
    return false
  }
}

const leavePage = () => router.push('/')

// 示例站的全局侧栏也会触发路由切换，因此离开保护必须覆盖所有站内入口。
const removeRouteGuard = router.beforeEach(async (to, from, next) => {
  if (from.name !== 'form-workflow' || to.path === from.path) {
    next()
    return
  }

  if (await confirmDiscardChanges()) next()
  else next(false)
})

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  void loadData()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  removeRouteGuard()
})
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
.failure-controls { display: flex; flex-wrap: wrap; gap: 18px; }
.server-errors { margin-top: 16px; padding: 14px 16px; color: #b42318; background: #fef3f2; border: 1px solid #fecdca; border-radius: 8px; }
.server-errors ul { margin: 8px 0 0; padding-left: 20px; }
.conflict-panel { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 16px; padding: 14px 16px; color: #854d0e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; }
.conflict-panel p { margin: 6px 0 0; }
.conflict-actions { display: flex; flex: none; gap: 8px; }

@media (max-width: 760px) {
  .workflow-page { padding: 20px; }
  .page-header { align-items: flex-start; flex-direction: column; }
  .conflict-panel { align-items: flex-start; flex-direction: column; }
}
</style>
