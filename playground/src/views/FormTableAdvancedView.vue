<template>
  <main class="demo-page">
    <header>
      <router-link to="/">← 返回</router-link>
      <h1>复杂布局与三种渲染模式</h1>
      <p>同一套 children 布局同时演示 type、自定义 component、Render Function 组件和 slot。</p>
    </header>

    <section class="demo-card">
      <FormTable
        ref="formTableRef"
        v-model="tableData"
        :columns="columns"
        :form-props="{ size: 'small' }"
        row-key="id"
        :table-props="{ border: true }"
        :hint-options="{ mode: 'tooltip' }"
        @field-change="handleFieldChange"
        @selection-change="selection = $event"
      >
        <template #contact-header="{ label }">
          <span class="required-mark">*</span>
          <span>{{ label }}</span>
          <i class="el-icon-question" aria-hidden="true" />
        </template>

        <template #status="{ value, component }">
          <el-tag v-bind="component.props">
            {{ value === 'enabled' ? '启用' : '停用' }}
          </el-tag>
        </template>

        <template #actions="{ row, index, updateRow }">
          <el-button type="text" @click="updateRow({ status: row.status === 'enabled' ? 'disabled' : 'enabled' })">
            切换状态
          </el-button>
          <el-button type="text" @click="copyRow(row, index)">复制</el-button>
          <el-button type="text" class="danger" @click="removeRow(index)">删除</el-button>
        </template>
      </FormTable>

      <div class="actions">
        <el-button type="primary" @click="addRow">添加联系人</el-button>
        <el-button @click="formTableRef?.getTableRef()?.doLayout()">重新布局</el-button>
        <span>已选择 {{ selection.length }} 行</span>
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
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose, FormTableFieldChangePayload, TableRow } from '@itagan/form-table'
import PhoneInput from '../components/CustomComponents/PhoneInput.vue'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'
import { formatFormTableConfig } from '../utils/formatFormTableConfig'

const cityOptions: Record<string, Array<{ label: string; value: string }>> = {
  zhejiang: [{ label: '杭州', value: 'hangzhou' }, { label: '宁波', value: 'ningbo' }],
  jiangsu: [{ label: '南京', value: 'nanjing' }, { label: '苏州', value: 'suzhou' }]
}
const ActiveRenderer = {
  name: 'ActiveRenderer',
  props: {
    value: { type: Boolean, default: false },
    effect: { type: String, default: 'light' }
  },
  render(this: any, h: any) {
    return h('el-tag', {
      props: {
        type: this.value ? 'success' : 'info',
        effect: this.effect
      },
      style: { cursor: 'pointer' },
      nativeOn: {
        click: () => this.$emit('commit', !this.value)
      }
    }, [this.value ? '活跃' : '停用'])
  }
}
const tableData = ref<TableRow[]>([{
  id: 1,
  name: '张三',
  phone: '+8613800138000',
  province: 'zhejiang',
  city: 'hangzhou',
  profile: { address: '西湖区文三路' },
  status: 'enabled',
  active: true
}])
const selection = ref<TableRow[]>([])
const formTableRef = ref<FormTableExpose>()

const columns: ColumnConfig[] = [
  { type: 'selection', props: { width: 48 } },
  { type: 'index', label: '序号', props: { width: 64, align: 'center' } },
  {
    label: '联系人信息',
    headerSlot: 'contact-header',
    headerHint: '一个单元格内包含两行栅格布局',
    headerProps: { 'aria-label': '联系人信息说明' },
    props: { minWidth: 600 },
    children: [
      {
        props: { gutter: 10 },
        children: [
          {
            fieldKey: 'name',
            type: 'input',
            colProps: { span: 8 },
            formItemProps: { label: '姓名', labelWidth: '52px', rules: [{ required: true, message: '请输入姓名' }] },
            component: { props: { clearable: true } }
          },
          {
            fieldKey: 'phone',
            type: 'component',
            colProps: { span: 16 },
            formItemProps: { label: '手机', labelWidth: '52px' },
            component: {
              renderer: PhoneInput,
              props: { size: 'small', clearable: true },
              listeners: { change: ({ value }) => console.log('phone changed', value) }
            }
          }
        ]
      },
      {
        props: { gutter: 10 },
        children: [
          {
            fieldKey: 'province',
            type: 'select',
            colProps: { span: 7 },
            formItemProps: { label: '省份', labelWidth: '52px' },
            component: {
              props: { clearable: true },
              options: [{ label: '浙江', value: 'zhejiang' }, { label: '江苏', value: 'jiangsu' }]
            }
          },
          {
            fieldKey: 'city',
            type: 'select',
            visible: ({ row }) => Boolean(row.province),
            colProps: { span: 7 },
            formItemProps: { label: '城市', labelWidth: '52px' },
            component: {
              options: ({ row }) => cityOptions[row.province] || []
            }
          },
          {
            fieldKey: 'profile.address',
            type: 'input',
            colProps: { span: 10 },
            formItemProps: { label: '地址', labelWidth: '52px' }
          }
        ]
      }
    ]
  },
  {
    label: '状态',
    props: { width: 90, align: 'center' },
    children: [{ children: [{
      fieldKey: 'status',
      type: 'slot',
      component: {
        renderer: 'status',
        props: ({ row }) => ({ type: row.status === 'enabled' ? 'success' : 'info' })
      }
    }] }]
  },
  {
    label: 'Render Function',
    props: { width: 150, align: 'center' },
    children: [{ children: [{
      key: 'active-render-field',
      fieldKey: 'active',
      type: 'component',
      component: {
        renderer: ActiveRenderer,
        props: { effect: 'plain' },
        listeners: {
          commit({ setValue }, nextValue) {
            setValue(Boolean(nextValue))
          }
        }
      }
    }] }]
  },
  {
    key: 'actions-column',
    label: '操作',
    props: { width: 210, fixed: 'right', align: 'center' },
    cellSlot: 'actions'
  }
]
const columnsCode = formatFormTableConfig(columns)

const handleFieldChange = (event: FormTableFieldChangePayload) => {
  if (event.fieldKey === 'province') {
    const next = [...tableData.value]
    next[event.index] = { ...next[event.index], city: '' }
    tableData.value = next
  }
}
const addRow = () => {
  tableData.value = [...tableData.value, {
    id: Date.now(), name: '', phone: '', province: '', city: '', profile: { address: '' }, status: 'enabled', active: true
  }]
}
const copyRow = (row: TableRow, index: number) => {
  const next = [...tableData.value]
  next.splice(index + 1, 0, { ...row, id: Date.now(), profile: { ...row.profile } })
  tableData.value = next
}
const removeRow = (index: number) => {
  tableData.value = tableData.value.filter((_, rowIndex) => rowIndex !== index)
  formTableRef.value?.clearValidate()
}
</script>

<style scoped>
.demo-page { max-width: 1380px; margin: 0 auto; padding: 32px; }
.demo-card { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
.actions { display: flex; align-items: center; gap: 12px; margin-top: 20px; }
.danger { color: #f56c6c; }
.required-mark { color: #f56c6c; }
pre { padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }
</style>
