<template>
  <main class="demo-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">FEATURE DEMO</p>
        <h1>Element 功能列透传</h1>
        <p>直接在 columns 中配置 selection、index 和 expand，无需单独声明 PlainColumnConfig 数组。</p>
      </div>
      <div class="page-actions">
        <el-switch v-model="showIndex" active-text="显示序号列" />
        <el-button size="small" @click="toggleTableData">
          {{ tableData.length ? '清空数据' : '恢复数据' }}
        </el-button>
      </div>
    </header>

    <section class="table-card">
      <FormTable
        v-model="tableData"
        :columns="columns"
        row-key="id"
        :table-props="{ border: true }"
        @selection-change="selection = $event"
        @sort-change="handleSortChange"
        @filter-change="handleFilterChange"
        @header-click="handleHeaderClick"
      >
        <template #empty>
          <span class="custom-empty">暂无功能列数据</span>
        </template>
        <template #append>
          <div class="table-append">Element Table append 插槽</div>
        </template>
        <template #row-detail="{ row }">
          <div class="row-detail">
            <strong>{{ row.name }}</strong>
            <span>{{ row.department }} · {{ row.remark }}</span>
          </div>
        </template>
      </FormTable>

      <div class="selection-summary">
        <strong>当前选择：</strong>
        <span v-if="selection.length === 0">暂无</span>
        <el-tag v-for="row in selection" v-else :key="row.id" size="small">
          {{ row.name }}
        </el-tag>
      </div>
      <p class="event-summary"><strong>最近事件：</strong>{{ latestEvent }}</p>
    </section>

    <DemoCollapsiblePanel class="code-card" title="直接配置 columns">
      <pre>{{ columnsExample }}</pre>
    </DemoCollapsiblePanel>

    <section class="notes-card">
      <h2>配置边界</h2>
      <ul>
        <li><code>selection/index/expand</code> 都是 Element Column 的 <code>props.type</code>。</li>
        <li>纯透传列省略 <code>children/cellSlot</code>，TypeScript 会自动识别为 <code>PlainColumnConfig</code>。</li>
        <li>需要内容的 expand 列可组合 <code>cellSlot</code>；普通编辑列继续使用 <code>children</code>。</li>
      </ul>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { createFormTable, defineFormTableColumns } from '@itagan/form-table'
import type {
  FormTableElementColumn,
  FormTableFilterChangePayload,
  FormTableSortChangePayload,
  TableRow
} from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'

interface DemoRow extends TableRow {
  id: number
  name: string
  department: string
  locked: boolean
  remark: string
}

const FormTable = createFormTable<DemoRow>()
const initialTableData: DemoRow[] = [
  { id: 1, name: '张三', department: '产品部', locked: false, remark: '可参与本次审批' },
  { id: 2, name: '李四', department: '财务部', locked: true, remark: '锁定行不可选择' },
  { id: 3, name: '王五', department: '研发部', locked: false, remark: '负责技术评审' }
]
const tableData = ref<DemoRow[]>([...initialTableData])
const selection = ref<DemoRow[]>([])
const showIndex = ref(true)
const latestEvent = ref('等待排序操作')

const handleSortChange = ({ prop, order }: FormTableSortChangePayload) => {
  latestEvent.value = `sort-change：${prop || '未指定字段'} / ${order || '取消排序'}`
}

const handleFilterChange = (filters: FormTableFilterChangePayload) => {
  latestEvent.value = `filter-change：${JSON.stringify(filters)}`
}

const handleHeaderClick = (column: FormTableElementColumn) => {
  latestEvent.value = `header-click：${column.label || column.property || '未命名列'}`
}

const toggleTableData = () => {
  tableData.value = tableData.value.length ? [] : [...initialTableData]
  selection.value = []
}

const columns = computed(() => defineFormTableColumns<DemoRow>([
  {
    key: 'selection',
    props: {
      type: 'selection',
      width: 48,
      reserveSelection: true,
      selectable: (row: DemoRow) => !row.locked
    }
  },
  {
    key: 'index',
    label: '序号',
    visible: showIndex.value,
    props: {
      type: 'index',
      width: 72,
      align: 'center',
      index: (index: number) => index + 100
    }
  },
  {
    key: 'detail',
    label: '详情',
    props: { type: 'expand', width: 64 },
    cellSlot: 'row-detail'
  },
  {
    label: '姓名',
    props: { minWidth: 180 },
    children: [{ fieldKey: 'name', type: 'input' }]
  },
  {
    label: '部门',
    props: {
      prop: 'department',
      columnKey: 'department',
      minWidth: 160,
      sortable: 'custom',
      filters: [
        { text: '产品部', value: '产品部' },
        { text: '财务部', value: '财务部' },
        { text: '研发部', value: '研发部' }
      ],
      filterMethod: (value: string, row: DemoRow) => row.department === value
    },
    children: [{ fieldKey: 'department', type: 'text' }]
  }
]))

const columnsExample = `const FormTable = createFormTable<DemoRow>()

const columns = defineFormTableColumns<DemoRow>([
  {
    props: {
      type: 'selection',
      width: 48,
      reserveSelection: true,
      selectable: row => !row.locked
    }
  },
  {
    label: '序号',
    visible: showIndex.value,
    props: { type: 'index', width: 72, index: index => index + 100 }
  },
  {
    label: '详情',
    props: { type: 'expand', width: 64 },
    cellSlot: 'row-detail'
  },
  {
    label: '姓名',
    children: [{ fieldKey: 'name', type: 'input' }]
  }
])

<FormTable
  @selection-change="selection = $event"
  @sort-change="handleSortChange"
  @filter-change="handleFilterChange"
  @header-click="handleHeaderClick"
>
  <template #empty>暂无功能列数据</template>
  <template #append>Element Table append 插槽</template>
</FormTable>`
</script>

<style scoped>
.demo-page { max-width: 1180px; margin: 0 auto; padding: 32px; }
.page-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.page-actions { display: flex; align-items: center; gap: 16px; }
.page-heading h1 { margin: 6px 0; }
.page-heading p { margin: 0; color: #606266; }
.eyebrow { color: #409eff !important; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; }
.table-card, .code-card, .notes-card { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
.selection-summary { display: flex; align-items: center; gap: 8px; min-height: 32px; margin-top: 16px; }
.event-summary { margin: 8px 0 0; color: #606266; }
.custom-empty { color: #909399; }
.table-append { padding: 10px 16px; color: #909399; text-align: center; border-top: 1px dashed #ebeef5; }
.row-detail { display: flex; gap: 16px; padding: 16px 24px; background: #f5f7fa; }
.row-detail span { color: #606266; }
.notes-card h2 { margin-top: 0; }
.notes-card li { margin: 8px 0; }
pre { padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }
</style>
