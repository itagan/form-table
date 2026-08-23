<template>
  <main class="custom-field-types-page">
    <router-link to="/">← 返回示例中心</router-link>
    <h1>实例级自定义字段 Type</h1>
    <p>
      注册一次稳定的组件、model 和默认 props，columns 就可以像内置字段一样使用
      <code>type: 'employee'</code>。金额字段还通过 <code>valueToProp/valueFromEvent</code>
      在“数据存分”和“组件显示元”之间同步转换；可选的 <code>defineFormTableType</code>
      为字段级 props 和 listener 原始参数提供精确类型，且不会增加运行时包装。
    </p>

    <FormTable
      v-model="tableData"
      :columns="columns"
      :field-types="fieldTypes"
      :table-props="{ border: true }"
      :form-props="{ size: 'small', labelPosition: 'top' }"
    />

    <section class="notes">
      <el-alert
        title="负责人字段由 binding.map 一次写回员工与部门信息；清空时使用 fallbackValue。"
        type="success"
        :closable="false"
        show-icon
      />
      <p><strong>最近一次原始业务事件：</strong>{{ lastBusinessEvent || '尚未触发' }}</p>
    </section>

    <DemoCollapsiblePanel title="当前业务数据">
      <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
    </DemoCollapsiblePanel>

    <section class="unknown-type-demo">
      <h2>未知 Type 的开发期保护</h2>
      <p>
        下表故意模拟绕过 TypeScript 的远程配置。未知名称会按实例和名称只警告一次，并给出列、字段位置
        与可用名称；非法注册协议也会得到开发期提示。字段内容留空且不影响其他列，生产环境静默留空。
      </p>
      <DefaultFormTable
        v-model="unknownTypeData"
        :columns="unknownTypeColumns"
        :table-props="{ border: true }"
      />
    </section>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import DefaultFormTable, {
  createFormTable,
  defineFormTableColumns,
  defineFormTableType,
  defineFormTableTypes
} from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'
import EmployeeSelectionInput from '../components/CustomComponents/EmployeeSelectionInput.vue'
import type { EmployeeSelection } from '../components/CustomComponents/EmployeeSelectionInput.vue'
import MoneyInput from '../components/EnterpriseComponents/MoneyInput.vue'
import PhoneInput from '../components/CustomComponents/PhoneInput.vue'

interface PurchaseRow extends TableRow {
  id: string
  phone: string
  budgetInCents: number
  currency: string
  employeeId: string
  employeeName: string
  departmentId: string
  departmentName: string
}

const employees: EmployeeSelection[] = [
  { id: 'u-101', name: 'Alice', departmentId: 'd-rd', departmentName: '研发部' },
  { id: 'u-102', name: 'Bob', departmentId: 'd-fin', departmentName: '财务部' },
  { id: 'u-103', name: 'Carol', departmentId: 'd-pm', departmentName: '产品部' }
]

const businessPhoneType = defineFormTableType<PurchaseRow>()<{
  clearable?: boolean
  placeholder?: string
  disabled?: boolean
}>({
  is: PhoneInput,
  props: { clearable: true }
})

const moneyType = defineFormTableType<PurchaseRow>()<{
  currency?: string
  precision?: number
  min?: number
  disabled?: boolean
}, {
  'amount-change': [amount: number, meta: { currency: string; formatted: string }]
}>({
  is: MoneyInput,
  model: {
    prop: 'amount',
    event: 'amount-change',
    valueToProp: (_context, value) => Number(value || 0) / 100,
    valueFromEvent: (_context, amount) => Math.round(amount * 100)
  },
  props: ({ row }) => ({
    currency: row.currency,
    precision: 2,
    min: 0
  })
})

const employeeType = defineFormTableType<PurchaseRow>()<{
  employees?: EmployeeSelection[]
  clearable?: boolean
  disabled?: boolean
}, {
  'user-confirm': [
    employee: EmployeeSelection | null,
    meta: { source: 'custom-field-type' }
  ]
}>({
  is: EmployeeSelectionInput,
  model: {
    prop: 'selection',
    event: 'user-confirm'
  },
  props: {
    employees,
    clearable: true
  }
})

const fieldTypes = defineFormTableTypes<PurchaseRow>()({
  businessPhone: businessPhoneType,
  money: moneyType,
  employee: employeeType
})

const FormTable = createFormTable<PurchaseRow, typeof fieldTypes>()
const lastBusinessEvent = ref('')
const tableData = ref<PurchaseRow[]>([{
  id: 'purchase-1',
  phone: '+8613800000000',
  budgetInCents: 1200000,
  currency: 'CNY',
  employeeId: 'u-101',
  employeeName: 'Alice',
  departmentId: 'd-rd',
  departmentName: '研发部'
}])

const columns = defineFormTableColumns<PurchaseRow, typeof fieldTypes>([
  {
    label: '标准 model',
    props: { minWidth: 240 },
    formItems: [{
      fieldKey: 'phone',
      type: 'businessPhone',
      formItemProps: { label: '联系电话' },
      component: {
        props: { placeholder: '字段 props 覆盖注册默认值' }
      }
    }]
  },
  {
    label: '非标准 model 与原始事件',
    props: { minWidth: 220 },
    formItems: [{
      fieldKey: 'budgetInCents',
      type: 'money',
      formItemProps: { label: '预算（数据存分，组件显示元）' },
      component: {
        props: { precision: 0 },
        listeners: {
          'amount-change'(_context, amount, meta) {
            lastBusinessEvent.value = `amount-change(${String(amount)}, ${JSON.stringify(meta)})`
          }
        }
      }
    }]
  },
  {
    label: '自定义 type + binding.map',
    props: { minWidth: 320 },
    formItems: [{
      fieldKey: 'employeeId',
      type: 'employee',
      formItemProps: { label: '负责人 / 所属部门' },
      binding: {
        map: [
          { fieldPath: 'employeeId', valuePath: 'id', fallbackValue: '' },
          { fieldPath: 'employeeName', valuePath: 'name', fallbackValue: '' },
          { fieldPath: 'departmentId', valuePath: 'departmentId', fallbackValue: '' },
          { fieldPath: 'departmentName', valuePath: 'departmentName', fallbackValue: '' }
        ]
      },
      component: {
        listeners: {
          'user-confirm'(_context, employee, meta) {
            const name = employee?.name || '已清空'
            lastBusinessEvent.value = `user-confirm(${name}, ${JSON.stringify(meta)})`
          }
        }
      }
    }]
  }
])

const unknownTypeData = ref([{ unresolved: '该值不会被未知组件渲染' }])
// 只用于演示 JavaScript/远程配置绕过静态检查后的运行时保护。
const unknownTypeColumns = ([{
  label: '其他字段正常渲染',
  formItems: [{ fieldKey: 'unresolved', type: 'input' }]
}, {
  label: '未知 type（内容为空）',
  formItems: [{ fieldKey: 'unresolved', type: 'missing-business-type' }]
}] as unknown) as ColumnConfig[]
</script>

<style lang="less" scoped>
.custom-field-types-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px;
}

.notes,
.unknown-type-demo {
  margin-top: 24px;
}

pre {
  overflow: auto;
  margin: 0;
}
</style>
