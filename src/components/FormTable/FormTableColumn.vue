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
      >
        <!-- 简化的插槽传递 -->
        <slot v-bind="slotProps" />
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

// 合并column的props和attrs，支持el-table-column的所有属性
const columnAttrs = computed(() => {
  return {
    ...props.column.props,
    ...attrs
  }
})

// 简化的插槽props
const slotProps = computed(() => ({
  row: null, // 在FormTableRow中动态设置
  index: null
}))
</script>
