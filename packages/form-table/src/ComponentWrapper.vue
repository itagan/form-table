<template>
  <span v-if="config.type === 'text'">{{ value }}</span>

  <component
    v-else-if="isSelectLike"
    :is="resolvedComponent"
    v-model="modelValue"
    v-bind="componentProps"
    v-on="componentListeners"
  >
    <el-option
      v-for="(option, optionIndex) in options"
      :key="getOptionKey(option, optionIndex, optionProps)"
      :label="getOptionLabel(option, optionProps)"
      :value="getOptionValue(option, optionProps)"
      :disabled="getOptionDisabled(option, optionProps)"
    />
  </component>

  <component
    v-else-if="config.type === 'radio'"
    :is="resolvedComponent"
    v-model="modelValue"
    v-bind="componentProps"
    v-on="componentListeners"
  >
    <el-radio
      v-for="(option, optionIndex) in options"
      :key="getOptionKey(option, optionIndex, optionProps)"
      :label="getOptionValue(option, optionProps)"
      :disabled="getOptionDisabled(option, optionProps)"
    >
      {{ getOptionLabel(option, optionProps) }}
    </el-radio>
  </component>

  <component
    v-else-if="config.type === 'checkbox'"
    :is="resolvedComponent"
    v-model="modelValue"
    v-bind="componentProps"
    v-on="componentListeners"
  >
    <el-checkbox
      v-for="(option, optionIndex) in options"
      :key="getOptionKey(option, optionIndex, optionProps)"
      :label="getOptionValue(option, optionProps)"
      :disabled="getOptionDisabled(option, optionProps)"
    >
      {{ getOptionLabel(option, optionProps) }}
    </el-checkbox>
  </component>

  <component
    v-else
    :is="resolvedComponent"
    v-model="modelValue"
    v-bind="componentProps"
    v-on="componentListeners"
  />
</template>

<script lang="ts" setup>
import { computed, inject, type ComputedRef } from 'vue'
import { getComponentType, getRequiredProps } from './configs/defaultComponentConfigs'
import type {
  FormItemConfig,
  FormItemOption,
  FormTableState,
  FormTableFieldContext,
  FormTableUpdateApi,
  OptionPropsConfig,
  TableRow
} from './types'
import { FORM_TABLE_CONTEXT_KEY, FORM_TABLE_UPDATE_KEY } from './types'
import {
  getOptionDisabled,
  getOptionKey,
  getOptionLabel,
  getOptionValue
} from './utils/display'
import { createRuntimeContext, resolveDynamicValue } from './utils/dynamic'
import { getValueByPath } from './utils/path'

const props = defineProps<{
  row: TableRow
  rowIndex: number
  config: FormItemConfig
}>()

const formTableContext = inject<ComputedRef<FormTableState>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ tableData: [] }))
)
const updateApi = inject<FormTableUpdateApi>(FORM_TABLE_UPDATE_KEY)
const runtimeContext = computed(() => createRuntimeContext(formTableContext.value, {
  row: props.row,
  index: props.rowIndex,
  fieldKey: props.config.key
}))
const resolvedComponent = computed(() => {
  return props.config.component?.is || (props.config.type ? getComponentType(props.config.type) : 'span')
})
const componentProps = computed(() => ({
  ...(props.config.type ? getRequiredProps(props.config.type) : {}),
  ...(resolveDynamicValue(props.config.component?.props, runtimeContext.value) || {})
}))
const options = computed<FormItemOption[]>(() => {
  return resolveDynamicValue(props.config.component?.options, runtimeContext.value) || []
})
const optionProps = computed<OptionPropsConfig | undefined>(() => {
  return resolveDynamicValue(props.config.component?.optionProps, runtimeContext.value)
})
const value = computed(() => getValueByPath(props.row, props.config.key))
const setValue = (nextValue: unknown) => updateApi?.setValue(props.rowIndex, props.config.key, nextValue)
const updateRow = (patch: Partial<TableRow>) => updateApi?.updateRow(props.rowIndex, patch)
const fieldContext = computed<FormTableFieldContext>(() => ({
  ...runtimeContext.value,
  value: value.value,
  setValue,
  updateRow
}))
const componentListeners = computed(() => {
  const listeners = props.config.component?.listeners || {}
  return Object.keys(listeners).reduce<Record<string, (...args: unknown[]) => void>>((result, name) => {
    result[name] = (...args) => listeners[name]?.(fieldContext.value, ...args)
    return result
  }, {})
})
const modelValue = computed({
  get: () => value.value,
  set: setValue
})
const isSelectLike = computed(() => props.config.type === 'select' || props.config.type === 'tag-input')
</script>
