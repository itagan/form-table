<template>
  <el-form-item v-bind="resolvedFormItemProps">
    <SlotRenderer
      v-if="renderMode === 'slot' && slotFn"
      :slot-fn="slotFn"
      :slot-context="slotContext"
    />
    <span v-else-if="renderMode === 'slot'" />
    <span v-else-if="renderMode === 'display'">{{ slotContext.value }}</span>
    <ComponentWrapper
      v-else
      :row="row"
      :row-index="rowIndex"
      :column-config="columnConfig"
      :row-config="rowConfig"
      :config="config"
    />
  </el-form-item>
</template>

<script lang="ts" setup>
import { computed, defineComponent, h, inject, type ComputedRef, type PropType } from 'vue'
import ComponentWrapper from './ComponentWrapper.vue'
import type {
  ColumnConfig,
  FormItemConfig,
  FormItemOption,
  FormTableFieldContext,
  FormTableTableContext,
  FormTableSlotContext,
  FormTableSlotFn,
  FormTableSlots,
  FormTableUpdateApi,
  OptionPropsConfig,
  ResolvedComponentConfig,
  RowConfig,
  TableRow
} from './types'
import {
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_SLOTS_KEY,
  FORM_TABLE_UPDATE_KEY
} from './types'
import {
  createColumnContext,
  createFieldRenderContext,
  createRowContext,
  resolveDynamicValue
} from './utils/dynamic'
import { resolveFieldRenderMode } from './utils/renderMode'

const SlotRenderer = defineComponent({
  props: {
    slotFn: { type: Function as PropType<FormTableSlotFn>, required: true },
    slotContext: { type: Object as PropType<FormTableSlotContext>, required: true }
  },
  setup(props) {
    return () => h('div', { class: 'form-table-slot' }, props.slotFn(props.slotContext))
  }
})

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
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, {})
const propPath = computed(() => `tableData.${props.rowIndex}.${props.config.fieldKey}`)
const runtimeContext = computed(() => createFieldRenderContext(
  createRowContext(
    createColumnContext(formTableContext.value, props.columnConfig),
    props.row,
    props.rowIndex,
    props.rowConfig
  ),
  props.config
))
const renderMode = computed(() => resolveFieldRenderMode(props.config))
const resolvedFormItemProps = computed(() => ({
  ...(resolveDynamicValue(props.config.formItemProps, runtimeContext.value) || {}),
  prop: propPath.value
}))
const slotFn = computed(() => props.config.type === 'slot'
  ? parentSlots[props.config.component.renderer] || null
  : null)
const value = computed(() => runtimeContext.value.value)
const setValue = (value: unknown) => updateApi?.setValue(props.rowIndex, props.config.fieldKey, value)
const updateRow = (patch: Partial<TableRow>) => updateApi?.updateRow(props.rowIndex, patch)
const fieldContext = computed<FormTableFieldContext>(() => ({
  ...runtimeContext.value,
  value: value.value,
  setValue,
  updateRow
}))
const resolvedComponent = computed<ResolvedComponentConfig>(() => {
  const component = props.config.component
  const listeners = component?.listeners || {}
  const resolvedListeners = Object.keys(listeners).reduce<Record<string, (...args: unknown[]) => void>>((result, name) => {
    result[name] = (...args) => listeners[name]?.(fieldContext.value, ...args)
    return result
  }, {})

  return {
    renderer: component?.renderer,
    props: resolveDynamicValue(component?.props, runtimeContext.value) || {},
    listeners: resolvedListeners,
    options: resolveDynamicValue(component?.options, runtimeContext.value) as FormItemOption[] || [],
    optionProps: resolveDynamicValue(component?.optionProps, runtimeContext.value) as OptionPropsConfig | undefined
  }
})
const slotContext = computed<FormTableSlotContext>(() => ({
  ...fieldContext.value,
  propPath: propPath.value,
  component: resolvedComponent.value
}))
</script>
