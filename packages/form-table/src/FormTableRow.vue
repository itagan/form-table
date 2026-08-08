<template>
  <el-row v-if="isVisible" v-bind="rowProps">
    <el-col
      v-for="(item, itemIndex) in visibleItems"
      :key="item.config.key || item.config.fieldKey || itemIndex"
      v-bind="item.colProps"
    >
      <FormTableItem
        :row="row"
        :row-index="rowIndex"
        :config="item.config"
      />
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { computed, inject, type ComputedRef } from 'vue'
import FormTableItem from './FormTableItem.vue'
import type { FormItemConfig, FormTableTableContext, RowConfig, TableRow } from './types'
import { FORM_TABLE_CONTEXT_KEY } from './types'
import {
  createFieldRenderContext,
  createRowContext,
  resolveDynamicValue,
  resolveVisible
} from './utils/dynamic'

const props = defineProps<{
  row: TableRow
  rowIndex: number
  rowConfig: RowConfig
}>()

const formTableContext = inject<ComputedRef<FormTableTableContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ tableData: [] }))
)
const rowContext = computed(() => createRowContext(
  formTableContext.value,
  props.row,
  props.rowIndex
))
const isVisible = computed(() => resolveVisible(props.rowConfig.visible, rowContext.value))
const rowProps = computed(() => resolveDynamicValue(props.rowConfig.props, rowContext.value) || {})
const visibleItems = computed(() => props.rowConfig.children.reduce<Array<{
  config: FormItemConfig
  colProps: Record<string, unknown>
}>>((items, config) => {
  const itemContext = createFieldRenderContext(rowContext.value, config.fieldKey)

  if (resolveVisible(config.visible, itemContext)) {
    items.push({
      config,
      colProps: resolveDynamicValue(config.colProps, itemContext) || { span: 24 }
    })
  }
  return items
}, []))
</script>
