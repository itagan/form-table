<template>
  <el-row
    v-if="isVisible"
    :gutter="gutter"
    v-bind="rowProps"
  >
    <el-col
      v-for="(colItem, colIndex) in visibleItems"
      :key="colItem.key || colIndex"
      :span="colItem.colSpan || 24"
      v-bind="colItem.colProps"
    >
      <!-- 统一的字段渲染 -->
      <FormTableItem
        :prop-path="`tableData.${rowIndex}.${colItem.key}`"
        :rules="colItem.rules"
        :label="colItem.label"
        :label-width="colItem.labelWidth"
        :is-use-tooltip="colItem.isUseTooltip"
        :tooltip-props="colItem.tooltipProps"
        :row="row"
        :index="rowIndex"
        :config="colItem"
      >
        <slot />
      </FormTableItem>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
/**
 * FormTableRow - 行布局渲染
 *
 * 对应 el-row，将 rowConfig.children 中的每个 FormItemConfig 渲染为 el-col + FormTableItem
 * gutter 优先取 rowConfig.gutter，其次取 rowConfig.bind.gutter
 */
import { computed, inject, type ComputedRef } from 'vue'
import FormTableItem from './FormTableItem.vue'
import type { FormItemConfig, FormTableBaseContext, RowConfig, TableRow } from './types'
import { FORM_TABLE_CONTEXT_KEY } from './types'
import { createRuntimeContext, resolveVisible } from './utils/dynamic'

const props = defineProps<{
  row: TableRow
  rowIndex: number
  rowConfig: RowConfig
}>()

const formTableContext = inject<ComputedRef<FormTableBaseContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ formData: {}, tableData: [] }))
)

const runtimeContext = computed(() => createRuntimeContext(formTableContext.value, {
  row: props.row,
  index: props.rowIndex
}))

const isVisible = computed(() => resolveVisible(props.rowConfig.visible, runtimeContext.value))
const gutter = computed(() => props.rowConfig.gutter || props.rowConfig.bind?.gutter || 0)

const rowProps = computed(() => ({
  ...props.rowConfig.bind,
  ...props.rowConfig.props
}))

const visibleItems = computed<FormItemConfig[]>(() => {
  return props.rowConfig.children.filter((item) => {
    return resolveVisible(item.visible, createRuntimeContext(formTableContext.value, {
      row: props.row,
      index: props.rowIndex,
      fieldKey: item.key
    }))
  })
})
</script>
