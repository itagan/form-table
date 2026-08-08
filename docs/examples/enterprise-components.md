# 企业内部复杂组件接入示例

本示例以“采购申请明细”为业务场景，展示一个页面同时使用 Element UI 内置字段、公司全局组件、页面手动引入组件、非标准双向绑定组件、纯展示组件和操作 Slot 的完整组织方式。

## 场景与组件来源

采购明细每行包含以下字段：

| 字段 | 组件来源 | 接入方式 |
| --- | --- | --- |
| 物料 | 页面手动引入 `BusinessSkuSelector` | 组件对象 + 自定义 model |
| 采购组织 | 公司组件库全局注册 | 字符串 renderer + 自定义 model |
| 供应商 | 公司组件库全局注册 | 字符串 renderer + 复杂事件载荷 |
| 数量 | Element UI | 内置 `number` 类型 |
| 含税单价 | 页面手动引入 `MoneyInput` | 组件对象 + 自定义 model |
| 附件 | 页面手动引入 `BusinessAttachmentUploader` | 文件列表 model + 动态 props |
| 审批状态 | 公司全局展示组件 | `model: false` |
| 操作 | 页面模板 | 具名 Slot |

FormTable 核心不导入任何公司组件，也不维护公司组件注册表。全局组件按名称解析，局部组件直接传组件对象。

## 公司组件初始化

公司组件库已经通过插件全局注册时，只需要在应用入口安装一次：

```ts
// src/main.ts
import Vue from 'vue'
import CorpComponentLibrary from '@company/component-library'

Vue.use(CorpComponentLibrary)
```

假设插件注册了以下组件：

```text
corp-org-selector
corp-supplier-picker
biz-approval-status
```

这些组件在 FormTable 配置中可以直接使用字符串名称，不受组件前缀限制。

## 页面数据类型

```ts
// src/views/PurchaseRequest/types.ts
import type { TableRow } from '@itagan/form-table'

export interface PurchaseDetailRow extends TableRow {
  id: string
  skuId: string
  skuName: string
  specification: string
  unit: string
  orgCode: string
  orgName: string
  supplierId: string
  supplierName: string
  supplierSource?: 'search' | 'favorite'
  quantity: number
  taxPrice: number
  taxRate: number
  attachmentIds: string[]
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected'
  locked: boolean
}

export interface SkuSelection {
  id: string
  code: string
  name: string
  specification: string
  unit: string
  taxRate: number
  stock: number
}

export interface SupplierSelection {
  id: string
  name: string
  taxRate?: number
}

export interface UploadFile {
  id: string
  name: string
  size: number
  status: 'success'
}
```

`TableRow` 允许业务字段自由扩展；页面仍可以通过业务接口声明更具体的数据结构。

## 页面手动引入的组件

局部业务组件不需要注册到页面 `components`，直接将导入的组件对象传给 `renderer`：

```ts
import BusinessSkuSelector from '@/components/EnterpriseComponents/BusinessSkuSelector.vue'
import MoneyInput from '@/components/EnterpriseComponents/MoneyInput.vue'
import BusinessAttachmentUploader from '@/components/EnterpriseComponents/BusinessAttachmentUploader.vue'
```

如果组件只在当前业务使用，这种方式比全局注册更清晰，也有利于构建工具按页面拆包。

## 可运行的内部组件 Mock

调试台提供了一组可直接运行的企业组件 Mock。它们不依赖后端接口，但保留了实际项目中常见的搜索、组织联动、非标准双向绑定、复杂事件载荷、文件限制和只读状态展示：

- 物料搜索选择器（`playground/src/components/EnterpriseComponents/BusinessSkuSelector.vue`）：显示编码、规格和库存，缺货物料不可选。
- 采购组织选择器（`playground/src/components/EnterpriseComponents/CompanyOrgSelector.vue`）：使用级联组织树，并在事件中返回组织名称、区域和成本中心。
- 供应商选择器（`playground/src/components/EnterpriseComponents/CompanySupplierPicker.vue`）：根据采购组织过滤供应商，同时返回选择来源。
- 金额输入框（`playground/src/components/EnterpriseComponents/MoneyInput.vue`）：使用 `amount` / `amount-change` 协议，并返回格式化元数据。
- 业务附件上传（`playground/src/components/EnterpriseComponents/BusinessAttachmentUploader.vue`）：读取本地文件，校验数量和大小，并模拟上传后的文件 ID。
- 审批状态展示（`playground/src/components/EnterpriseComponents/ApprovalStatusDisplay.vue`）：纯展示组件，不参与 model 写回。

这些 Mock 用于演示接入协议。实际项目中可以保持 columns 配置不变，将 renderer 替换为公司组件库或业务模块中的真实组件。

## 完整 columns 工厂

