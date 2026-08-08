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
  BuiltinFormItemType,
  ColumnConfig,
  FormItemConfig,
  FormItemOption,
  FormTableTableContext,
  FormTableFieldContext,
  FormTableUpdateApi,
  OptionPropsConfig,
  RowConfig,
  TableRow
} from './types'
import { FORM_TABLE_CONTEXT_KEY, FORM_TABLE_UPDATE_KEY } from './types'
import {
  getOptionDisabled,
  getOptionKey,
  getOptionLabel,
  getOptionValue
} from './utils/display'
import {
  createColumnContext,
  createFieldRenderContext,
  createRowContext,
  resolveDynamicValue
} from './utils/dynamic'

const props = defineProps<{
  row: TableRow
  rowIndex: number
  columnConfig: ColumnConfig
  rowConfig: RowConfig
  config: FormItemConfig
}>()

const formTableContext = inject<ComputedRef<FormTableTableContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ tableData: [] }))
)
const updateApi = inject<FormTableUpdateApi>(FORM_TABLE_UPDATE_KEY)
const runtimeContext = computed(() => createFieldRenderContext(
  createRowContext(
    createColumnContext(formTableContext.value, props.columnConfig),
    props.row,
    props.rowIndex,
    props.rowConfig
  ),
  props.config
))
const builtinType = computed<BuiltinFormItemType | null>(() => {
  return props.config.type === 'component' || props.config.type === 'slot'
    ? null
    : props.config.type
})
const resolvedComponent = computed(() => {
  if (props.config.type === 'component') return props.config.component.renderer
  return builtinType.value ? getComponentType(builtinType.value) : 'span'
})
const componentProps = computed(() => ({
  ...(builtinType.value ? getRequiredProps(builtinType.value) : {}),
  ...(resolveDynamicValue(props.config.component?.props, runtimeContext.value) || {})
}))
const options = computed<FormItemOption[]>(() => {
  return resolveDynamicValue(props.config.component?.options, runtimeContext.value) || []
})
const optionProps = computed<OptionPropsConfig | undefined>(() => {
  return resolveDynamicValue(props.config.component?.optionProps, runtimeContext.value)
})
const value = computed(() => runtimeContext.value.value)
const setValue = (nextValue: unknown) => updateApi?.setValue(
  props.row,
  props.rowIndex,
  props.config.fieldKey,
  nextValue
)
const fieldContext = computed<FormTableFieldContext>(() => {
  const targetRow = props.row
  const targetIndex = props.rowIndex
  const targetFieldKey = props.config.fieldKey
  return {
    ...runtimeContext.value,
    value: value.value,
    setValue: nextValue => updateApi?.setValue(targetRow, targetIndex, targetFieldKey, nextValue),
    updateRow: patch => updateApi?.updateRow(targetRow, targetIndex, patch)
  }
})
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
