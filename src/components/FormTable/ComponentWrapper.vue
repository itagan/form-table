<template>
  <component
    :is="componentType"
    v-model="modelValue"
    v-bind="componentProps"
  />
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import { getComponentType } from './configs/defaultComponentConfigs'
import { processComponentProps, validateComponentConfig } from './utils/componentProps'

interface Props {
  type: string
  fieldKey: string
  row: Record<string, any>
  customComponent?: string
  customComponents?: Record<string, any>
  bind?: Record<string, any>
  [key: string]: any
}

const props = defineProps<Props>()

const injectedComponents = inject('customComponents', computed(() => ({} as Record<string, any>)))

const customComponentsMap = computed(() => {
  return props.customComponents || injectedComponents.value
})

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
  if (import.meta.env.DEV) {
    const validation = validateComponentConfig(props.type, props)
    if (!validation.valid) {
      console.warn('Component configuration validation failed:', validation.errors)
    }
  }

  const { type, customComponent, customComponents, bind, ...otherProps } = props

  return processComponentProps({
    type,
    customComponent,
    customComponents: customComponentsMap.value,
    bind,
    ...otherProps
  }).componentProps
})

const modelValue = computed({
  get: () => props.row[props.fieldKey],
  set: (value) => {
    if (props.row[props.fieldKey] !== value) {
      props.row[props.fieldKey] = value
    }
  }
})
</script>
