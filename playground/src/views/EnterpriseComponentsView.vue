<template>
  <main class="enterprise-page">
    <router-link to="/">← 返回调试台</router-link>
    <h1>企业复杂组件接入</h1>
    <p class="page-description">
      模拟采购明细：全局组件使用字符串 renderer，局部业务组件直接传组件对象，
      并通过 component.model 适配非标准 prop、事件和复杂载荷。
    </p>

    <section class="demo-card">
      <div class="toolbar">
        <el-button type="primary" size="small" @click="addRow">新增明细</el-button>
        <el-checkbox v-model="editable">允许编辑</el-checkbox>
        <el-button size="small" @click="validate">校验表格</el-button>
      </div>

      <FormTable
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        :form-props="{ size: 'small', labelPosition: 'top' }"
        :table-props="{ border: true, rowKey: 'id' }"
        @update:tableData="handleTableDataUpdate"
      >
        <template #row-actions="{ row, index, component }">
          <el-button type="text" @click="copyRow(row, index)">复制</el-button>
          <el-button
            v-if="component.props.removable"
            type="text"
            class="danger-button"
            @click="removeRow(index)"
          >
            删除
          </el-button>
        </template>
      </FormTable>

      <div class="explanation-grid">
        <article>
          <h2>全局字符串组件</h2>
          <p><code>corp-org-selector</code>、<code>corp-supplier-picker</code>、<code>biz-approval-status</code></p>
        </article>
        <article>
          <h2>局部组件对象</h2>
          <p><code>BusinessSkuSelector</code>、<code>MoneyInput</code>、<code>BusinessAttachmentUploader</code></p>
        </article>
        <article>
          <h2>手动双向绑定</h2>
          <p>物料组件通过 <code>props</code> 接收当前值，再由 <code>listeners</code> 一次写回物料及其关联字段。</p>
        </article>
        <article>
          <h2>完全关闭双向绑定</h2>
          <p>审批状态设置 <code>model: false</code>，只接收展示属性，不向表格回写任何值。</p>
        </article>
      </div>

      <h2>当前业务数据</h2>
      <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
      <p class="document-path">
        完整采购场景代码与架构说明：<code>docs/examples/enterprise-components.md</code>
      </p>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose, TableRow } from '@itagan/form-table'
import BusinessSkuSelector from '../components/EnterpriseComponents/BusinessSkuSelector.vue'
import BusinessAttachmentUploader from '../components/EnterpriseComponents/BusinessAttachmentUploader.vue'
import MoneyInput from '../components/EnterpriseComponents/MoneyInput.vue'

interface PurchaseRow extends TableRow {
  id: string
  skuId: string
  skuName: string
  specification: string
  unit: string
  orgCode: string
  orgName: string
  supplierId: string
  supplierName: string
  supplierSource?: 'favorite' | 'search'
  quantity: number
  taxPrice: number
  taxRate: number
  attachmentIds: string[]
  approvalStatus: 'draft' | 'pending' | 'approved'
  locked: boolean
}

interface SkuSelection {
  id: string
  name: string
  specification: string
  unit: string
  taxRate: number
}

interface UploadFile {
  id: string
  name: string
}

interface SupplierSelection {
  id: string
  name: string
  taxRate: number
}

let nextRowId = 1
const createRow = (): PurchaseRow => ({
  id: `purchase-row-${nextRowId++}`,
  skuId: '',
  skuName: '',
  specification: '',
  unit: '',
  orgCode: '',
  orgName: '',
  supplierId: '',
  supplierName: '',
  quantity: 1,
  taxPrice: 0,
  taxRate: 13,
  attachmentIds: [],
  approvalStatus: 'draft',
  locked: false
})

const editable = ref(true)
const tableData = ref<PurchaseRow[]>([createRow()])
const formTableRef = ref<FormTableExpose>()

const asPurchaseRow = (row: Readonly<TableRow>) => row as Readonly<PurchaseRow>

