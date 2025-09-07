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

// 事件处理 - 优化性能
const handleInput = (value: any) => {
  if (props.row[props.fieldKey] !== value) {
    props.row[props.fieldKey] = value
  }
}

const handleChange = (value: any) => {
  if (props.row[props.fieldKey] !== value) {
    props.row[props.fieldKey] = value
  }
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
