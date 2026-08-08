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
        :column-config="columnConfig"
        :row-config="rowConfig"
        :config="item.config"
      />
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { computed, inject, type ComputedRef } from 'vue'
import FormTableItem from './FormTableItem.vue'
import type { ColumnConfig, FormItemConfig, FormTableTableContext, RowConfig, TableRow } from './types'
import { FORM_TABLE_CONTEXT_KEY } from './types'
import {
  createColumnContext,
  createFieldRenderContext,
  createRowContext,
  resolveDynamicValue,
  resolveVisible
} from './utils/dynamic'

const props = defineProps<{
  row: TableRow
  rowIndex: number
  columnConfig: ColumnConfig
  rowConfig: RowConfig
}>()

const formTableContext = inject<ComputedRef<FormTableTableContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ tableData: [] }))
)
const rowContext = computed(() => createRowContext(
  createColumnContext(formTableContext.value, props.columnConfig),
  props.row,
  props.rowIndex,
  props.rowConfig
))
const isVisible = computed(() => resolveVisible(props.rowConfig.visible, rowContext.value))
const rowProps = computed(() => resolveDynamicValue(props.rowConfig.props, rowContext.value) || {})
const visibleItems = computed(() => props.rowConfig.children.reduce<Array<{
  config: FormItemConfig
  colProps: Record<string, unknown>
}>>((items, config) => {
  const itemContext = createFieldRenderContext(rowContext.value, config)

  if (resolveVisible(config.visible, itemContext)) {
    items.push({
      config,
      colProps: resolveDynamicValue(config.colProps, itemContext) || { span: 24 }
    })
  }
  return items
}, []))
</script>
