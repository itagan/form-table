<template>
  <main class="demo-page">
    <router-link to="/">← 返回</router-link>
    <h1>按行编辑与保存</h1>
    <p>
      表格保留当前工作数据，操作列只校验并提交目标行；接口成功后切回文本，失败时保留输入供重试。
    </p>

    <section class="demo-card">
      <div class="toolbar">
        <el-switch
          v-model="failNextSave"
          active-text="下一次保存模拟失败"
          data-testid="row-save-failure-switch"
        />
        <el-tag type="info">可同时编辑多行</el-tag>
      </div>

      <FormTable
        ref="formTableRef"
        v-model="tableData"
        data-testid="row-edit-save-table"
        row-key="id"
        :columns="columns"
        :form-props="{ size: 'small' }"
        :table-props="{ border: true }"
      >
        <template #name-editor="{ row, value, setValue }">
          <el-input
            v-if="isEditing(row)"
            :value="value"
            placeholder="请输入姓名"
            clearable
            @input="setValue"
          />
          <span v-else class="cell-text">{{ value || '-' }}</span>
        </template>

        <template #department-editor="{ row, value, setValue }">
          <el-select
            v-if="isEditing(row)"
            :value="value"
            placeholder="请选择部门"
            @input="setValue"
          >
            <el-option
              v-for="department in departments"
              :key="department"
              :label="department"
              :value="department"
            />
          </el-select>
          <span v-else class="cell-text">{{ value || '-' }}</span>
        </template>

        <template #phone-editor="{ row, value, setValue }">
          <el-input
            v-if="isEditing(row)"
            :value="value"
            placeholder="请输入 11 位手机号"
            clearable
            @input="setValue"
          />
          <span v-else class="cell-text">{{ value || '-' }}</span>
        </template>

        <template #save-status="{ row }">
          <div class="save-status">
            <el-tag v-if="savingKeys.includes(row.id)" size="small">保存中</el-tag>
            <el-tag v-else-if="isEditing(row)" size="small" type="warning">未保存</el-tag>
            <el-tag v-else size="small" type="success">已保存</el-tag>
            <span>v{{ row.version }}</span>
          </div>
        </template>

        <template #row-actions="{ row, updateRow }">
          <div class="row-actions">
            <template v-if="isEditing(row)">
              <el-button
                type="primary"
                size="mini"
                :loading="savingKeys.includes(row.id)"
                :disabled="savingKeys.includes(row.id)"
                @click="saveRow(row, updateRow)"
              >保存</el-button>
              <el-button
                size="mini"
                :disabled="savingKeys.includes(row.id)"
                @click="cancelEdit(row, updateRow)"
              >取消</el-button>
            </template>
            <el-button v-else type="text" @click="startEdit(row)">编辑</el-button>
          </div>
        </template>
      </FormTable>
    </section>

    <section class="demo-card two-column">
      <DemoCollapsiblePanel title="当前工作数据">
        <pre data-testid="row-edit-save-data">{{ JSON.stringify(tableData, null, 2) }}</pre>
      </DemoCollapsiblePanel>
      <DemoCollapsiblePanel title="最近一次接口请求">
        <pre data-testid="row-edit-save-request">{{ lastRequest ? JSON.stringify(lastRequest, null, 2) : '尚未保存任何行' }}</pre>
      </DemoCollapsiblePanel>
    </section>

    <section class="demo-card">
      <h2>示例要点</h2>
      <ul>
        <li><code>tableData</code> 保存页面工作值，输入回写与后端请求相互独立。</li>
        <li>编辑状态、原始快照和保存状态都由页面按稳定 <code>id</code> 管理，不写入业务行。</li>
        <li>保存只调用当前行三个字段的 <code>validateField(row, fieldKey)</code>。</li>
        <li>请求体通过字段白名单生成，只提交当前行发生变化的字段。</li>
        <li>取消通过 <code>cellSlot</code> 的 <code>updateRow</code> 恢复快照；保存失败则保留当前输入。</li>
      </ul>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import { Message } from 'element-ui'
import { createFormTable } from '@itagan/form-table'
import type {
  ColumnConfig,
  FormTableExpose,
  FormTableRowPatch,
  TableRow
} from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'

type EditableField = 'name' | 'department' | 'phone'

type EmployeeRow = TableRow & {
  id: string
  name: string
  department: string
  phone: string
  version: number
}

type EmployeeSnapshot = Pick<EmployeeRow, EditableField>

interface SaveRequest {
  id: string
  changes: Partial<EmployeeSnapshot>
}

const FormTable = createFormTable<EmployeeRow>()
const editableFields: EditableField[] = ['name', 'department', 'phone']
const departments = ['产品中心', '客户成功', '技术平台']
const wait = (duration = 500) => new Promise(resolve => setTimeout(resolve, duration))

const tableData = ref<EmployeeRow[]>([
  { id: 'employee-1', name: '张三', department: '产品中心', phone: '13800138000', version: 3 },
  { id: 'employee-2', name: '李四', department: '客户成功', phone: '13900139000', version: 5 },
  { id: 'employee-3', name: '王五', department: '技术平台', phone: '13700137000', version: 2 }
])
const editingKeys = ref<string[]>([])
const savingKeys = ref<string[]>([])
const snapshots = ref<Record<string, EmployeeSnapshot>>({})
const failNextSave = ref(false)
const lastRequest = ref<SaveRequest | null>(null)
const formTableRef = ref<FormTableExpose<EmployeeRow>>()

