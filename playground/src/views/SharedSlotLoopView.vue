<template>
  <main class="demo-page">
    <router-link to="/">← 返回示例中心</router-link>

    <header class="page-heading">
      <div>
        <p class="eyebrow">SHARED SLOT + KEYED LOOP</p>
        <h1>共享插槽与循环 FormTable</h1>
        <p>
          多个表格共享同一份列配置；重建全部板块对象后，稳定 key 会复用 FormTable 实例，
          操作插槽仍应读取当前板块。
        </p>
      </div>
      <el-tag :type="lastOperation?.isLive === false ? 'danger' : 'success'">
        {{ lastOperation?.isLive === false ? '检测到旧闭包' : '插槽闭包正常' }}
      </el-tag>
    </header>

    <section class="control-card">
      <div>
        <strong>对象重建验证</strong>
        <p>保留 section.type 作为 v-for key，但替换数组、板块和行对象。</p>
      </div>
      <el-button type="primary" @click="rebuildSections">
        重建全部板块（{{ rebuildCount }}）
      </el-button>
    </section>

    <section
      v-for="section in sections"
      :key="section.type"
      class="section-card"
      :data-section="section.type"
    >
      <div class="section-heading">
        <div>
          <h2>{{ section.label }}</h2>
          <span>第 {{ section.generation }} 代对象 · {{ section.tableData.length }} 行</span>
        </div>
        <el-tag size="small" type="info">key: {{ section.type }}</el-tag>
      </div>

      <FormTable
        v-model="section.tableData"
        :columns="sharedColumns"
        row-key="id"
        :form-props="{ size: 'small' }"
        :table-props="{ border: true }"
      >
        <template #row-actions="{ index }">
          <div class="row-actions">
            <el-button type="text" @click="appendRow(section)">新增</el-button>
            <el-button
              type="text"
              class="danger"
              :disabled="section.tableData.length <= 1"
              @click="removeRow(section, index)"
            >
              删除
            </el-button>
          </div>
        </template>
      </FormTable>
    </section>

    <section class="result-card">
      <h2>最近一次操作</h2>
      <p v-if="lastOperation">
        {{ lastOperation.sectionLabel }}执行“{{ lastOperation.action }}”：
        插槽捕获对象{{ lastOperation.isLive ? '是' : '不是' }}当前循环对象，
        行数 {{ lastOperation.before }} → {{ lastOperation.after }}。
      </p>
      <p v-else>先重建板块，再点击任意非最后板块的新增或删除按钮。</p>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'

type SectionType = 'venue' | 'hotel' | 'meal'

interface DemandRow extends TableRow {
  id: string
  name: string
  quantity: number
}

interface DemandSection {
  type: SectionType
  label: string
  generation: number
  tableData: DemandRow[]
}

interface OperationResult {
  sectionLabel: string
  action: string
  isLive: boolean
  before: number
  after: number
}

/** 所有 FormTable 实例有意共享同一个数组和操作列对象。 */
const sharedColumns: ColumnConfig[] = [
  {
    key: 'name',
    label: '需求名称',
    props: { minWidth: 260 },
    formItems: [{
      key: 'name-field',
      fieldKey: 'name',
      type: 'input',
      component: { props: { placeholder: '请输入需求名称', clearable: true } }
    }]
  },
  {
    key: 'quantity',
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
    key: 'actions',
    label: '操作',
    cellSlot: 'row-actions',
    props: { width: 150, fixed: 'right', align: 'center' }
  }
]

const sectionDefinitions: Array<{ type: SectionType; label: string }> = [
  { type: 'venue', label: '会场需求' },
  { type: 'hotel', label: '酒店需求' },
  { type: 'meal', label: '用餐需求' }
]

let rowSequence = 0
let generation = 1
const createRow = (type: SectionType): DemandRow => ({
  id: `${type}-${++rowSequence}`,
  name: '',
  quantity: 1
})
const createSections = (): DemandSection[] => sectionDefinitions.map(definition => ({
  ...definition,
  generation,
  tableData: [createRow(definition.type)]
}))

const sections = ref<DemandSection[]>(createSections())
const rebuildCount = ref(0)
const lastOperation = ref<OperationResult | null>(null)

/** 模拟接口或深 watch 整体重建，但保留稳定的业务 key。 */
const rebuildSections = () => {
  generation += 1
  rebuildCount.value += 1
  sections.value = createSections()
  lastOperation.value = null
}

const recordOperation = (
  section: DemandSection,
  action: string,
  before: number
) => {
  const liveSection = sections.value.find(item => item.type === section.type)
  lastOperation.value = {
    sectionLabel: section.label,
    action,
    isLive: liveSection === section,
    before,
    after: section.tableData.length
  }
}

const appendRow = (section: DemandSection) => {
  const before = section.tableData.length
  section.tableData = [...section.tableData, createRow(section.type)]
  recordOperation(section, '新增', before)
}

const removeRow = (section: DemandSection, index: number) => {
  if (section.tableData.length <= 1) return
  const before = section.tableData.length
  section.tableData = section.tableData.filter((_, rowIndex) => rowIndex !== index)
  recordOperation(section, '删除', before)
}
</script>

<style scoped>
.demo-page { max-width: 1120px; margin: 0 auto; padding: 32px; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-top: 20px; }
.page-heading h1, .section-heading h2, .result-card h2 { margin: 0; }
.page-heading p { max-width: 760px; margin: 10px 0 0; color: #64748b; line-height: 1.7; }
.eyebrow { color: #2563eb !important; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
.control-card, .section-card, .result-card { margin-top: 20px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
.control-card, .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.control-card p, .section-heading span, .result-card p { margin: 6px 0 0; color: #64748b; font-size: 13px; }
.section-heading { margin-bottom: 16px; }
.row-actions { display: flex; justify-content: center; gap: 10px; white-space: nowrap; }
.danger { color: #f56c6c; }
@media (max-width: 760px) {
  .demo-page { padding: 20px; }
  .page-heading, .control-card { align-items: flex-start; flex-direction: column; }
}
</style>
