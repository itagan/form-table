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
      v-memo="[colItem, row[colItem.key]]"
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

// 优化的rowProps计算属性 - 减少对象创建
const rowProps = computed(() => {
  const bind = props.rowConfig.bind || {}
  const configProps = props.rowConfig.props || {}
  const attrsObj = attrs || {}
  
  // 只有当属性真正存在时才合并，减少对象创建
  const result: Record<string, any> = {}
  
  if (Object.keys(bind).length > 0) {
    Object.assign(result, bind)
  }
  if (Object.keys(configProps).length > 0) {
    Object.assign(result, configProps)
  }
  if (Object.keys(attrsObj).length > 0) {
    Object.assign(result, attrsObj)
  }
  
  return result
})

// 优化的rowChildren计算属性 - 使用缓存避免重复计算
const rowChildren = computed(() => {
  const children = props.rowConfig.children
  return children && children.length > 0 ? children : []
})

// 优化的插槽props - 使用缓存避免重复创建
const slotProps = computed(() => {
  // 只有当row或index真正变化时才重新创建对象
  return {
    row: props.row,
    index: props.rowIndex
  }
})
</script>
