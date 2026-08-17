<template>
  <main class="hint-page">
    <header>
      <h1>Hint 展示策略</h1>
      <p>字符串内容、作用范围，以及按需挂载的单实例 Tooltip。</p>
    </header>

    <section class="hint-card">
      <h2>默认：字段原生 title</h2>
      <FormTable v-model="rows" :columns="columns" :form-props="formProps" :table-props="tableProps" />
    </section>

    <section class="hint-card">
      <h2>单实例 Tooltip · 字段与表头</h2>
      <FormTable
        v-model="rows"
        :columns="columns"
        :form-props="formProps"
        :table-props="tableProps"
        :hint-options="tooltipOptions"
      />
    </section>

    <section class="hint-card">
      <h2>表头使用不同参数：headerSlot 自定义</h2>
      <FormTable
        v-model="rows"
        :columns="customHeaderColumns"
        :form-props="formProps"
        :table-props="tableProps"
        :hint-options="tooltipOptions"
      >
        <template #amount-header="{ label }">
          <el-tooltip content="表头独立使用 top 位置" placement="top">
            <span class="custom-header">{{ label }} <i class="el-icon-question" /></span>
          </el-tooltip>
        </template>
      </FormTable>
    </section>

    <section class="hint-card">
      <h2>FormItem Label / Error Slot</h2>
      <div class="slot-actions">
        <el-button size="small" @click="validateItemSlots">触发校验</el-button>
        <span>{{ latestValidation }}</span>
      </div>
      <FormTable
        ref="slotTableRef"
        v-model="slotRows"
        :columns="itemSlotColumns"
        :form-props="formProps"
        :table-props="tableProps"
        @form-validate="handleFormValidate"
      >
        <template #name-label="{ row, propPath }">
          <span class="custom-item-label">
            姓名
            <el-tooltip :content="`行 ${row.id} · ${propPath}`" placement="top">
              <i class="el-icon-info" />
            </el-tooltip>
          </span>
        </template>
        <template #name-error="{ error }">
          <span class="custom-item-error"><i class="el-icon-warning" /> {{ error }}</span>
        </template>
      </FormTable>
    </section>

    <DemoCollapsiblePanel title="关键配置">
      <pre>{{ configuration }}</pre>
    </DemoCollapsiblePanel>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@itagan/form-table'
import type {
  ColumnConfig,
  ComponentProps,
  FormTableExpose,
  FormTableHintOptions,
  TableRow
} from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'

const rows = ref<TableRow[]>([{ id: 1, name: 'Alice', amount: 128.5 }])
const formProps: ComponentProps = { size: 'small' }
const tableProps: ComponentProps = { border: true, stripe: true }

const columns: ColumnConfig[] = [{
  label: '姓名',
  headerHint: '默认不会求值，因为 targets 默认为 field',
  formItems: [{ fieldKey: 'name', type: 'input', hint: ({ value }) => `当前姓名：${value}` }]
}, {
  label: '金额',
  headerHint: '含税金额说明',
  formItems: [{
    fieldKey: 'amount', type: 'number', hint: '仅金额组件区域触发', hintTrigger: 'content'
  }]
}]

const customHeaderColumns: ColumnConfig[] = [{
  label: '金额',
  headerSlot: 'amount-header',
  formItems: [{ fieldKey: 'amount', type: 'number' }]
}]

const slotRows = ref<TableRow[]>([{ id: 2, name: '' }])
const slotTableRef = ref<FormTableExpose | null>(null)
const latestValidation = ref('尚未校验')
const itemSlotColumns: ColumnConfig[] = [{
  label: '自定义 FormItem',
  formItems: [{
    fieldKey: 'name',
    type: 'input',
    labelSlot: 'name-label',
    errorSlot: 'name-error',
    formItemProps: {
      rules: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
    }
  }]
}]

const handleFormValidate = (propPath: string, valid: boolean, message: string | null) => {
  latestValidation.value = `${propPath}：${valid ? '通过' : message}`
}

const validateItemSlots = () => slotTableRef.value?.validate()

const tooltipOptions: FormTableHintOptions = {
  mode: 'tooltip',
  targets: 'all',
  field: ({ value }) => value == null || value === '' ? false : `当前完整值：${value}`,
  tooltipProps: { placement: 'right', openDelay: 120, effect: 'light' }
}

const configuration = `hintOptions: {
  mode: 'tooltip',
  targets: 'all',
  field: ({ value }) => value ? String(value) : false,
  tooltipProps: { placement: 'right', openDelay: 120 }
}`
</script>

<style scoped>
.hint-page { max-width: 1100px; margin: 0 auto; padding: 24px; color: #303133; }
.hint-page header { margin-bottom: 20px; }
.hint-page h1 { margin: 0 0 8px; }
.hint-page p { color: #606266; }
.hint-card { margin-bottom: 20px; padding: 20px; border: 1px solid #ebeef5; border-radius: 8px; background: #fff; }
.hint-card h2 { margin: 0 0 16px; font-size: 18px; }
.custom-header { cursor: help; }
.slot-actions { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #606266; }
.custom-item-label { display: inline-flex; align-items: center; gap: 4px; }
.custom-item-error { display: inline-flex; align-items: center; gap: 4px; color: #f56c6c; }
pre { overflow: auto; padding: 16px; background: #f5f7fa; }
</style>
