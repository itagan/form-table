<template>
  <main class="demo-page">
    <router-link to="/">← 返回</router-link>
    <h1>行列操作与异步提交</h1>
    <p>行和列由调用方维护；评分使用独立草稿，只有业务检查完成后才写入 tableData。</p>

    <section class="demo-card">
      <div class="toolbar">
        <el-button type="primary" @click="addAfterValidate">校验后末尾新增</el-button>
        <el-button @click="showRemark = !showRemark">
          {{ showRemark ? '移除备注列' : '增加备注列' }}
        </el-button>
        <el-button @click="scoreFirst = !scoreFirst">姓名/评分换序</el-button>
      </div>

      <FormTable
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        :form-props="{ size: 'small' }"
        row-key="_rowKey"
        :table-props="{ border: true }"
        @update:tableData="replaceTableData"
      >
        <template #score-editor="{ row, value, component }">
          <div class="score-editor">
            <el-input-number
              :value="getScoreDraft(row, value)"
              :min="0"
              :max="100"
              @input="setScoreDraft(row, $event)"
            />
            <el-button
              type="primary"
              plain
              :loading="savingKeys.includes(row._rowKey)"
              :disabled="savingKeys.includes(row._rowKey)"
              @click="component.listeners.commit(getScoreDraft(row, value))"
            >审核后提交</el-button>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="row-actions">
            <el-button type="text" @click="insertAfter(row)">后插一行</el-button>
            <el-button type="text" @click="copyRow(row)">复制</el-button>
            <el-button type="text" @click="moveRow(row, -1)">上移</el-button>
            <el-button type="text" @click="moveRow(row, 1)">下移</el-button>
            <el-button type="text" class="danger" @click="removeAfterConfirm(row)">删除</el-button>
          </div>
        </template>
      </FormTable>
    </section>

    <section class="demo-card two-column">
      <DemoCollapsiblePanel class="data-panel" title="当前数据">
        <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
      </DemoCollapsiblePanel>
      <div>
        <h2>关键边界</h2>
        <ul>
          <li>输入评分只修改页面草稿，不触发 <code>setValue</code>。</li>
          <li>点击提交后执行异步检查，成功后才调用配置 listener 中的更新助手。</li>
          <li>删除先确认，再按稳定 <code>_rowKey</code> 删除。</li>
          <li>工具栏在末尾新增；操作列可在当前行后插入或复制。</li>
          <li>列显隐和换序通过重新生成 <code>columns</code> 完成。</li>
        </ul>
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue'
import { Message, MessageBox } from 'element-ui'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose, TableRow } from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'

type OperationRow = TableRow & {
  _rowKey: string
  id?: number
  name: string
  score: number
  remark: string
}

let clientSequence = 0
const createRowKey = () => `client:${Date.now()}:${++clientSequence}`
const wait = (duration = 300) => new Promise(resolve => setTimeout(resolve, duration))

const tableData = ref<OperationRow[]>([
  { _rowKey: 'server:1', id: 1, name: '张三', score: 80, remark: '已有数据' },
  { _rowKey: 'server:2', id: 2, name: '李四', score: 90, remark: '' }
])
const showRemark = ref(true)
const scoreFirst = ref(false)
const scoreDrafts = ref<Record<string, number>>({})
const savingKeys = ref<string[]>([])
const formTableRef = ref<FormTableExpose>()

const nameColumn: ColumnConfig = {
  key: 'name-column',
  label: '姓名',
  props: { minWidth: 180 },
  formItems: [{
    key: 'name-field',
    fieldKey: 'name',
    type: 'input',
    formItemProps: { rules: [{ required: true, message: '请输入姓名' }] },
    component: { props: { placeholder: '请输入姓名', clearable: true } }
  }]
}

const scoreColumn: ColumnConfig = {
  key: 'score-column',
  label: '评分（延迟提交）',
  props: { minWidth: 300 },
  formItems: [{
    key: 'score-field',
    fieldKey: 'score',
    type: 'slot',
    component: {
      slot: 'score-editor',
      listeners: {
        async commit({ row, setValue }, draftValue) {
          const rowKey = String(row._rowKey)
          if (savingKeys.value.includes(rowKey)) return
          savingKeys.value = [...savingKeys.value, rowKey]
          try {
            await wait()
            const score = Number(draftValue)
            if (score < 60) {
              Message.warning('业务检查未通过：评分不能低于 60')
              return
            }
            setValue(score)
            clearScoreDraft(rowKey)
            Message.success('检查通过，评分已写入表格')
          } finally {
            savingKeys.value = savingKeys.value.filter(key => key !== rowKey)
          }
        }
      }
    }
  }]
}

