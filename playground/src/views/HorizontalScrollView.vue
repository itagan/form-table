<template>
  <main class="demo-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">LAYOUT DEMO</p>
        <h1>宽表横向定位</h1>
        <p>通过 FormTable Ref 控制 Element Table 主表体，快速滚动到首列、末列或业务标记字段。</p>
      </div>
      <div class="page-actions">
        <el-button size="small" @click="scrollToEdge('start')">滚到首列</el-button>
        <el-button size="small" type="primary" @click="scrollToTarget('.scroll-target-address')">
          定位配送地址
        </el-button>
        <el-button size="small" @click="scrollToEdge('end')">滚到末列</el-button>
      </div>
    </header>

    <section class="table-card">
      <FormTable
        ref="formTableRef"
        v-model="tableData"
        :columns="columns"
        row-key="id"
        :table-props="{ border: true }"
      />
      <p class="scroll-status">{{ scrollStatus }}</p>
    </section>

    <DemoCollapsiblePanel class="code-card" title="外部滚动助手">
      <pre>{{ scrollExample }}</pre>
    </DemoCollapsiblePanel>

    <section class="notes-card">
      <h2>实现边界</h2>
      <ul>
        <li>通过 <code>getTableRef().$el</code> 获取当前 FormTable 对应的 Element Table，不查询整个页面。</li>
        <li>指定节点由 <code>colProps.class</code> 标记；也可以改用 <code>formItemProps.class</code> 或 <code>component.props.class</code>。</li>
        <li>不要直接调用目标节点的 <code>scrollIntoView()</code>，它可能同时改变页面纵向滚动位置。</li>
        <li>固定列存在独立镜像区域；目标查询应限定在主表体 <code>.el-table__body-wrapper</code> 内。</li>
      </ul>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import { createFormTable, defineFormTableColumns } from '@itagan/form-table'
import type { FormTableExpose, TableRow } from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'

interface WideRow extends TableRow {
  id: number
  orderNo: string
  customer: string
  phone: string
  city: string
  address: string
  product: string
  quantity: number
  unitPrice: number
  discount: number
  owner: string
  status: string
  remark: string
}

const FormTable = createFormTable<WideRow>()
const formTableRef = ref<FormTableExpose<WideRow> | null>(null)
const scrollStatus = ref('等待外部滚动操作')
const tableData = ref<WideRow[]>([
  {
    id: 1,
    orderNo: 'SO-2026-001',
    customer: '华东零售中心',
    phone: '13800000001',
    city: '上海',
    address: '浦东新区示例路 88 号',
    product: '企业协作套装',
    quantity: 12,
    unitPrice: 299,
    discount: 95,
    owner: '张三',
    status: '待确认',
    remark: '月底前完成配送'
  },
  {
    id: 2,
    orderNo: 'SO-2026-002',
    customer: '华南渠道部',
    phone: '13800000002',
    city: '深圳',
    address: '南山区科技园示例大厦',
    product: '标准采购包',
    quantity: 24,
    unitPrice: 199,
    discount: 90,
    owner: '李四',
    status: '运输中',
    remark: '到货前联系仓库'
  }
])

