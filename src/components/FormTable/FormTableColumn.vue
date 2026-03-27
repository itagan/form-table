<template>
  <el-table-column
    :label="column.name"
    :key="columnIndex"
    v-bind="columnAttrs"
  >
    <template v-slot="scope">
      <FormTableRow
        v-for="(rowItem, rowIndex) in column.children"
        :key="rowIndex"
        :row="scope.row"
        :row-index="scope.$index"
        :row-config="rowItem"
        v-memo="[scope.row, rowItem]"
      >
        <slot />
      </FormTableRow>
    </template>
  </el-table-column>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue'
import FormTableRow from './FormTableRow.vue'
import type { ColumnConfig } from './types'

interface Props {
  column: ColumnConfig
  columnIndex: number
}

const props = defineProps<Props>()
const attrs = useAttrs()

// 优化的columnAttrs计算属性 - 减少对象创建
const columnAttrs = computed(() => {
  const columnProps = props.column.props || {}
  const attrsObj = attrs || {}
  
  // 只有当属性真正存在时才合并，减少对象创建
  const result: Record<string, any> = {}
  
  if (Object.keys(columnProps).length > 0) {
    Object.assign(result, columnProps)
  }
  if (Object.keys(attrsObj).length > 0) {
    Object.assign(result, attrsObj)
  }
  
  return result
})

</script>
