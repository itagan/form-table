<template>
  <main class="composite-binding-page">
    <router-link to="/">← 返回示例中心</router-link>
    <h1>复合字段映射</h1>
    <p>
      <code>binding.map</code> 将一个组件值映射到多个行字段；日期范围展示自定义组件及
      自定义 model 协议，清除时由 <code>fallbackValue</code> 写入空字符串；对象映射通过
      字段 Slot 的 <code>bindingValue/setBindingValue</code> 接入。
    </p>

    <FormTable
      v-model="tableData"
      :columns="columns"
      :table-props="{ border: true }"
      :form-props="{ size: 'small', labelPosition: 'top' }"
    >
      <template #contact-editor="{ bindingValue, setBindingValue }">
        <div class="contact-editor">
          <el-input
            :value="bindingValue.contact.name"
            placeholder="联系人"
            @input="setBindingValue({
              ...bindingValue,
              contact: { ...bindingValue.contact, name: $event }
            })"
          />
          <el-input
            :value="bindingValue.contact.phone"
            placeholder="联系电话"
            @input="setBindingValue({
              ...bindingValue,
              contact: { ...bindingValue.contact, phone: $event }
            })"
          />
        </div>
      </template>
    </FormTable>

    <DemoCollapsiblePanel title="当前业务数据">
      <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
    </DemoCollapsiblePanel>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { createFormTable, defineFormTableColumns } from '@itagan/form-table'
import type { TableRow } from '@itagan/form-table'
import DateRangePicker from '../components/CustomComponents/DateRangePicker.vue'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'

interface CompositeRow extends TableRow {
  startDate: string | null
  endDate: string | null
  contactName: string
  contactPhone: string
}

const FormTable = createFormTable<CompositeRow>()

const tableData = ref<CompositeRow[]>([{
  startDate: '2026-08-21',
  endDate: '2026-08-23',
  contactName: 'Alice',
  contactPhone: '13800000000'
}])

const columns = defineFormTableColumns<CompositeRow>([
  {
    label: '日期范围（自定义组件 + 数组映射）',
    props: { minWidth: 330 },
    formItems: [{
      fieldKey: 'startDate',
      binding: {
        map: [
          { fieldPath: 'startDate', valuePath: '[0]', fallbackValue: '' },
          { fieldPath: 'endDate', valuePath: '[1]', fallbackValue: '' }
        ]
      },
      type: 'component',
      formItemProps: {
        label: '开始 / 结束日期',
        rules: [{ required: true, message: '请选择日期范围' }]
      },
      component: {
        is: DateRangePicker,
        model: { prop: 'range', event: 'range-change' }
      }
    }]
  },
  {
    label: '联系人（对象映射 + Slot）',
    props: { minWidth: 360 },
    formItems: [{
      fieldKey: 'contactName',
      binding: {
        map: [
          { fieldPath: 'contactName', valuePath: 'contact.name', fallbackValue: '' },
          { fieldPath: 'contactPhone', valuePath: 'contact.phone', fallbackValue: '' }
        ]
      },
      type: 'slot',
      formItemProps: { label: '联系人 / 电话' },
      component: { slot: 'contact-editor' }
    }]
  }
])
</script>

<style lang="less" scoped>
.composite-binding-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px;
}

.contact-editor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

pre {
  overflow: auto;
  margin: 0;
}
</style>
