<template>
  <el-row 
    :gutter="gutter" 
    :key="rowIndex" 
    v-bind="rowProps"
  >
    <el-col 
      v-for="(colItem, colIndex) in rowChildren"
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
        <!-- 简化的插槽传递 -->
        <slot v-bind="slotProps" />
      </FormTableItem>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue'
import FormTableItem from './FormTableItem.vue'
import type { RowConfig, TableRow } from './types'

interface Props {
  row: TableRow
  rowIndex: number
  rowConfig: RowConfig
}

const props = defineProps<Props>()
const attrs = useAttrs()

// 计算属性
const gutter = computed(() => {
  return props.rowConfig.gutter || props.rowConfig.bind?.gutter || 0
})

// 合并rowConfig的props和attrs，支持el-row的所有属性
const rowProps = computed(() => {
  return {
    ...props.rowConfig.bind,
    ...props.rowConfig.props,
    ...attrs
  }
})

const rowChildren = computed(() => {
  return props.rowConfig.children || []
})

// 简化的插槽props
const slotProps = computed(() => ({
  row: props.row,
  index: props.rowIndex
}))
</script>
