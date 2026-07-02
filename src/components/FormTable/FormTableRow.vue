<template>
  <el-row
    v-if="isVisible"
    :gutter="gutter"
    v-bind="rowProps"
  >
    <el-col
      v-for="(itemEntry, colIndex) in visibleItems"
      :key="itemEntry.config.key || colIndex"
      :span="itemEntry.span"
      v-bind="itemEntry.colProps"
    >
      <!-- 统一的字段渲染 -->
      <FormTableItem
        :prop-path="`tableData.${rowIndex}.${itemEntry.config.key}`"
        :rules="itemEntry.config.rules"
        :label="itemEntry.config.label"
        :label-width="itemEntry.config.labelWidth"
        :row="row"
        :index="rowIndex"
        :config="itemEntry.config"
      >
        <slot />
      </FormTableItem>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
/**
 * FormTableRow - 行布局渲染
 *
 * 对应 el-row，将 rowConfig.children 中的每个 FormItemConfig 渲染为 el-col + FormTableItem
 * gutter 优先取 rowConfig.gutter，其次取 rowConfig.bind.gutter
 */
import { computed, inject, type ComputedRef } from 'vue'
import FormTableItem from './FormTableItem.vue'
import type { FormItemConfig, FormTableBaseContext, RowConfig, TableRow } from './types'
import { FORM_TABLE_CONTEXT_KEY } from './types'
import { createRuntimeContext, resolveDynamicValue, resolveVisible } from './utils/dynamic'
import {
  getFormItemColSpan,
  resolveFormItemColProps,
  resolveFormItemVisible
} from './utils/fieldConfig'

const props = defineProps<{
  row: TableRow
  rowIndex: number
  rowConfig: RowConfig
}>()

const formTableContext = inject<ComputedRef<FormTableBaseContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ formData: {}, tableData: [] }))
)

const runtimeContext = computed(() => createRuntimeContext(formTableContext.value, {
  row: props.row,
  index: props.rowIndex
}))

const isVisible = computed(() => resolveVisible(props.rowConfig.visible, runtimeContext.value))
const resolvedRowBind = computed<Record<string, any>>(() => {
  return resolveDynamicValue(props.rowConfig.bind, runtimeContext.value) || {}
})
const resolvedRowProps = computed<Record<string, any>>(() => {
  return resolveDynamicValue(props.rowConfig.props, runtimeContext.value) || {}
})
const gutter = computed(() => props.rowConfig.gutter || resolvedRowBind.value.gutter || 0)

const rowProps = computed(() => ({
  ...resolvedRowBind.value,
  ...resolvedRowProps.value
}))

const visibleItems = computed<Array<{
  config: FormItemConfig
  span: number | string
  colProps?: Record<string, any>
}>>(() => {
  return props.rowConfig.children.reduce<Array<{
    config: FormItemConfig
    span: number | string
    colProps?: Record<string, any>
  }>>((items, item) => {
    const itemContext = createRuntimeContext(formTableContext.value, {
      row: props.row,
      index: props.rowIndex,
      fieldKey: item.key
    })

    if (!resolveFormItemVisible(item, itemContext)) {
      return items
    }

    items.push({
      config: item,
      span: getFormItemColSpan(item),
      colProps: resolveFormItemColProps(item, itemContext)
    })

    return items
  }, [])
})
</script>
