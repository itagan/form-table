<template>
  <component
    :is="componentType"
    v-model="modelValue"
    v-bind="componentProps"
  />
</template>

<script lang="ts" setup>
import { computed, inject, type ComputedRef } from 'vue'
import { processComponentProps, validateComponentConfig } from './utils/componentProps'
import { FORM_TABLE_CUSTOM_COMPONENTS_KEY, FORM_TABLE_DISPATCH_KEY, type DispatchFn } from './types'

interface Props {
  type: string
  fieldKey: string
  row: Record<string, any>
  rowIndex: number
  customComponent?: string
  bind?: Record<string, any>
  [key: string]: any
}

const props = defineProps<Props>()

const customComponentsMap = inject<ComputedRef<Record<string, any>>>(FORM_TABLE_CUSTOM_COMPONENTS_KEY, computed(() => ({})))
const dispatch = inject<DispatchFn>(FORM_TABLE_DISPATCH_KEY)

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
        dispatch('update:row', props.rowIndex, props.row, props.fieldKey, value)
      } else {
        console.warn('[FormTable] dispatch not found, value update skipped.')
      }
    }
  }
})
</script>
