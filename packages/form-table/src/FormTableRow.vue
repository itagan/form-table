<template>
  <el-row v-if="isVisible" v-bind="rowProps">
    <el-col
      v-for="(item, itemIndex) in visibleItems"
      :key="item.config.key || itemIndex"
      v-bind="item.colProps"
    >
      <FormTableItem
        :row="row"
        :row-index="rowIndex"
        :config="item.config"
      />
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { computed, inject, type ComputedRef } from 'vue'
import FormTableItem from './FormTableItem.vue'
import type { FormItemConfig, FormTableState, RowConfig, TableRow } from './types'
import { FORM_TABLE_CONTEXT_KEY } from './types'
import { createRuntimeContext, resolveDynamicValue, resolveVisible } from './utils/dynamic'

const props = defineProps<{
  row: TableRow
  rowIndex: number
  rowConfig: RowConfig
}>()

const formTableContext = inject<ComputedRef<FormTableState>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ tableData: [] }))
)
const rowContext = computed(() => createRuntimeContext(formTableContext.value, {
  row: props.row,
  index: props.rowIndex
}))
const isVisible = computed(() => resolveVisible(props.rowConfig.visible, rowContext.value))
const rowProps = computed(() => resolveDynamicValue(props.rowConfig.props, rowContext.value) || {})
const visibleItems = computed(() => props.rowConfig.children.reduce<Array<{
  config: FormItemConfig
  colProps: Record<string, unknown>
}>>((items, config) => {
  const itemContext = createRuntimeContext(formTableContext.value, {
    row: props.row,
    index: props.rowIndex,
    fieldKey: config.key
  })

  if (resolveVisible(config.visible, itemContext)) {
    items.push({
      config,
      colProps: resolveDynamicValue(config.colProps, itemContext) || { span: 24 }
    })
  }
  return items
}, []))
</script>