将列定义放在独立工厂中，集中接收权限、上传参数和页面操作。不要在模板中内联创建 columns。

```ts
// src/views/PurchaseRequest/createPurchaseColumns.ts
import type {
  ColumnConfig,
  FormTableValue,
  TableRow
} from '@itagan/form-table'
import BusinessSkuSelector from '@/components/EnterpriseComponents/BusinessSkuSelector.vue'
import MoneyInput from '@/components/EnterpriseComponents/MoneyInput.vue'
import BusinessAttachmentUploader from '@/components/EnterpriseComponents/BusinessAttachmentUploader.vue'
import type {
  PurchaseDetailRow,
  SkuSelection,
  SupplierSelection,
  UploadFile
} from './types'

interface CreatePurchaseColumnsOptions {
  editable: boolean
}

const asPurchaseRow = (row: Readonly<TableRow>) => row as Readonly<PurchaseDetailRow>

export function createPurchaseColumns(
  options: CreatePurchaseColumnsOptions
): ColumnConfig[] {
  return [
    {
      key: 'material',
      label: '物料信息',
      props: { minWidth: 460 },
      children: [{
        key: 'material-main',
        props: { gutter: 8 },
        children: [
          {
            key: 'sku-selector',
            fieldKey: 'skuId',
            type: 'component',
            colProps: { span: 14 },
            formItemProps: {
              label: '物料',
              rules: [{ required: true, message: '请选择物料', trigger: 'change' }]
            },
            component: {
              // 手动引入的局部业务组件直接传组件对象。
              renderer: BusinessSkuSelector,
              model: {
                // 组件实际协议：selectedSkuId + select-sku。
                prop: 'selectedSkuId',
                event: 'select-sku',
                valueFromEvent: (...args: unknown[]): FormTableValue => {
                  return (args[0] as SkuSelection).id
                }
              },
              props: ({ row }) => ({
                disabled: !options.editable || asPurchaseRow(row).locked,
                placeholder: '输入编码或名称搜索物料',
                includeOutOfStock: false
              }),
              listeners: {
                // model 先写回 skuId，再执行同名 listener 完成字段联动。
                'select-sku'({ updateRow }, selected) {
                  const sku = selected as SkuSelection
                  updateRow({
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
            key: 'sku-specification',
            fieldKey: 'specification',
            type: 'input',
            colProps: { span: 10 },
            formItemProps: { label: '规格' },
            component: {
              props: ({ row }) => ({
                disabled: true,
                placeholder: asPurchaseRow(row).skuId ? '由物料自动带出' : '请先选择物料'
              })
            }
          }
        ]
      }]
    },
    {
      key: 'organization',
      label: '组织与供应商',
      props: { minWidth: 420 },
      children: [{
        key: 'organization-main',
        props: { gutter: 8 },
        children: [
          {
            key: 'purchase-org',
            fieldKey: 'orgCode',
            type: 'component',
            colProps: { span: 12 },
            formItemProps: {
              label: '采购组织',
              rules: [{ required: true, message: '请选择采购组织', trigger: 'change' }]
            },
            component: {
              // 公司组件库已经全局注册，直接使用注册名称。
              renderer: 'corp-org-selector',
              model: {
                prop: 'selectedCode',
                event: 'node-select',
                valueFromEvent: (...args: unknown[]) => {
                  return (args[0] as { code: string } | null)?.code || ''
                }
              },
              props: ({ row }) => ({
                disabled: !options.editable || asPurchaseRow(row).locked,
                businessType: 'purchase',
                clearable: true
              }),
              listeners: {
                'node-select'({ updateRow }, selected) {
                  const node = selected as { code: string; name: string } | null
                  updateRow({
                    orgName: node?.name || '',
                    supplierId: '',
                    supplierName: ''
                  })
                }
              }
            }
          },
          {
            key: 'supplier',
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
                // 公司组件事件为 (supplier, source)，只取 supplier.id 写回。
                valueFromEvent: (...args: unknown[]) => {
                  return (args[0] as SupplierSelection).id
                }
              },
              props: ({ row }) => ({
                disabled: !options.editable || !asPurchaseRow(row).orgCode,
                orgCode: asPurchaseRow(row).orgCode,
                placeholder: asPurchaseRow(row).orgCode
                  ? '请选择供应商'
                  : '请先选择采购组织'
              }),
              listeners: {
                'supplier-change'(
                  { updateRow },
                  selected,
                  selectedSource
                ) {
                  const supplier = selected as SupplierSelection
                  const source = selectedSource as 'search' | 'favorite'
                  updateRow({
                    supplierName: supplier.name,
                    ...(supplier.taxRate == null ? {} : { taxRate: supplier.taxRate }),
                    supplierSource: source
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
      label: '数量与价格',
      props: { minWidth: 340 },
      children: [{
        key: 'quantity-price-main',
        props: { gutter: 8 },
        children: [
          {
            key: 'quantity',
            fieldKey: 'quantity',
            type: 'number',
            colProps: { span: 10 },
            formItemProps: {
              label: '数量',
              rules: [{ required: true, type: 'number', min: 1, message: '数量必须大于 0' }]
            },
            component: {
              props: ({ row }) => ({
                disabled: !options.editable || asPurchaseRow(row).locked,
                min: 1,
                precision: 0,
                controlsPosition: 'right'
              })
            }
          },
          {
            key: 'tax-price',
            fieldKey: 'taxPrice',
            type: 'component',
            colProps: { span: 14 },
            formItemProps: {
              label: '含税单价',
              rules: [{ required: true, type: 'number', min: 0, message: '请输入有效单价' }]
            },
            component: {
              renderer: MoneyInput,
              model: {
                prop: 'amount',
                event: 'amount-change'
              },
              props: ({ row }) => ({
                disabled: !options.editable || asPurchaseRow(row).locked,
                currency: 'CNY',
                precision: 2,
                showThousandsSeparator: true
              })
            }
          }
        ]
      }]
    },
    {
      key: 'attachments',
      label: '附件',
      props: { minWidth: 280 },
      children: [{
        key: 'attachment-main',
        children: [{
          key: 'attachment-upload',
          fieldKey: 'attachmentIds',
          type: 'component',
          formItemProps: {
            rules: [{
              validator(_rule: unknown, value: unknown, callback: (error?: Error) => void) {
                const attachmentIds = Array.isArray(value) ? value : []
                callback(attachmentIds.length <= 5 ? undefined : new Error('最多上传 5 个附件'))
              },
              trigger: 'change'
            }]
          },
          component: {
            renderer: BusinessAttachmentUploader,
            model: {
              prop: 'fileIds',
              event: 'files-change',
              valueFromEvent: (...args: unknown[]) => {
                return (args[0] as UploadFile[]).map(file => file.id)
              }
            },
            props: ({ row }) => ({
              disabled: !options.editable || asPurchaseRow(row).locked,
              limit: 5,
              maxSizeMb: 10,
              accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg'
            }),
            listeners: {
              'upload-error'(_context, reason) {
                const error = reason as Error
                // 实际项目可替换为公司统一消息组件和日志上报。
                console.error('采购附件上传失败', error)
              }
            }
          }
        }]
      }]
    },
    {
      key: 'approval-status',
      label: '状态',
      props: { width: 110, align: 'center' },
      children: [{
        key: 'status-main',
        children: [{
          key: 'status-display',
          fieldKey: 'approvalStatus',
          type: 'component',
          component: {
            renderer: 'biz-approval-status',
            // 展示组件不接收 value/input，由 props 显式传入业务属性。
            model: false,
            props: ({ value }) => ({
              status: value,
              size: 'small'
            })
          }
        }]
      }]
    },
    {
      key: 'actions',
      label: '操作',
      props: { width: 150, fixed: 'right', align: 'center' },
      children: [{
        key: 'actions-main',
        children: [{
          key: 'row-actions',
          fieldKey: '__actions',
          type: 'slot',
          component: {
            renderer: 'row-actions',
            props: ({ row }) => ({
              removable: options.editable && !asPurchaseRow(row).locked
            })
          }
        }]
      }]
    }
  ]
}
```

