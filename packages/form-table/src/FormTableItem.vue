<template>
  <el-form-item v-bind="resolvedFormItemProps">
    <SlotRenderer
      v-if="renderMode === 'slot' && slotFn"
      :slot-fn="slotFn"
      :slot-props="slotContext"
    />
    <span v-else-if="renderMode === 'slot'" />
    <span v-else-if="renderMode === 'display'">{{ slotContext.value }}</span>
    <ComponentWrapper
      v-else
      :row="row"
      :row-index="rowIndex"
      :config="config"
      :render-mode="renderMode"
    />
  </el-form-item>
</template>

<script lang="ts" setup>
import { computed, defineComponent, h, inject, type ComputedRef, type PropType } from 'vue'
import ComponentWrapper from './ComponentWrapper.vue'
import type {
  FormItemConfig,
  FormTableTableContext,
  FormTableSlotContext,
  FormTableSlotFn,
  FormTableSlots,
  FormTableUpdateApi,
  TableRow
} from './types'
import {
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_SLOTS_KEY,
  FORM_TABLE_UPDATE_KEY
} from './types'
import {
  createFieldRenderContext,
  createRowContext,
  resolveDynamicValue
} from './utils/dynamic'
import { getValueByPath } from './utils/path'
import {
  resolveFieldRenderMode,
  warnFieldRenderConflict
} from './utils/renderMode'

const SlotRenderer = defineComponent({
  props: {
    slotFn: { type: Function as PropType<FormTableSlotFn>, required: true },
    slotProps: { type: Object as PropType<FormTableSlotContext>, required: true }
  },
  setup(props) {
    return () => h('div', { class: 'form-table-slot' }, props.slotFn(props.slotProps))
  }
})

const props = defineProps<{
  row: TableRow
  rowIndex: number
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
  createRowContext(formTableContext.value, props.row, props.rowIndex),
  props.config.fieldKey
))
const renderMode = computed(() => {
  warnFieldRenderConflict(props.config)
  return resolveFieldRenderMode(props.config)
})
const resolvedFormItemProps = computed(() => ({
  ...(resolveDynamicValue(props.config.formItemProps, runtimeContext.value) || {}),
  prop: propPath.value
}))
const slotFn = computed(() => props.config.slot
  ? parentSlots[props.config.slot] || null
  : null)
const setValue = (value: unknown) => updateApi?.setValue(props.rowIndex, props.config.fieldKey, value)
const updateRow = (patch: Partial<TableRow>) => updateApi?.updateRow(props.rowIndex, patch)
const slotContext = computed<FormTableSlotContext>(() => ({
  ...runtimeContext.value,
  propPath: propPath.value,
  value: getValueByPath(props.row, props.config.fieldKey),
  setValue,
  updateRow
}))
</script>
