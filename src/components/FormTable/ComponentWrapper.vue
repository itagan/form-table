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

// 计算组件类型和属性
const componentConfig = computed(() => {
  // 验证配置
  const validation = validateComponentConfig(props.type, props)
  if (!validation.valid) {
    console.warn('Component configuration validation failed:', validation.errors)
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

const componentType = computed(() => componentConfig.value.componentType)
const componentProps = computed(() => componentConfig.value.componentProps)

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