## 页面完整用法

```vue
<template>
  <section class="purchase-detail-page">
    <FormTable
      ref="formTableRef"
      :table-data="tableData"
      :columns="columns"
      :form-props="{ size: 'small', labelPosition: 'top' }"
      :table-props="{
        border: true,
        rowKey: 'id',
        class: 'purchase-detail-table'
      }"
      @update:tableData="handleTableDataUpdate"
      @field-change="handleFieldChange"
    >
      <template #row-actions="{ row, index, component }">
        <el-button type="text" @click="copyRow(row, index)">
          复制
        </el-button>
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

    <div class="page-actions">
      <el-button @click="addRow">新增明细</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">
        提交采购申请
      </el-button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import FormTable from '@itagan/form-table'
import type {
  FormTableExpose,
  FormTableFieldChangePayload,
  TableRow
} from '@itagan/form-table'
import { createPurchaseColumns } from './createPurchaseColumns'
import type { PurchaseDetailRow } from './types'
import { purchaseApi } from '@/api/purchase'

const createEmptyRow = (): PurchaseDetailRow => ({
  id: `local-${Date.now()}-${Math.random()}`,
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

const formTableRef = ref<FormTableExpose | null>(null)
const tableData = ref<PurchaseDetailRow[]>([createEmptyRow()])
const submitting = ref(false)

// columns 创建一次；行级差异通过动态 props 回调读取 row。
const columns = createPurchaseColumns({
  editable: true
})

const handleTableDataUpdate = (nextTableData: TableRow[]) => {
  tableData.value = nextTableData as PurchaseDetailRow[]
}

const handleFieldChange = (event: FormTableFieldChangePayload) => {
  // 采购组织变化后，旧供应商不再有效。
  if (event.fieldKey === 'orgCode') {
    const next = [...tableData.value]
    next[event.index] = {
      ...next[event.index],
      supplierId: '',
      supplierName: ''
    }
    tableData.value = next
  }
}

const addRow = () => {
  tableData.value = [...tableData.value, createEmptyRow()]
}

const copyRow = (row: TableRow, index: number) => {
  const source = row as PurchaseDetailRow
  const next = [...tableData.value]
  next.splice(index + 1, 0, {
    ...source,
    id: `local-${Date.now()}-${Math.random()}`,
    attachmentIds: [...source.attachmentIds],
    approvalStatus: 'draft',
    locked: false
  })
  tableData.value = next
}

const removeRow = async (index: number) => {
  tableData.value = tableData.value.filter((_, rowIndex) => rowIndex !== index)
  // 行下标变化后清理 Element UI 保存的旧校验状态。
  await nextTick()
  formTableRef.value?.clearValidate()
}

const submit = async () => {
  if (!await formTableRef.value?.validate()) return

  submitting.value = true
  try {
    await purchaseApi.submit({ details: tableData.value })
  } finally {
    submitting.value = false
  }
}
</script>
```