const columns = defineFormTableColumns<WideRow>([
  { label: '订单号', props: { width: 180 }, formItems: [{ fieldKey: 'orderNo', type: 'input' }] },
  { label: '客户', props: { width: 200 }, formItems: [{ fieldKey: 'customer', type: 'input' }] },
  { label: '联系电话', props: { width: 180 }, formItems: [{ fieldKey: 'phone', type: 'input' }] },
  { label: '城市', props: { width: 160 }, formItems: [{ fieldKey: 'city', type: 'input' }] },
  {
    label: '配送地址',
    props: { width: 280 },
    formItems: [{
      fieldKey: 'address',
      type: 'input',
      colProps: { class: 'scroll-target-address' }
    }]
  },
  { label: '商品', props: { width: 220 }, formItems: [{ fieldKey: 'product', type: 'input' }] },
  { label: '数量', props: { width: 160 }, formItems: [{ fieldKey: 'quantity', type: 'number' }] },
  { label: '单价', props: { width: 180 }, formItems: [{ fieldKey: 'unitPrice', type: 'number' }] },
  { label: '折扣', props: { width: 160 }, formItems: [{ fieldKey: 'discount', type: 'number' }] },
  { label: '负责人', props: { width: 180 }, formItems: [{ fieldKey: 'owner', type: 'input' }] },
  { label: '状态', props: { width: 180 }, formItems: [{ fieldKey: 'status', type: 'input' }] },
  { label: '备注', props: { width: 260 }, formItems: [{ fieldKey: 'remark', type: 'input' }] }
])

const getHorizontalScroller = () => {
  const tableElement = formTableRef.value?.getTableRef()?.$el as HTMLElement | undefined
  return tableElement?.querySelector<HTMLElement>('.el-table__body-wrapper') || null
}

const setScrollLeft = (scroller: HTMLElement, left: number) => {
  const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
  scroller.scrollTo({
    left: Math.min(maxLeft, Math.max(0, left)),
    behavior: 'smooth'
  })
}

const scrollToEdge = async (edge: 'start' | 'end') => {
  await nextTick()
  const scroller = getHorizontalScroller()
  if (!scroller) return

  setScrollLeft(scroller, edge === 'start' ? 0 : scroller.scrollWidth)
  scrollStatus.value = edge === 'start' ? '已滚动到首列' : '已滚动到末列'
}

const scrollToTarget = async (selector: string) => {
  await nextTick()
  const scroller = getHorizontalScroller()
  const target = scroller?.querySelector<HTMLElement>(selector)
  if (!scroller || !target) {
    scrollStatus.value = '目标字段当前未挂载'
    return
  }

  const scrollerRect = scroller.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const centeredLeft = scroller.scrollLeft
    + targetRect.left - scrollerRect.left
    - (scroller.clientWidth - targetRect.width) / 2

  setScrollLeft(scroller, centeredLeft)
  scrollStatus.value = '已将配送地址字段滚动到可视区域中央'
}

const scrollExample = `const getHorizontalScroller = () => {
  const tableElement = formTableRef.value?.getTableRef()?.$el
  return tableElement?.querySelector('.el-table__body-wrapper') || null
}

const scrollToEdge = (edge) => {
  const scroller = getHorizontalScroller()
  if (!scroller) return
  scroller.scrollTo({
    left: edge === 'start' ? 0 : scroller.scrollWidth,
    behavior: 'smooth'
  })
}

const scrollToTarget = (selector) => {
  const scroller = getHorizontalScroller()
  const target = scroller?.querySelector(selector)
  if (!scroller || !target) return

  const scrollerRect = scroller.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  scroller.scrollTo({
    left: scroller.scrollLeft
      + targetRect.left - scrollerRect.left
      - (scroller.clientWidth - targetRect.width) / 2,
    behavior: 'smooth'
  })
}

// 用稳定业务 class 标记需要定位的字段节点。
formItems: [{
  fieldKey: 'address',
  type: 'input',
  colProps: { class: 'scroll-target-address' }
}]`
</script>

<style scoped>
.demo-page { max-width: 1180px; margin: 0 auto; padding: 32px; }
.page-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.page-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.page-heading h1 { margin: 6px 0; }
.page-heading p { margin: 0; color: #606266; }
.eyebrow { color: #409eff !important; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; }
.table-card, .code-card, .notes-card { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
.scroll-status { margin: 12px 0 0; color: #606266; }
.notes-card h2 { margin-top: 0; }
.notes-card li { margin: 8px 0; }
pre { padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }
@media (max-width: 760px) {
  .demo-page { padding: 20px; }
  .page-heading { align-items: flex-start; flex-direction: column; }
}
</style>