const columns: ColumnConfig[] = [
  {
    key: 'material',
    label: '物料',
    props: { minWidth: 380 },
    children: [{
      key: 'material-row',
      props: { gutter: 8 },
      children: [
        {
          key: 'sku',
          fieldKey: 'skuId',
          type: 'component',
          colProps: { span: 14 },
          formItemProps: {
            label: '物料选择（props + listeners）',
            rules: [{ required: true, message: '请选择物料', trigger: 'change' }]
          },
          component: {
            renderer: BusinessSkuSelector,
            // 关闭自动 model，由 props 传值、listeners 处理事件并写回当前行。
            model: false,
            props: ({ value, row }) => ({
              selectedSkuId: value,
              disabled: !editable.value || asPurchaseRow(row).locked
            }),
            listeners: {
              'select-sku'({ updateRow }, selected) {
                const sku = selected as SkuSelection
                // 单次 patch 同步当前字段及关联字段，避免拆成多次行更新。
                updateRow({
                  skuId: sku.id,
                  skuName: sku.name,
                  specification: sku.specification,
                  unit: sku.unit,
                  taxRate: sku.taxRate
                })
              }
            }
          }
        },
        {
          key: 'specification',
          fieldKey: 'specification',
          type: 'input',
          colProps: { span: 10 },
          formItemProps: { label: '规格' },
          component: { props: { disabled: true, placeholder: '自动带出' } }
        }
      ]
    }]
  },
  {
    key: 'organization',
    label: '组织 / 供应商',
    props: { minWidth: 430 },
    children: [{
      props: { gutter: 8 },
      children: [
        {
          key: 'organization-selector',
          fieldKey: 'orgCode',
          type: 'component',
          colProps: { span: 12 },
          formItemProps: {
            label: '采购组织',
            rules: [{ required: true, message: '请选择采购组织', trigger: 'change' }]
          },
          component: {
            // main.ts 模拟公司组件库进行全局注册，此处只传字符串名称。
            renderer: 'corp-org-selector',
            model: {
              prop: 'selectedCode',
              event: 'node-select',
              valueFromEvent: (...args) => (args[0] as { code: string } | null)?.code || ''
            },
            props: ({ row }) => ({
              disabled: !editable.value || asPurchaseRow(row).locked
            }),
            listeners: {
              'node-select'({ updateRow }, selected) {
                const organization = selected as { code: string; name: string } | null
                updateRow({
                  orgName: organization?.name || '',
                  supplierId: '',
                  supplierName: ''
                })
              }
            }
          }
        },
        {
          key: 'supplier-selector',
          fieldKey: 'supplierId',
          type: 'component',
          colProps: { span: 12 },
          formItemProps: {
            label: '供应商',
            rules: [{ required: true, message: '请选择供应商', trigger: 'change' }]
          },
          component: {
            renderer: 'corp-supplier-picker',
            model: {
              prop: 'supplierId',
              event: 'supplier-change',
              valueFromEvent: (...args) => (args[0] as SupplierSelection | null)?.id || ''
            },
            props: ({ row }) => ({
              orgCode: asPurchaseRow(row).orgCode,
              disabled: !editable.value || asPurchaseRow(row).locked
            }),
            listeners: {
              'supplier-change'({ updateRow }, selected, selectedSource) {
                const supplier = selected as SupplierSelection | null
                const source = selectedSource as 'favorite' | 'search'
                updateRow({
                  supplierName: supplier?.name || '',
                  supplierSource: source,
                  ...(supplier ? { taxRate: supplier.taxRate } : {})
                })
              }
            }
          }
        }
      ]
    }]
  },
  {
    key: 'quantity-price',
    label: '数量 / 单价',
    props: { minWidth: 280 },
    children: [{
      props: { gutter: 8 },
      children: [
        {
          fieldKey: 'quantity',
          type: 'number',
          colProps: { span: 10 },
          component: {
            props: ({ row }) => ({
              disabled: !editable.value || asPurchaseRow(row).locked,
              min: 1,
              precision: 0
            })
          }
        },
        {
          fieldKey: 'taxPrice',
          type: 'component',
          colProps: { span: 14 },
          component: {
            renderer: MoneyInput,
            model: {
              prop: 'amount',
              event: 'amount-change'
            },
            props: ({ row }) => ({
              disabled: !editable.value || asPurchaseRow(row).locked,
              currency: 'CNY',
              min: 0,
              precision: 2
            })
          }
        }
      ]
    }]
  },
  {
    key: 'attachment',
    label: '附件',
    props: { minWidth: 260 },
    children: [{ children: [{
      fieldKey: 'attachmentIds',
      type: 'component',
      component: {
        renderer: BusinessAttachmentUploader,
        model: {
          prop: 'fileIds',
          event: 'files-change',
          valueFromEvent: (...args) => (args[0] as UploadFile[]).map(file => file.id)
        },
        props: ({ row }) => ({
          disabled: !editable.value || asPurchaseRow(row).locked,
          limit: 5,
          maxSizeMb: 10
        }),
        listeners: {
          'upload-error'(_context, reason) {
            console.warn((reason as Error).message)
          }
        }
      }
    }] }]
  },
  {
    key: 'status',
    label: '状态',
    props: { width: 100, align: 'center' },
    children: [{ children: [{
      fieldKey: 'approvalStatus',
      type: 'component',
      component: {
        renderer: 'biz-approval-status',
        // 纯展示组件只接收 status，不注入或监听任何 model 协议。
        model: false,
        props: ({ value }) => ({ status: value })
      }
    }] }]
  },
  {
    key: 'actions',
    label: '操作',
    props: { width: 130, fixed: 'right', align: 'center' },
    children: [{ children: [{
      fieldKey: '__actions',
      type: 'slot',
      component: {
        renderer: 'row-actions',
        props: ({ row }) => ({
          removable: editable.value && !asPurchaseRow(row).locked
        })
      }
    }] }]
  }
]