示例中的 `purchaseApi` 代表业务项目自己的接口层，不由 FormTable 提供。

## 不同组件协议的处理原则

### 标准 Vue 2 v-model

组件使用 `value/input`，或自己声明了 Vue 2 `model` 时，不配置 `component.model`：

```ts
component: {
  renderer: LocalStandardInput
}
```

FormTable 会把模型信息留给 Vue 2 在解析真实组件后处理，因此全局组件自身声明的 `model.prop/model.event` 也能生效。

### 非标准受控组件

组件使用任意 prop 和事件时显式声明：

```ts
component: {
  renderer: 'corp-user-selector',
  model: {
    prop: 'selected-user-id',
    event: 'select-user',
    valueFromEvent: (...args) => (args[0] as { id: string }).id
  }
}
```

事件名支持 `select-user`、`select-xx`、`update:value` 等任意字符串，必须与组件实际 `$emit()` 的名称一致。

### 纯展示或命令型组件

组件不应被注入模型属性和事件时使用：

```ts
component: {
  renderer: 'biz-status-display',
  model: false,
  props: ({ value }) => ({ status: value })
}
```

### 多页面复用的异常协议

如果同一个内部组件需要在许多页面重复编写值转换、默认 props 和事件联动，应创建 Adapter 组件统一协议，而不是在每份 columns 中复制代码：

```vue
<template>
  <LegacyEmployeePicker
    :employee-code="value"
    v-bind="$attrs"
    @employee-confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
defineProps<{ value?: string }>()
const emit = defineEmits<{
  (event: 'input', value: string): void
  (event: 'employee-change', employee: unknown): void
}>()

const handleConfirm = (employee: any) => {
  emit('input', employee.code)
  emit('employee-change', employee)
}
</script>
```

Adapter 负责技术协议归一化，columns listener 负责当前采购页面的字段联动。

## 性能与维护建议

- `columns` 使用工厂创建一次，不要直接写在模板表达式中。
- 为表格配置唯一稳定的 `tableProps.rowKey`；异步组件回调后仍可正确定位原行。
- 动态 `visible/props/options` 保持纯函数，不在求值过程中修改行数据。
- 全局组件使用字符串 renderer；局部组件直接传组件对象，避免为了 FormTable 扩大全局注册范围。
- `component.model` 只描述稳定的技术协议，业务字段联动放在 `component.listeners`。
- 复杂事件使用 `valueFromEvent` 只提取当前字段值，其余事件参数仍会完整传给同名 listener。
- 展示组件使用 `model: false`，避免无意义的 value/input 注入。
- 行增删后调用 `clearValidate()`；提交前统一调用 `validate()`。
- 服务端 Schema 只保存可序列化布局和允许的组件标识，组件对象、函数与事件处理在可信的业务代码中补充。

## 职责边界

在这个场景中，各层职责如下：

```text
FormTable
  负责布局、字段渲染、校验路径、不可变更新

公司组件适配层
  负责组件协议、默认属性、跨页面技术兼容

columns 工厂
  负责当前采购业务的字段组合和联动

页面
  负责行增删、权限、接口提交、弹窗和消息提示
```

保持这个边界后，公司内部组件数量增加不会扩大 FormTable 核心，业务页面也不需要把所有组件强制改造成统一的 `value/input` 协议。
