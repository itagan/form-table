<template>
  <el-row
    class="form-table-field-layout"
    v-bind="resolvedRowProps"
  >
    <el-col
      v-for="(item, itemIndex) in visibleItems"
      :key="item.config.key || `${item.config.fieldKey}:${itemIndex}`"
      v-bind="item.colProps"
    >
      <FormTableItem
        :row-context="rowContext"
        :config="item.config"
      />
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import FormTableItem from './FormTableItem.vue'
import type {
  FormItemConfig,
  FormTableColumnContext,
  FormTableRowContext,
  ComponentProps,
  DynamicValue,
  TableRow
} from './types'
import {
  createFieldRenderContext,
  createRowContext,
  resolveDynamicValue,
  resolveVisible
} from './utils/dynamic'

/** 当前数据行、扁平字段列表以及上级已解析的列上下文。 */
const props = defineProps<{
  row: TableRow
  rowIndex: number
  columnContext: FormTableColumnContext
  items: FormItemConfig[]
  rowProps?: DynamicValue<ComponentProps, FormTableRowContext>
}>()

/** 为当前数据行补充真实表格下标。 */
const rowContext = computed<FormTableRowContext>(() => createRowContext(
  props.columnContext,
  props.row,
  props.rowIndex
))

/** 默认使用支持换行的 Flex Row，调用方仍可通过 rowProps 显式覆盖。 */
const resolvedRowProps = computed(() => ({
  type: 'flex',
  ...(resolveDynamicValue(props.rowProps, rowContext.value) || {})
}))

// 在一次遍历中完成显隐过滤和栅格属性解析，模板不再重复执行动态回调。
const visibleItems = computed(() => props.items.reduce<Array<{
  config: FormItemConfig
  colProps: Record<string, unknown>
}>>((items, config) => {
  const itemContext = createFieldRenderContext(rowContext.value, config)

  if (resolveVisible(config.visible, itemContext)) {
    items.push({
      config,
      colProps: {
        span: 24,
        ...(resolveDynamicValue(config.colProps, itemContext) || {})
      }
    })
  }
  return items
}, []))
</script>