const remarkColumn: ColumnConfig = {
  key: 'remark-column',
  label: '备注',
  props: { minWidth: 180 },
  formItems: [{
    key: 'remark-field',
    fieldKey: 'remark',
    type: 'input',
    component: { props: { placeholder: '请输入备注', clearable: true } }
  }]
}

const actionColumn: ColumnConfig = {
  key: 'action-column',
  label: '操作',
  props: { minWidth: 300, fixed: 'right' },
  cellSlot: 'actions'
}

const columns = computed<ColumnConfig[]>(() => {
  const mainColumns = scoreFirst.value
    ? [scoreColumn, nameColumn]
    : [nameColumn, scoreColumn]
  return [
    ...mainColumns,
    ...(showRemark.value ? [remarkColumn] : []),
    actionColumn
  ]
})

const replaceTableData = (rows: TableRow[]) => {
  tableData.value = rows as OperationRow[]
}

const getScoreDraft = (row: TableRow, value: unknown) => {
  const rowKey = String(row._rowKey)
  return Object.prototype.hasOwnProperty.call(scoreDrafts.value, rowKey)
    ? scoreDrafts.value[rowKey]
    : Number(value || 0)
}
const setScoreDraft = (row: TableRow, value: number) => {
  scoreDrafts.value = {
    ...scoreDrafts.value,
    [String(row._rowKey)]: value
  }
}
const clearScoreDraft = (rowKey: string) => {
  const nextDrafts = { ...scoreDrafts.value }
  delete nextDrafts[rowKey]
  scoreDrafts.value = nextDrafts
}
const clearStructureValidation = () => {
  nextTick(() => formTableRef.value?.clearValidate())
}

const addAfterValidate = async () => {
  const valid = await formTableRef.value?.validate()
  if (!valid) {
    Message.warning('请先完成已有行')
    return
  }
  await wait(200)
  tableData.value = [
    ...tableData.value,
    { _rowKey: createRowKey(), name: '', score: 60, remark: '' }
  ]
  clearStructureValidation()
}

const insertAfter = (source: OperationRow) => {
  const index = tableData.value.findIndex(row => row._rowKey === source._rowKey)
  if (index < 0) return
  tableData.value = [
    ...tableData.value.slice(0, index + 1),
    { _rowKey: createRowKey(), name: '', score: 60, remark: '' },
    ...tableData.value.slice(index + 1)
  ]
  clearStructureValidation()
}

const copyRow = (source: OperationRow) => {
  const index = tableData.value.findIndex(row => row._rowKey === source._rowKey)
  if (index < 0) return
  const copy: OperationRow = {
    ...source,
    id: undefined,
    _rowKey: createRowKey(),
    name: `${source.name}（复制）`
  }
  tableData.value = [
    ...tableData.value.slice(0, index + 1),
    copy,
    ...tableData.value.slice(index + 1)
  ]
  clearStructureValidation()
}

const moveRow = (row: OperationRow, offset: number) => {
  const from = tableData.value.findIndex(item => item._rowKey === row._rowKey)
  const to = from + offset
  if (from < 0 || to < 0 || to >= tableData.value.length) return
  const next = [...tableData.value]
  const [target] = next.splice(from, 1)
  next.splice(to, 0, target)
  tableData.value = next
  clearStructureValidation()
}

const removeAfterConfirm = async (row: OperationRow) => {
  try {
    await MessageBox.confirm(`确认删除“${row.name || '未命名行'}”？`, '删除确认', {
      type: 'warning'
    })
    await wait(200)
    tableData.value = tableData.value.filter(item => item._rowKey !== row._rowKey)
    clearScoreDraft(row._rowKey)
    clearStructureValidation()
  } catch {
    // 用户取消时保持表格不变。
  }
}
</script>

<style scoped>
.demo-page { max-width: 1200px; margin: 0 auto; padding: 32px; }
.demo-card { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
.toolbar, .score-editor, .row-actions { display: flex; align-items: center; gap: 10px; }
.toolbar { margin-bottom: 20px; }
.row-actions { white-space: nowrap; }
.danger { color: #f56c6c; }
.two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.data-panel { min-width: 0; }
pre { padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }
li { margin: 10px 0; line-height: 1.6; }
@media (max-width: 800px) { .two-column { grid-template-columns: 1fr; } }
</style>
