<template>
  <component 
    :is="componentType" 
    v-model="modelValue"
    v-bind="componentProps"
    @input="handleInput"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    @click="handleClick"
  />
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'

interface Props {
  type: string
  fieldKey: string
  row: Record<string, any>
  slotName?: string
  customComponent?: string
  customComponents?: Record<string, any>
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
  min?: number
  max?: number
  step?: number
  showStops?: boolean
  showInput?: boolean
  range?: boolean
  multiple?: boolean
  filterable?: boolean
  remote?: boolean
  remoteMethod?: Function
  loading?: boolean
  noDataText?: string
  noMatchText?: string
  reserveKeyword?: boolean
  defaultFirstOption?: boolean
  popperClass?: string
  automaticDropdown?: boolean
  size?: 'large' | 'default' | 'small'
  prefixIcon?: string
  suffixIcon?: string
  showWordLimit?: boolean
  maxlength?: number
  minlength?: number
  showPassword?: boolean
  autosize?: boolean | { minRows?: number; maxRows?: number }
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  autocomplete?: 'on' | 'off'
  name?: string
  id?: string
  tabindex?: string | number
  validateEvent?: boolean
  [key: string]: any
}

const props = defineProps<Props>()

// 获取自定义组件 (优先使用 props，否则使用 inject)
const customComponentsMap = computed(() => {
  return props.customComponents || inject('customComponents', {} as Record<string, any>)
})

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
  slotComponent: 'div', // 插槽组件占位符
  custom: 'div', // 自定义组件占位符
  rate: 'el-rate',
  slider: 'el-slider',
  color: 'el-color-picker',
  upload: 'el-upload',
  cascader: 'el-cascader',
  'tree-select': 'el-tree-select',
  autocomplete: 'el-autocomplete',
  'tag-input': 'el-select'
}

// 计算组件类型
const componentType = computed(() => {
  if (props.type === 'custom' && props.customComponent) {
    const component = customComponentsMap.value[props.customComponent]
    if (!component) {
      console.warn(`Custom component "${props.customComponent}" not found. Available:`, Object.keys(customComponentsMap.value))
      return 'div'
    }
    return component
  }
  return componentMap[props.type as keyof typeof componentMap] || 'el-input'
})

// 计算组件属性
const componentProps = computed(() => {
  const baseProps = {
    placeholder: props.placeholder || '请输入',
    clearable: props.clearable !== false,
    disabled: props.disabled,
    readonly: props.readonly,
    size: props.size,
    ...props
  }

  // 根据类型设置特定属性
  switch (props.type) {
    case 'textarea':
      return { 
        ...baseProps, 
        type: 'textarea', 
        rows: 3,
        autosize: props.autosize,
        resize: props.resize,
        showWordLimit: props.showWordLimit,
        maxlength: props.maxlength,
        minlength: props.minlength
      }
    case 'date':
      return { 
        ...baseProps, 
        type: 'date', 
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD'
      }
    case 'datetime':
      return { 
        ...baseProps, 
        type: 'datetime', 
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss'
      }
    case 'time':
      return { 
        ...baseProps, 
        format: 'HH:mm:ss',
        valueFormat: 'HH:mm:ss'
      }
    case 'number':
      return { 
        ...baseProps, 
        min: props.min || 0,
        max: props.max,
        step: props.step || 1,
        showWordLimit: props.showWordLimit,
        maxlength: props.maxlength,
        minlength: props.minlength
      }
    case 'switch':
      return { ...baseProps, clearable: undefined }
    case 'text':
      return {}
    case 'rate':
      return {
        ...baseProps,
        max: props.max || 5,
        showScore: true,
        clearable: undefined
      }
    case 'slider':
      return {
        ...baseProps,
        min: props.min || 0,
        max: props.max || 100,
        step: props.step || 1,
        showStops: props.showStops,
        showInput: props.showInput,
        range: props.range,
        clearable: undefined
      }
    case 'color':
      return {
        ...baseProps,
        showAlpha: true,
        clearable: undefined
      }
    case 'upload':
      return {
        ...baseProps,
        action: props.action || '#',
        'auto-upload': false,
        'list-type': 'text',
        clearable: undefined
      }
    case 'cascader':
      return {
        ...baseProps,
        options: props.options || [],
        props: props.cascaderProps || {
          expandTrigger: 'hover'
        }
      }
    case 'tree-select':
      return {
        ...baseProps,
        data: props.data || [],
        props: props.treeProps || {
          children: 'children',
          label: 'label',
          value: 'value'
        }
      }
    case 'autocomplete':
      return {
        ...baseProps,
        fetchSuggestions: props.fetchSuggestions || (() => []),
        triggerOnFocus: true
      }
    case 'tag-input':
      return {
        ...baseProps,
        multiple: true,
        filterable: true,
        allowCreate: true,
        defaultFirstOption: true
      }
    case 'select':
      return {
        ...baseProps,
        multiple: props.multiple,
        filterable: props.filterable,
        remote: props.remote,
        'remote-method': props.remoteMethod,
        loading: props.loading,
        'no-data-text': props.noDataText || '暂无数据',
        'no-match-text': props.noMatchText || '无匹配数据',
        'reserve-keyword': props.reserveKeyword,
        'default-first-option': props.defaultFirstOption,
        'popper-class': props.popperClass,
        'automatic-dropdown': props.automaticDropdown
      }
    case 'input':
      return {
        ...baseProps,
        showPassword: props.showPassword,
        showWordLimit: props.showWordLimit,
        maxlength: props.maxlength,
        minlength: props.minlength,
        prefixIcon: props.prefixIcon,
        suffixIcon: props.suffixIcon,
        autocomplete: props.autocomplete,
        name: props.name,
        id: props.id,
        tabindex: props.tabindex,
        'validate-event': props.validateEvent
      }
    case 'custom':
      return {
        ...baseProps,
        // 移除不适合自定义组件的属性
        clearable: undefined,
        placeholder: undefined
      }
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

const handleBlur = (event: Event) => {
  // 可以在这里添加失焦处理逻辑
}

const handleFocus = (event: Event) => {
  // 可以在这里添加聚焦处理逻辑
}

const handleClick = (event: Event) => {
  // 可以在这里添加点击处理逻辑
}
</script>
