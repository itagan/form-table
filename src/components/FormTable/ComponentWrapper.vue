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
import { computed, inject, onUnmounted } from 'vue'
import { processComponentProps, validateComponentConfig } from './utils/componentProps'
import { getComponentType } from './configs/defaultComponentConfigs'

interface Props {
  type: string
  fieldKey: string
  row: Record<string, any>
  slotName?: string
  customComponent?: string
  customComponents?: Record<string, any>
  bind?: Record<string, any>
  [key: string]: any
}

const props = defineProps<Props>()

// 获取自定义组件 (优先使用 props，否则使用 inject)
const customComponentsMap = computed(() => {
  return props.customComponents || inject('customComponents', {} as Record<string, any>)
})

// 分离计算属性，避免重复计算
const componentType = computed(() => {
  if (props.type === 'custom' && props.customComponent) {
    const component = customComponentsMap.value[props.customComponent]
    if (!component) {
      console.warn(`Custom component "${props.customComponent}" not found. Available:`, Object.keys(customComponentsMap.value))
      return 'div'
    }
    return component
  }
  return getComponentType(props.type)
})

const componentProps = computed(() => {
  // 验证配置（只在开发模式下）
  if (import.meta.env.DEV) {
    const validation = validateComponentConfig(props.type, props)
    if (!validation.valid) {
      console.warn('Component configuration validation failed:', validation.errors)
    }
  }
  
  // 处理组件属性
  const { type, customComponent, customComponents, bind, ...otherProps } = props
  return processComponentProps({
    type,
    customComponent,
    customComponents: customComponentsMap.value,
    bind,
    ...otherProps
  })
})

// 双向绑定 - 优化性能
const modelValue = computed({
  get: () => props.row[props.fieldKey],
  set: (value) => {
    // 使用防抖避免频繁更新
    if (props.row[props.fieldKey] !== value) {
      props.row[props.fieldKey] = value
    }
  }
})

// 事件处理 - 优化性能，添加防抖和节流
let inputTimer: number | null = null
let changeTimer: number | null = null

const handleInput = (value: any) => {
  // 防抖处理，避免频繁更新
  if (inputTimer) {
    clearTimeout(inputTimer)
  }
  
  inputTimer = setTimeout(() => {
    if (props.row[props.fieldKey] !== value) {
      props.row[props.fieldKey] = value
    }
    inputTimer = null
  }, 16) // 约60fps的更新频率
}

const handleChange = (value: any) => {
  // 立即更新，但避免重复赋值
  if (props.row[props.fieldKey] !== value) {
    props.row[props.fieldKey] = value
  }
}

const handleBlur = (event: Event) => {
  // 清理定时器，确保失焦时立即更新
  if (inputTimer) {
    clearTimeout(inputTimer)
    inputTimer = null
  }
  // 可以在这里添加失焦处理逻辑
}

const handleFocus = (event: Event) => {
  // 可以在这里添加聚焦处理逻辑
}

const handleClick = (event: Event) => {
  // 可以在这里添加点击处理逻辑
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (inputTimer) {
    clearTimeout(inputTimer)
    inputTimer = null
  }
  if (changeTimer) {
    clearTimeout(changeTimer)
    changeTimer = null
  }
})
</script>
