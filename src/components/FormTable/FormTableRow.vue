<template>
  <el-row
    :gutter="gutter"
    :key="rowIndex"
    v-bind="rowProps"
  >
    <el-col
      v-for="(colItem, colIndex) in rowConfig.children"
      :key="colIndex"
      :span="colItem.colSpan || 24"
      v-bind="colItem.bind"
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
import { computed } from 'vue'
import FormTableItem from './FormTableItem.vue'
import type { RowConfig, TableRow } from './types'

const props = defineProps<{
  row: TableRow
  rowIndex: number
  rowConfig: RowConfig
}>()

const gutter = computed(() => props.rowConfig.gutter || props.rowConfig.bind?.gutter || 0)

const rowProps = computed(() => ({
  ...props.rowConfig.bind,
  ...props.rowConfig.props
}))
</script>