const createFieldColumn = (
  key: string,
  label: string,
  fieldKey: EditableField,
  slot: string,
  rules: Record<string, unknown>[]
): ColumnConfig<EmployeeRow> => ({
  key,
  label,
  props: { minWidth: fieldKey === 'department' ? 170 : 190 },
  formItems: [{
    key: `${fieldKey}-field`,
    fieldKey,
    type: 'slot',
    formItemProps: { rules },
    component: { slot }
  }]
})

const columns: ColumnConfig<EmployeeRow>[] = [
  createFieldColumn('name-column', '姓名', 'name', 'name-editor', [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ]),
  createFieldColumn('department-column', '部门', 'department', 'department-editor', [
    { required: true, message: '请选择部门', trigger: 'change' }
  ]),
  createFieldColumn('phone-column', '手机号', 'phone', 'phone-editor', [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的 11 位手机号', trigger: 'blur' }
  ]),
  {
    key: 'save-status-column',
    label: '状态',
    props: { width: 130, align: 'center' },
    cellSlot: 'save-status'
  },
  {
    key: 'row-actions-column',
    label: '操作',
    props: { width: 150, fixed: 'right', align: 'center' },
    cellSlot: 'row-actions'
  }
]

const isEditing = (row: TableRow) => editingKeys.value.includes(String(row.id))

const toSnapshot = (row: EmployeeRow): EmployeeSnapshot => ({
  name: row.name,
  department: row.department,
  phone: row.phone
})

const startEdit = async (row: EmployeeRow) => {
  if (isEditing(row)) return
  snapshots.value = { ...snapshots.value, [row.id]: toSnapshot(row) }
  editingKeys.value = [...editingKeys.value, row.id]
  await nextTick()
  formTableRef.value?.clearFieldValidate(row, 'name')
  formTableRef.value?.clearFieldValidate(row, 'department')
  formTableRef.value?.clearFieldValidate(row, 'phone')
}

const finishEdit = (rowKey: string) => {
  editingKeys.value = editingKeys.value.filter(key => key !== rowKey)
  const nextSnapshots = { ...snapshots.value }
  delete nextSnapshots[rowKey]
  snapshots.value = nextSnapshots
}

const validateRow = async (row: EmployeeRow) => {
  const results = await Promise.all(
    editableFields.map(field => formTableRef.value?.validateField(row, field))
  )
  const invalidIndex = results.findIndex(valid => !valid)
  if (invalidIndex >= 0) {
    await formTableRef.value?.focusField(row, editableFields[invalidIndex])
    return false
  }
  return true
}

const buildChanges = (
  before: EmployeeSnapshot,
  current: EmployeeRow
): Partial<EmployeeSnapshot> => editableFields.reduce<Partial<EmployeeSnapshot>>((changes, field) => {
  if (!Object.is(before[field], current[field])) {
    changes[field] = current[field]
  }
  return changes
}, {})

const saveRow = async (
  row: EmployeeRow,
  updateRow: (patch: FormTableRowPatch<EmployeeRow>) => void
) => {
  if (savingKeys.value.includes(row.id)) return
  if (!await validateRow(row)) {
    Message.warning('请先修正当前行的字段')
    return
  }

  const snapshot = snapshots.value[row.id]
  if (!snapshot) return
  const request: SaveRequest = { id: row.id, changes: buildChanges(snapshot, row) }

  if (Object.keys(request.changes).length === 0) {
    finishEdit(row.id)
    Message.info('当前行没有需要保存的修改')
    return
  }

  lastRequest.value = request
  savingKeys.value = [...savingKeys.value, row.id]
  try {
    await wait()
    if (failNextSave.value) {
      failNextSave.value = false
      throw new Error('模拟接口失败')
    }

    updateRow({ version: row.version + 1 })
    finishEdit(row.id)
    Message.success(`已保存“${row.name}”，仅提交当前行的变化字段`)
  } catch {
    Message.error('保存失败，当前输入已保留，请重试')
  } finally {
    savingKeys.value = savingKeys.value.filter(key => key !== row.id)
  }
}

const cancelEdit = async (
  row: EmployeeRow,
  updateRow: (patch: FormTableRowPatch<EmployeeRow>) => void
) => {
  const snapshot = snapshots.value[row.id]
  if (snapshot) updateRow(snapshot)
  finishEdit(row.id)
  await nextTick()
  editableFields.forEach(field => formTableRef.value?.clearFieldValidate(row, field))
  Message.info('已恢复这一行进入编辑前的数据')
}
</script>

<style scoped>
.demo-page { max-width: 1200px; margin: 0 auto; padding: 32px; }
.demo-card { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
.toolbar, .row-actions, .save-status { display: flex; align-items: center; gap: 10px; }
.toolbar { justify-content: space-between; margin-bottom: 20px; }
.row-actions { justify-content: center; white-space: nowrap; }
.save-status { justify-content: center; color: #909399; font-size: 12px; }
.cell-text { display: block; min-height: 32px; line-height: 32px; }
.two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
pre { min-height: 120px; margin: 0; padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }
li { margin: 10px 0; line-height: 1.6; }

@media (max-width: 800px) {
  .demo-page { padding: 20px; }
  .two-column { grid-template-columns: 1fr; }
}
</style>
