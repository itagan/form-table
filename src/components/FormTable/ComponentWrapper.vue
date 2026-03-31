<template>
  <component
    :is="componentType"
    v-model="modelValue"
    v-bind="componentProps"
  />
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import { processComponentProps, validateComponentConfig } from './utils/componentProps'

interface Props {
  type: string
  fieldKey: string
  row: Record<string, any>
  customComponent?: string
  bind?: Record<string, any>
  [key: string]: any
}

const props = defineProps<Props>()

const customComponentsMap = inject('customComponents', computed(() => ({} as Record<string, any>)))
const dispatch = inject<(type: string, ...args: any[]) => void>('dispatch')

const resolved = computed(() => {
  if (import.meta.env.DEV) {
    const validation = validateComponentConfig(props.type, props)
    if (!validation.valid) {
      console.warn('Component configuration validation failed:', validation.errors)
    }
  }

  const { type, customComponent, bind, ...otherProps } = props

  return processComponentProps({
    type,
    customComponent,
    customComponents: customComponentsMap.value,
    bind,
    ...otherProps
  })
})

const componentType = computed(() => resolved.value.componentType)
const componentProps = computed(() => resolved.value.componentProps)

const modelValue = computed({
  get: () => props.row[props.fieldKey],
  set: (value) => {
    if (props.row[props.fieldKey] !== value) {
      if (dispatch) {
        dispatch('update:row', props.row, props.fieldKey, value)
      } else {
        props.row[props.fieldKey] = value
      }
    }
  }
})
</script>
