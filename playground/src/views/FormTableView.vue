<template>
  <main class="demo-page">
    <header>
      <router-link to="/">← 返回</router-link>
      <h1>基础表格表单</h1>
      <p>统一使用 children 布局，字段通过 type 映射 Element UI 组件。</p>
    </header>

    <section class="demo-card">
      <FormTable
        ref="formTableRef"
        v-model="tableData"
        :columns="columns"
        :form-props="{ size: 'small' }"
        :table-props="{ border: true, stripe: true }"
      />

      <div class="actions">
        <el-button type="primary" @click="submit">校验</el-button>
        <el-button @click="addRow">添加行</el-button>
        <el-button :disabled="!tableData.length" @click="removeRow">删除末行</el-button>
      </div>
    </section>

    <DemoCollapsiblePanel class="demo-card" title="组件配置">
      <pre>{{ columnsCode }}</pre>
    </DemoCollapsiblePanel>

    <DemoCollapsiblePanel class="demo-card" title="当前数据">
      <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
    </DemoCollapsiblePanel>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Message } from 'element-ui'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose, TableRow } from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'
import { formatFormTableConfig } from '../utils/formatFormTableConfig'

const tableData = ref<TableRow[]>([
  { name: '小米', age: 16, school: 'county-primary' },
  { name: '小明', age: 18, school: 'city-middle' }
])

const required = (message: string, trigger = 'blur') => [{ required: true, message, trigger }]
const columns: ColumnConfig[] = [
  {
    label: '姓名和年龄',
    props: { minWidth: 320 },
    children: [{
      props: { gutter: 10 },
      children: [
        {
          fieldKey: 'name',
          type: 'input',
          colProps: { span: 12 },
          formItemProps: { rules: required('请输入姓名') },
          hint: ({ value }) => value ? String(value) : undefined,
          component: {
            props: {
              placeholder: '请输入姓名',
              clearable: true
            }
          }
        },
        {
          fieldKey: 'age',
          type: 'number',
          colProps: { span: 12 },
          formItemProps: { rules: required('请输入年龄', 'change') },
          component: { props: { min: 0, max: 150 } }
        }
      ]
    }]
  },
  {
    label: '学校',
    props: { minWidth: 200 },
    children: [{
      children: [{
        fieldKey: 'school',
        type: 'select',
        formItemProps: { rules: required('请选择学校', 'change') },
        component: {
          props: { placeholder: '请选择学校', clearable: true },
          options: [
            { label: '县一小', value: 'county-primary' },
            { label: '市一中', value: 'city-middle' }
          ]
        }
      }]
    }]
  }
]
const columnsCode = formatFormTableConfig(columns)

const formTableRef = ref<FormTableExpose>()
const submit = async () => {
  const valid = await formTableRef.value?.validate()
  Message[valid ? 'success' : 'error'](valid ? '校验通过' : '请完善表格内容')
}
const addRow = () => {
  tableData.value = [...tableData.value, { name: '', age: 0, school: '' }]
}
const removeRow = () => {
  tableData.value = tableData.value.slice(0, -1)
  formTableRef.value?.clearValidate()
}
</script>

<style scoped>
.demo-page { max-width: 1100px; margin: 0 auto; padding: 32px; }
.demo-card { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
.actions { display: flex; gap: 10px; margin-top: 20px; }
pre { padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }
</style>
