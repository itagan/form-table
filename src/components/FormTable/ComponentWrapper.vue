<template>
  <component 
    :is="componentType" 
    v-model="modelValue"
    v-bind="componentProps"
    @input="handleInput"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  type: string
  fieldKey: string
  row: Record<string, any>
  slotName?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
  min?: number
  max?: number
  [key: string]: any
}

const props = defineProps<Props>()

// 组件映射表
const componentMap = {
  input: 'el-input',
  select: 'el-select',
  date: 'el-date-picker',
  datetime: 'el-date-picker',
  time: 'el-time-picker',
  textarea: 'el-input',
  number: 'el-input-number',
  switch: 'el-switch',
  radio: 'el-radio-group',
  checkbox: 'el-checkbox-group',
  text: 'span',
  slotComponent: 'div' // 插槽组件占位符
}

// 计算组件类型
const componentType = computed(() => {
  return componentMap[props.type as keyof typeof componentMap] || 'el-input'
})

// 计算组件属性
const componentProps = computed(() => {
  const baseProps = {
    placeholder: props.placeholder || '请输入',
    clearable: props.clearable !== false,
    disabled: props.disabled,
    readonly: props.readonly,
    ...props
  }

  // 根据类型设置特定属性
  switch (props.type) {
    case 'textarea':
      return { ...baseProps, type: 'textarea', rows: 3 }
    case 'date':
      return { ...baseProps, type: 'date', format: 'YYYY-MM-DD' }
    case 'datetime':
      return { ...baseProps, type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss' }
    case 'time':
      return { ...baseProps, format: 'HH:mm:ss' }
    case 'number':
      return { 
        ...baseProps, 
        min: props.min || 0,
        max: props.max
      }
    case 'switch':
      return { ...baseProps, clearable: undefined }
    case 'text':
      return {}
    default:
      return baseProps
  }
})

// 双向绑定
const modelValue = computed({
  get: () => props.row[props.fieldKey],
  set: (value) => {
    props.row[props.fieldKey] = value
  }
})

// 事件处理
const handleInput = (value: any) => {
  props.row[props.fieldKey] = value
}

const handleChange = (value: any) => {
  props.row[props.fieldKey] = value
}
</script>