const handleTableDataUpdate = (nextTableData: TableRow[]) => {
  tableData.value = nextTableData as PurchaseRow[]
}

const addRow = () => {
  tableData.value = [...tableData.value, createRow()]
}

const copyRow = (row: TableRow, index: number) => {
  const source = row as PurchaseRow
  const next = [...tableData.value]
  next.splice(index + 1, 0, {
    ...source,
    id: `purchase-row-${nextRowId++}`,
    attachmentIds: [...source.attachmentIds],
    approvalStatus: 'draft',
    locked: false
  })
  tableData.value = next
}

const removeRow = async (index: number) => {
  tableData.value = tableData.value.filter((_, rowIndex) => rowIndex !== index)
  await nextTick()
  formTableRef.value?.clearValidate()
}

const validate = async () => {
  const valid = await formTableRef.value?.validate()
  valid
    ? console.log('企业复杂组件示例校验通过', tableData.value)
    : console.warn('请补充必填字段')
}
</script>

<style scoped>
.enterprise-page {
  max-width: 1500px;
  margin: 0 auto;
  padding: 32px;
}

.page-description {
  max-width: 900px;
  color: #4b5563;
  line-height: 1.7;
}

.demo-card {
  margin-top: 20px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.explanation-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.explanation-grid article {
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.explanation-grid h2 {
  margin: 0 0 8px;
  font-size: 15px;
}

.explanation-grid p,
.document-path {
  margin: 0;
  color: #64748b;
}

.danger-button {
  color: #f56c6c;
}

pre {
  max-height: 360px;
  padding: 16px;
  overflow: auto;
  background: #f6f8fa;
  border-radius: 8px;
}

@media (max-width: 900px) {
  .explanation-grid {
    grid-template-columns: 1fr;
  }
}
</style>
