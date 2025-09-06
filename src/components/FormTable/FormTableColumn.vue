<template>
  <el-table-column
    :label="column.name"
    :key="columnIndex"
    v-bind="column.props"
  >
    <template v-slot="scope">

      <FormTableRow
        v-for="(rowItem, rowIndex) in column.children"
        :key="rowIndex"
        :row="scope.row"
        :row-index="scope.$index"
        :row-config="rowItem"
      >
        <!-- 动态传递所有具名插槽 -->
        <template v-for="(_, slotName) in $slots" v-slot:[slotName]="slotProps">
          <slot :name="slotName" v-bind="slotProps" />
        </template>
      </FormTableRow>
    </template>
  </el-table-column>
</template>

<script lang="ts" setup>
import FormTableRow from './FormTableRow.vue'
import type { ColumnConfig } from './types'

interface Props {
  column: ColumnConfig
  columnIndex: number
}

defineProps<Props>()
</script>
