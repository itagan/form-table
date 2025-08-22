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
        <!-- 直接传递具名插槽 -->
        <template #table-school="slotProps">
          <slot name="table-school" v-bind="slotProps" />
        </template>
        <template #table-gender="slotProps">
          <slot name="table-gender" v-bind="slotProps" />
        </template>
        <template #table-actions="slotProps">
          <slot name="table-actions" v-bind="slotProps" />
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
