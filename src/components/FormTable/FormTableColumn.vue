<template>
  <el-table-column
    :label="column.name"
    v-bind="columnAttrs"
  >
    <template v-slot="scope">
      <FormTableRow
        v-for="(rowItem, rowIndex) in column.children"
        :key="getRowKey(rowItem, rowIndex)"
        :row="scope.row"
        :row-index="scope.$index"
        :row-config="rowItem"
      >
        <slot />
      </FormTableRow>
    </template>
  </el-table-column>
</template>

<script lang="ts" setup>
/**
 * FormTableColumn - 列渲染
 *
 * 对应 el-table-column，在每个表格单元格的 scoped slot 中
 * 按 column.children 渲染多行 FormTableRow 布局
 */
import { computed, inject, type ComputedRef, useAttrs } from 'vue'
import FormTableRow from './FormTableRow.vue'
import type { ColumnConfig, FormTableBaseContext } from './types'
import { FORM_TABLE_CONTEXT_KEY } from './types'
import { extractColumnAttrs } from './utils/attrs'
import { createRuntimeContext, resolveDynamicValue } from './utils/dynamic'

interface Props {
  column: ColumnConfig
  columnIndex: number
}

const props = defineProps<Props>()
const attrs = useAttrs()
const formTableContext = inject<ComputedRef<FormTableBaseContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ formData: {}, tableData: [] }))
)

const runtimeContext = computed(() => createRuntimeContext(formTableContext.value))

const columnAttrs = computed(() => ({
  ...extractColumnAttrs(attrs),
  ...(resolveDynamicValue(props.column.props, runtimeContext.value) || {})
}))

const getRowKey = (row: ColumnConfig['children'][number], index: number) => {
  const rowProps = resolveDynamicValue(row.props, runtimeContext.value) || {}
  return row.key || rowProps.key || index
}
</script>
