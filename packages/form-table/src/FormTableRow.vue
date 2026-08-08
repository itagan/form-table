<template>
  <el-row v-if="isVisible" v-bind="rowProps">
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
  RowConfig,
  TableRow
} from './types'
import {
  createFieldRenderContext,
  createRowContext,
  resolveDynamicValue,
  resolveVisible
} from './utils/dynamic'

/** 当前数据行、布局行配置以及上级已解析的列上下文。 */
const props = defineProps<{
  row: TableRow
  rowIndex: number
  columnContext: FormTableColumnContext
  rowConfig: RowConfig
}>()

/** 为当前数据行补充真实表格下标和布局配置。 */
const rowContext = computed<FormTableRowContext>(() => createRowContext(
  props.columnContext,
  props.row,
  props.rowIndex,
  props.rowConfig
))

/** 控制整个布局行是否渲染。 */
const isVisible = computed(() => resolveVisible(props.rowConfig.visible, rowContext.value))

/** 解析透传给 el-row 的静态或动态属性。 */
const rowProps = computed(() => resolveDynamicValue(props.rowConfig.props, rowContext.value) || {})

// 在一次遍历中完成显隐过滤和栅格属性解析，模板不再重复执行动态回调。
const visibleItems = computed(() => props.rowConfig.children.reduce<Array<{
  config: FormItemConfig
  colProps: Record<string, unknown>
}>>((items, config) => {
  const itemContext = createFieldRenderContext(rowContext.value, config)

  if (resolveVisible(config.visible, itemContext)) {
    items.push({
      config,
      colProps: resolveDynamicValue(config.colProps, itemContext) || { span: 24 }
    })
  }
  return items
}, []))
</script>
