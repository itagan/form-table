<template>
  <div class="form-table-advanced-demo">
    <h1>FormTable 高级示例</h1>

    <div class="demo-section">
      <h2>Slot 插槽使用说明</h2>
      <p>本示例展示了如何使用 slot 插槽来自定义表格列的内容：</p>
      <ul>
        <li>
          <strong>索引列</strong>: 使用 Element UI 原生
          <code>type: 'index'</code> 渲染序号
        </li>
        <li>
          <strong>表头插槽 (#basic-info-header)</strong>: 使用模板自定义列头内容
        </li>
        <li><strong>required</strong>: 在默认表头或表头插槽中展示必填标识</li>
        <li>
          <strong>renderHeader</strong>: 使用 Element UI 原生 render-header
          能力自定义列头
        </li>
        <li>
          <strong>学校选择插槽 (#table-school)</strong>: 使用 el-select
          组件进行学校选择
        </li>
        <li>
          <strong>性别选择插槽 (#table-gender)</strong>: 使用 el-radio-group
          组件进行性别选择
        </li>
        <li>
          <strong>操作按钮插槽 (#table-actions)</strong>:
          使用自定义按钮进行行操作
        </li>
      </ul>
      <p>
        在 columns 配置中，字段使用 <code>type: 'slot'</code> 和
        <code>slotName: 'table-xxx'</code> 指定插槽；表头可以使用
        <code>headerSlot</code> 模板插槽或
        <code>props.renderHeader</code> 原生渲染函数。
        Element Table 已有的列能力优先通过 <code>column.props</code> 透传使用，
        表格内表单相关的值更新、校验、行操作再使用 FormTable 扩展能力。
      </p>
    </div>

    <div class="demo-section">
      <h2>基础用法</h2>

      <FormTable
        ref="formTableRef"
        :table-data="tableData"
        :columns="columns"
        :rules="rules"
        :form-data="formData"
        :loading="loading"
        :custom-components="customComponents"
        @update:tableData="handleTableDataUpdate"
        @field-change="handleFieldChange"
        @event="handleFormTableEvent"
      >
        <!-- 表头插槽 -->
        <template #basic-info-header="{ label, required, columnIndex }">
          <span v-if="required" class="required-mark">*</span>
          <span>{{ label }}</span>
          <el-tag size="mini" type="success"
            >第 {{ columnIndex + 1 }} 列</el-tag
          >
        </template>

        <!-- 学校选择插槽 -->
        <template #table-school="{ value, setValue }">
          <el-select :value="value" placeholder="请选择学校" @input="setValue">
            <el-option label="县一小" value="县一小"></el-option>
            <el-option label="县二中" value="县二中"></el-option>
            <el-option label="市一中" value="市一中"></el-option>
            <el-option label="省实验中学" value="省实验中学"></el-option>
          </el-select>
        </template>

        <!-- 性别选择插槽 -->
        <template #table-gender="{ value, setValue }">
          <el-radio-group :value="value" @input="setValue">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </template>

        <!-- 操作按钮插槽 -->
        <template
          #table-actions="{
            index,
            isFirstRow,
            isLastRow,
            moveUp,
            moveDown,
            copyCurrentRow,
            removeCurrentRow,
            insertAfter,
          }"
        >
          <el-button size="small" :disabled="isFirstRow" @click="moveUp"
            >上移</el-button
          >
          <el-button size="small" :disabled="isLastRow" @click="moveDown"
            >下移</el-button
          >
          <el-button size="small" type="primary" @click="handleEditRow(index)"
            >编辑</el-button
          >
          <el-button
            size="small"
            @click="copyCurrentRow({ name: `复制-${index + 1}` })"
            >复制</el-button
          >
          <el-button size="small" @click="insertAfter({ name: '', phone: '' })"
            >插入</el-button
          >
          <el-button
            size="small"
            type="danger"
            @click="handleDeleteRow(index, removeCurrentRow)"
            >删除</el-button
          >
        </template>
      </FormTable>

      <div class="actions">
        <el-button type="primary" @click="handleSubmit">提交表单</el-button>
        <el-button @click="handleReset">重置表单</el-button>
        <el-button @click="handleAddRow">添加行</el-button>
        <el-button @click="handleRemoveRow">删除行</el-button>
        <el-button @click="toggleLoading">切换加载状态</el-button>
        <el-button @click="handleDoLayout">重排表格</el-button>
      </div>
    </div>

    <div class="demo-section">
      <h2>当前数据</h2>
      <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
    </div>

    <div class="demo-section">
      <h2>统一事件日志</h2>
      <pre>{{ JSON.stringify(eventLog, null, 2) }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { Message } from 'element-ui'
import FormTable from '@/components/FormTable/index.vue'
import PhoneInput from '@/components/CustomComponents/PhoneInput.vue'
import StatusTag from '@/components/CustomComponents/StatusTag.vue'
import TestComponent from '@/components/CustomComponents/TestComponent.vue'
import SimpleTest from '@/components/CustomComponents/SimpleTest.vue'
import type {
  ColumnConfig,
  CustomComponentConfig,
  FormTableEventPayload,
  FormTableExpose,
  FormTableFieldChangePayload,
  TableRow,
} from '@/components/FormTable/types'

const tableData = ref<TableRow[]>([
  {
    name: '张三',
    age: 25,
    department: '技术部',
    profile: {
      city: '杭州',
    },
    level: 'senior',
    remark: '负责核心模块与需求拆解。',
    status: true,
    phone: '13800138000',
    workStatus: 'processing',
    testValue: 'test',
    simpleTest: '默认值',
    school: '县一小',
    gender: '男',
  },
  {
    name: '李四',
    age: 30,
    department: '产品部',
    profile: {
      city: '上海',
    },
    level: 'mid',
    remark: '跟进跨部门协作与需求排期。',
    status: false,
    phone: '13900139000',
    workStatus: 'pending',
    testValue: 'success',
    simpleTest: '新值',
    school: '市一中',
    gender: '女',
  },
])

const formData = reactive({
  tableData: tableData.value,
})

const loading = ref(false)
const eventLog = ref<FormTableEventPayload[]>([])

// 自定义组件配置
const customComponents = ref<CustomComponentConfig[]>([
  {
    name: 'PhoneInput',
    component: PhoneInput,
  },
  {
    name: 'StatusTag',
    component: StatusTag,
  },
  {
    name: 'TestComponent',
    component: TestComponent,
  },
  {
    name: 'SimpleTest',
    component: SimpleTest,
  },
])

const rules = ref({
  'tableData.*.name': [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  'tableData.*.age': [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    {
      type: 'number',
      min: 18,
      max: 65,
      message: '年龄必须在18-65之间',
      trigger: 'blur',
    },
  ],
  'tableData.*.level': [
    { required: true, message: '请选择职级', trigger: 'change' },
  ],
  'tableData.*.phone': [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号格式',
      trigger: 'blur',
    },
  ],
  'tableData.*.profile.city': [
    { required: true, message: '请输入所在城市', trigger: 'blur' },
  ],
  'tableData.*.school': [
    { required: true, message: '请选择学校', trigger: 'change' },
  ],
  'tableData.*.gender': [
    { required: true, message: '请选择性别', trigger: 'change' },
  ],
})

const columns = ref<ColumnConfig[]>([
  {
    name: '序号',
    props: {
      type: 'index',
      width: '70px',
      align: 'center',
      index: (index: number) => index + 1,
    },
    children: [],
  },
  {
    name: '基本信息',
    required: true,
    headerSlot: 'basic-info-header',
    props: { width: '400px' },
    children: [
      {
        gutter: 10,
        children: [
          {
            key: 'name',
            type: 'input',
            layout: {
              span: 12,
            },
            component: {
              listeners: {
                blur: (context) => {
                  const currentValue = String(context.value || '').trim()
                  if (currentValue !== context.value) {
                    context.setValue(currentValue)
                  }
                },
              },
              bind: {
                placeholder: '请输入姓名',
                maxlength: 20,
                clearable: true,
              },
            },
          },
          {
            key: 'age',
            type: 'number',
            layout: {
              span: 12,
            },
            component: {
              bind: {
                placeholder: '请输入年龄',
                controlsPosition: 'right',
              },
            },
            behavior: {
              defaultValue: 18,
            },
          },
        ],
      },
    ],
  },
  {
    name: '联系方式',
    required: true,
    props: {
      width: '300px',
      renderHeader: (h: any, { column }: { column: any; $index: number }) => {
        return h('span', [
          h(
            'span',
            {
              style: {
                color: '#f56c6c',
                marginRight: '4px',
              },
            },
            '*',
          ),
          h('span', column.label),
          h(
            'el-tooltip',
            {
              props: {
                content: '手机号用于联系和校验',
                placement: 'top',
              },
            },
            [
              h('i', {
                class: 'el-icon-question',
                style: {
                  marginLeft: '6px',
                },
              }),
            ],
          ),
        ])
      },
    },
    children: [
      {
        children: [
          {
            key: 'phone',
            type: 'custom',
            layout: {
              span: 24,
            },
            component: {
              customComponent: 'PhoneInput',
              bind: {
                placeholder: '请输入手机号',
                clearable: true,
              },
            },
          },
        ],
      },
    ],
  },
  {
    name: '工作信息',
    props: { width: '420px' },
    required: true,
    children: [
      {
        children: [
          {
            key: 'department',
            type: 'input',
            layout: {
              span: 10,
            },
            component: {
              bind: ({ row }) => ({
                disabled: row.status === false,
                clearable: row.status !== false,
                placeholder:
                  row.status === false
                    ? '当前已停用，部门不可编辑'
                    : '请输入部门',
              }),
            },
            behavior: {
              onValueChange: ({ value, getValue }) => {
                if (value !== '技术部' && getValue('level') === 'senior') {
                  return {
                    level: 'mid',
                  }
                }
              },
            },
          },
          {
            key: 'profile.city',
            type: 'input',
            layout: {
              span: 14,
            },
            component: {
              bind: {
                placeholder: '请输入所在城市',
              },
            },
            behavior: {
              defaultValue: '上海',
            },
          },
          {
            key: 'level',
            type: 'select',
            layout: {
              span: 14,
            },
            component: {
              options: ({ row }) => {
                const commonOptions = [
                  { label: '初级', value: 'junior' },
                  { label: '中级', value: 'mid' },
                ]

                if (row.department === '技术部') {
                  return [...commonOptions, { label: '高级', value: 'senior' }]
                }

                return commonOptions
              },
              bind: ({ row }) => ({
                filterable: true,
                placeholder:
                  row.department === '技术部'
                    ? '请选择技术职级'
                    : '请选择通用职级',
              }),
            },
            behavior: {
              defaultValue: 'junior',
              onValueChange: ({ value, row, getValue }) => {
                if (value === 'junior') {
                  return {
                    remark: '',
                  }
                }

                if (!getValue('remark')) {
                  return {
                    remark: `${
                      row.name || '该成员'
                    }当前为${value}级，需要补充说明。`,
                  }
                }
              },
            },
          },
          {
            key: 'remark',
            type: 'textarea',
            layout: {
              span: 24,
            },
            component: {
              bind: ({ row }) => ({
                rows: row.level === 'senior' ? 3 : 2,
                maxlength: 60,
                showWordLimit: true,
                placeholder:
                  row.status === false
                    ? '当前已停用，备注可不填写'
                    : '请输入备注',
              }),
            },
            behavior: {
              visible: ({ row }) => row.level !== 'junior',
            },
          },
          {
            key: 'status',
            type: 'switch',
            layout: {
              span: 24,
            },
            behavior: {
              defaultValue: true,
              onValueChange: ({ value, getValue }) => {
                if (value === false) {
                  return {
                    workStatus: 'pending',
                  }
                }

                if (getValue('workStatus') === 'pending') {
                  return {
                    workStatus: 'processing',
                  }
                }
              },
            },
          },
        ],
      },
    ],
  },
  {
    name: '工作状态',
    props: { width: '200px' },
    children: [
      {
        children: [
          {
            key: 'workStatus',
            type: 'custom',
            layout: {
              span: 24,
            },
            component: {
              customComponent: 'StatusTag',
              options: [
                { value: 'processing', label: '处理中', type: 'info' },
                { value: 'pending', label: '待处理', type: 'warning' },
                { value: 'completed', label: '已完成', type: 'success' },
                { value: 'failed', label: '失败', type: 'danger' },
              ],
            },
            behavior: {
              defaultValue: 'processing',
            },
          },
        ],
      },
    ],
  },
  {
    name: '测试组件',
    props: { width: '150px' },
    children: [
      {
        children: [
          {
            key: 'testValue',
            type: 'custom',
            layout: {
              span: 24,
            },
            component: {
              customComponent: 'TestComponent',
            },
          },
        ],
      },
    ],
  },
  {
    name: '简单测试',
    props: { width: '200px' },
    children: [
      {
        children: [
          {
            key: 'simpleTest',
            type: 'custom',
            layout: {
              span: 24,
            },
            component: {
              customComponent: 'SimpleTest',
            },
          },
        ],
      },
    ],
  },
  {
    name: '学校',
    props: { width: '200px' },
    children: [
      {
        children: [
          {
            key: 'school',
            type: 'slot',
            layout: {
              span: 24,
            },
            component: {
              slotName: 'table-school',
            },
          },
        ],
      },
    ],
  },
  {
    name: '性别',
    props: { width: '150px' },
    children: [
      {
        children: [
          {
            key: 'gender',
            type: 'slot',
            layout: {
              span: 24,
            },
            component: {
              slotName: 'table-gender',
            },
            behavior: {
              defaultValue: '男',
            },
          },
        ],
      },
    ],
  },
  {
    name: '操作',
    props: { width: '150px' },
    children: [
      {
        children: [
          {
            key: 'actions',
            type: 'slot',
            layout: {
              span: 24,
            },
            component: {
              slotName: 'table-actions',
            },
          },
        ],
      },
    ],
  },
])

const formTableRef = ref<FormTableExpose>()

const handleTableDataUpdate = (newData: TableRow[]) => {
  tableData.value = newData
}

const handleFormTableEvent = (payload: FormTableEventPayload) => {
  if (payload.type === 'field-change') {
    return
  }
  eventLog.value = [payload, ...eventLog.value].slice(0, 8)
}

const handleFieldChange = (payload: FormTableFieldChangePayload) => {
  eventLog.value = [
    {
      type: 'field-change',
      args: [payload],
    },
    ...eventLog.value,
  ].slice(0, 8)
}

const handleSubmit = async () => {
  const valid = await formTableRef.value?.validate()
  if (valid) {
    Message.success('表单验证通过')
    return
  }

  Message.error('表单验证失败，请检查输入')
}

const handleReset = () => {
  formTableRef.value?.resetFields()
}

const handleDoLayout = () => {
  formTableRef.value?.doLayout()
  Message.success('已调用原生 el-table doLayout')
}

const handleAddRow = () => {
  formTableRef.value?.addRow({
    name: '',
    department: '',
    'profile.city': '成都',
    level: 'mid',
    status: false,
    phone: '',
    testValue: '',
    simpleTest: '',
    school: '',
  })
}

const handleRemoveRow = () => {
  if (tableData.value.length > 1) {
    formTableRef.value?.removeRow(tableData.value.length - 1)
  }
}

const handleEditRow = (index: number) => {
  const row = tableData.value[index]
  Message.info(`编辑第 ${index + 1} 行: ${row?.name ?? ''}`)
}

const handleDeleteRow = (index: number, removeCurrentRow?: () => void) => {
  if (tableData.value.length > 1) {
    removeCurrentRow?.() || formTableRef.value?.removeRow(index)
  }
}

const toggleLoading = () => {
  loading.value = !loading.value
  if (loading.value) {
    setTimeout(() => {
      loading.value = false
    }, 2000)
  }
}
</script>

<style lang="less" scoped>
.form-table-advanced-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    color: #303133;
    margin-bottom: 30px;
    text-align: center;
  }

  .demo-section {
    margin-bottom: 40px;
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background: #fff;

    h2 {
      color: #606266;
      margin-bottom: 20px;
    }

    .actions {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;

      .el-button {
        margin-right: 10px;
      }
    }

    pre {
      background: #f5f7fa;
      padding: 15px;
      border-radius: 4px;
      font-size: 12px;
      overflow-x: auto;
    }
  }
}

.required-mark {
  color: #f56c6c;
  font-weight: 600;
  margin-right: 4px;
}
</style>
