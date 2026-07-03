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
      :key="getOptionKey(option, optionIndex, resolvedOptionProps)"
      :label="getOptionLabel(option, resolvedOptionProps)"
      :value="getOptionValue(option, resolvedOptionProps)"
      :disabled="getOptionDisabled(option, resolvedOptionProps)"
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
      :key="getOptionKey(option, optionIndex, resolvedOptionProps)"
      :label="getOptionValue(option, resolvedOptionProps)"
      :disabled="getOptionDisabled(option, resolvedOptionProps)"
    >
      {{ getOptionLabel(option, resolvedOptionProps) }}
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
      :key="getOptionKey(option, optionIndex, resolvedOptionProps)"
      :label="getOptionValue(option, resolvedOptionProps)"
      :disabled="getOptionDisabled(option, resolvedOptionProps)"
    >
      {{ getOptionLabel(option, resolvedOptionProps) }}
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
import { createFallbackFormTableActions } from './utils/actions'
import { processComponentProps } from './utils/componentProps'
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
  type ComponentBind,
  type CustomComponentsMap,
  type DispatchFn,
  type FormItemType,
  type FormTableActions,
  type FormItemOption,
  type FormTableBaseContext,
  type FormTableListenerArgs,
  type FormTableRecord,
  type FormTableValue
} from './types'

interface Props {
  type: FormItemType
  fieldKey: string
  row: FormTableRecord
  rowIndex: number
  customComponent?: string
  bind?: ComponentBind
  [key: string]: any
}

const props = defineProps<Props>()

const formTableContext = inject<ComputedRef<FormTableBaseContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ formData: {}, tableData: [] }))
)
const formTableActions = inject<FormTableActions>(FORM_TABLE_ACTIONS_KEY, createFallbackFormTableActions())
const customComponentsMap = inject<ComputedRef<CustomComponentsMap>>(FORM_TABLE_CUSTOM_COMPONENTS_KEY, computed(() => ({})))
const dispatch = inject<DispatchFn>(FORM_TABLE_DISPATCH_KEY)

// 底层组件和业务 listeners 共用同一份字段上下文，确保读到的是当前行、当前字段。
const runtimeContext = computed(() => createRuntimeContext(formTableContext.value, {
  row: props.row,
  index: props.rowIndex,
  fieldKey: props.fieldKey
}))

// 选项已经在 FormTableItem 中解析动态值，这里只兜底保证渲染层拿到数组。
const resolvedOptions = computed<FormItemOption[]>(() => {
  return Array.isArray(props.options) ? props.options : []
})

/**
 * 解析实际组件类型和最终渲染 props。
 *
 * listeners/formatter/emptyText 是 FormTable 控制字段，不能透传到底层组件。
 */
const resolved = computed(() => {
  const {
    type,
    customComponent,
    bind,
    options,
    optionProps,
    listeners,
    formatter,
    emptyText,
    ...otherProps
  } = props

  return processComponentProps({
    type,
    customComponent,
    customComponents: customComponentsMap.value,
    bind: props.bind || {},
    options: resolvedOptions.value,
    optionProps: props.optionProps,
    ...otherProps
  })
})

// select 和 tag-input 都使用 el-option 子节点，其余类型按各自模板分支处理。
const componentType = computed(() => resolved.value.componentType)
const componentProps = computed(() => resolved.value.componentProps)
const normalizedOptions = computed<FormItemOption[]>(() => resolvedOptions.value)
const isSelectLike = computed(() => props.type === 'select' || props.type === 'tag-input')

/**
 * 过滤只用于 FormTable 内部展示逻辑的字段，避免污染 Element UI 组件 props。
 */
const componentRenderProps = computed(() => {
  const { options, formatter, emptyText, optionProps, ...rest } = componentProps.value
  return rest
})

/**
 * text 类型的展示内容。
 */
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

const updateRow = (patch: Partial<FormTableRecord>) => {
  formTableActions.updateRow(props.rowIndex, patch)
}

const setValue = (value: FormTableValue) => {
  if (getValueByPath(props.row, props.fieldKey) !== value && dispatch) {
    dispatch('update:row', props.rowIndex, props.row, props.fieldKey, value)
  }
}

/**
 * 传给 component.listeners 的字段上下文。
 *
 * 业务 listener 可以读取当前值，也可以通过 setValue/updateRow 进入统一更新链路。
 */
const fieldContext = computed(() => ({
  ...runtimeContext.value,
  value: getValueByPath(props.row, props.fieldKey),
  setValue,
  updateRow
}))

/**
 * 将配置中的 listener 包装成 Vue 事件监听器。
 *
 * 底层组件原始事件参数会跟在字段上下文之后传给业务回调。
 */
const componentListeners = computed(() => {
  const listeners = props.listeners || {}
  return Object.keys(listeners).reduce<Record<string, (...args: FormTableListenerArgs) => void>>((acc, eventName) => {
    const listener = listeners[eventName]
    acc[eventName] = (...args: FormTableListenerArgs) => {
      listener?.(fieldContext.value, ...args)
    }
    return acc
  }, {})
})

/**
 * 底层组件 v-model 代理。
 *
 * set 时不直接改 row，而是交给主组件统一处理联动、事件和数据提交。
 */
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
