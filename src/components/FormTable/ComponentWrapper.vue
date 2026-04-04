<template>
  <span v-if="type === 'text'" v-bind="componentRenderProps">
    {{ textContent }}
  </span>

  <component
    v-else-if="isSelectLike"
    :is="componentType"
    v-model="modelValue"
    v-bind="componentRenderProps"
    v-on="componentListeners"
  >
    <el-option
      v-for="(option, optionIndex) in normalizedOptions"
      :key="getOptionKey(option, optionIndex, props.optionProps)"
      :label="getOptionLabel(option, props.optionProps)"
      :value="getOptionValue(option, props.optionProps)"
      :disabled="getOptionDisabled(option, props.optionProps)"
    />
  </component>

  <component
    v-else-if="type === 'radio'"
    :is="componentType"
    v-model="modelValue"
    v-bind="componentRenderProps"
    v-on="componentListeners"
  >
    <el-radio
      v-for="(option, optionIndex) in normalizedOptions"
      :key="getOptionKey(option, optionIndex, props.optionProps)"
      :label="getOptionValue(option, props.optionProps)"
      :disabled="getOptionDisabled(option, props.optionProps)"
    >
      {{ getOptionLabel(option, props.optionProps) }}
    </el-radio>
  </component>

  <component
    v-else-if="type === 'checkbox'"
    :is="componentType"
    v-model="modelValue"
    v-bind="componentRenderProps"
    v-on="componentListeners"
  >
    <el-checkbox
      v-for="(option, optionIndex) in normalizedOptions"
      :key="getOptionKey(option, optionIndex, props.optionProps)"
      :label="getOptionValue(option, props.optionProps)"
      :disabled="getOptionDisabled(option, props.optionProps)"
    >
      {{ getOptionLabel(option, props.optionProps) }}
    </el-checkbox>
  </component>

  <component
    v-else
    :is="componentType"
    v-model="modelValue"
    v-bind="componentRenderProps"
    v-on="componentListeners"
  />
</template>

<script lang="ts" setup>
/**
 * ComponentWrapper - 动态组件渲染器
 *
 * 根据 type 解析为对应的 Element 组件，通过 v-model 双向绑定行数据。
 * 支持 input/select/date 等内置类型，也支持通过 customComponent 注入自定义组件。
 *
 * v-model 数据流:
 *   get → row[fieldKey] 读取当前值
 *   set → dispatch('update:row', rowIndex, row, fieldKey, newValue) 触发父组件更新
 */
import { computed, inject, type ComputedRef } from 'vue'
import { processComponentProps, validateComponentConfig } from './utils/componentProps'
import { createRuntimeContext } from './utils/dynamic'
import {
  getOptionDisabled,
  getOptionKey,
  getOptionLabel,
  getOptionValue,
  resolveDisplayValue
} from './utils/display'
import { getValueByPath } from './utils/path'
import {
  FORM_TABLE_ACTIONS_KEY,
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_CUSTOM_COMPONENTS_KEY,
  FORM_TABLE_DISPATCH_KEY,
  type DispatchFn,
  type FormTableActions,
  type FormItemOption,
  type FormTableBaseContext
} from './types'

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

const formTableContext = inject<ComputedRef<FormTableBaseContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ formData: {}, tableData: [] }))
)
const formTableActions = inject<FormTableActions>(FORM_TABLE_ACTIONS_KEY, {
  addRow: () => undefined,
  insertRow: () => undefined,
  copyRow: () => undefined,
  updateRow: () => undefined,
  removeRow: () => undefined,
  moveRow: () => undefined,
  getRow: () => undefined,
  getRowFieldProps: () => [],
  validateField: async () => true,
  validateRow: async () => true,
  clearValidate: () => undefined,
  clearRowValidate: () => undefined
})
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
const normalizedOptions = computed<FormItemOption[]>(() => (Array.isArray(props.options) ? props.options : []))
const isSelectLike = computed(() => props.type === 'select' || props.type === 'tag-input')
const runtimeContext = computed(() => createRuntimeContext(formTableContext.value, {
  row: props.row,
  index: props.rowIndex,
  fieldKey: props.fieldKey
}))
const componentRenderProps = computed(() => {
  const { options, formatter, emptyText, optionProps, ...rest } = componentProps.value
  return rest
})
const textContent = computed(() => {
  return resolveDisplayValue(
    getValueByPath(props.row, props.fieldKey),
    normalizedOptions.value,
    props.optionProps,
    props.formatter,
    props.emptyText,
    runtimeContext.value
  )
})
const updateRow = (patch: Record<string, any>) => {
  formTableActions.updateRow(props.rowIndex, patch)
}
const setValue = (value: any) => {
  if (getValueByPath(props.row, props.fieldKey) !== value && dispatch) {
    dispatch('update:row', props.rowIndex, props.row, props.fieldKey, value)
  }
}
const fieldContext = computed(() => ({
  ...runtimeContext.value,
  value: getValueByPath(props.row, props.fieldKey),
  setValue,
  updateRow
}))
const componentListeners = computed(() => {
  const listeners = props.listeners || {}
  return Object.keys(listeners).reduce<Record<string, (...args: any[]) => void>>((acc, eventName) => {
    const listener = listeners[eventName]
    acc[eventName] = (...args: any[]) => {
      listener?.(fieldContext.value, ...args)
    }
    return acc
  }, {})
})

const modelValue = computed({
  get: () => getValueByPath(props.row, props.fieldKey),
  set: (value) => {
    if (getValueByPath(props.row, props.fieldKey) !== value) {
      if (dispatch) {
        dispatch('update:row', props.rowIndex, props.row, props.fieldKey, value)
      } else {
        console.warn('[FormTable] dispatch not found, value update skipped.')
      }
    }
  }
})
</script>
