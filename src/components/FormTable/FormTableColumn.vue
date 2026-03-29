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
import { extractColumnAttrs } from './utils/attrs'

interface Props {
  column: ColumnConfig
  columnIndex: number
}

const props = defineProps<Props>()
const attrs = useAttrs()

const columnAttrs = computed(() => ({
  ...extractColumnAttrs(attrs),
  ...(props.column.props || {})
}))
</script>
