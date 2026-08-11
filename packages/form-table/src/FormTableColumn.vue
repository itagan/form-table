<template>
  <el-table-column
    v-if="isNativeColumn"
    :label="column.label"
    v-bind="columnProps"
  />

  <el-table-column
    v-else
    :label="column.label"
    v-bind="columnProps"
  >
    <template v-if="shouldRenderHeader" v-slot:header>
      <span
        class="form-table-column-header"
        v-bind="resolvedHeaderTargetProps"
      >
        <SlotRenderer
          v-if="headerSlotFn"
          :slot-fn="headerSlotFn"
          :slot-props="headerSlotProps"
        />
        <template v-else>{{ column.label }}</template>
      </span>
    </template>

    <template v-slot="scope">
      <SlotRenderer
        v-if="cellSlotFn"
        :slot-fn="cellSlotFn"
        :slot-props="createCellSlotContext(scope.row, scope.$index)"
      />
      <template v-else>
        <FormTableRow
          v-for="(rowConfig, rowIndex) in layoutRows"
          :key="rowConfig.key || rowIndex"
          :row="scope.row"
          :row-index="scope.$index"
          :column-context="columnContext"
          :row-config="rowConfig"
        />
      </template>
    </template>
  </el-table-column>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue'
import FormTableRow from './FormTableRow.vue'
import SlotRenderer from './SlotRenderer'
import type {
  CellSlotColumnConfig,
  ColumnConfig,
  FormTableCellSlotContext,
  FormTableColumnContext,
  FormTableTableContext,
  FormTableHeaderSlotContext,
  FormTableHintModeContext,
  FormTableSlots,
  FormTableUpdateApi,
  ResolvedHeaderConfig,
  TableRow
} from './types'
import {
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_HINT_MODE_KEY,
  FORM_TABLE_SLOTS_KEY,
  FORM_TABLE_UPDATE_KEY
} from './types'
import {
  createColumnContext,
  createTableContext,
  extendLazyContext,
  resolveDynamicValue
} from './utils/dynamic'
import { applyHintTargetProps } from './utils/hint'

/** 当前列配置及其在可见列集合中的下标。 */
const props = defineProps<{
  column: ColumnConfig
  columnIndex: number
}>()

/** 根组件提供的表级响应式数据，是列动态回调的基础上下文。 */
const formTableContext = inject<FormTableTableContext>(
  FORM_TABLE_CONTEXT_KEY,
  createTableContext(() => [])
)

/** 父组件具名插槽集合，用于解析表头和列级单元格 Slot。 */
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, {})

/** 根组件未提供模式时保持原生 title，便于列组件独立挂载测试。 */
const hintMode = inject<FormTableHintModeContext>(FORM_TABLE_HINT_MODE_KEY, ref<'title'>('title'))

/** 根组件下发的行更新入口，供列级单元格 Slot 执行业务操作。 */
const updateApi = inject<FormTableUpdateApi>(FORM_TABLE_UPDATE_KEY)

/** 合并表级数据和当前列配置，供列属性、表头和下级行共同复用。 */
const columnContext = computed<FormTableColumnContext>(() => createColumnContext(
  formTableContext,
  props.column
))

/** 解析静态或函数形式的 el-table-column 透传属性。 */
const columnProps = computed(() => resolveDynamicValue(props.column.props, columnContext.value) || {})

/** 表头属性和提示只求值一次，默认表头与自定义 Slot 共享同一解析结果。 */
const resolvedHeader = computed<ResolvedHeaderConfig>(() => ({
  props: resolveDynamicValue(props.column.headerProps, columnContext.value) || {},
  hint: resolveDynamicValue(props.column.headerHint, columnContext.value)
}))

/** 默认和 Slot 表头共用同一个 FormTable 管理的属性与提示锚点。 */
const resolvedHeaderTargetProps = computed(() => {
  if (!Object.prototype.hasOwnProperty.call(props.column, 'headerHint')) {
    return resolvedHeader.value.props
  }

  return applyHintTargetProps(
    resolvedHeader.value.props,
    resolvedHeader.value.hint,
    hintMode.value
  )
})

// Element UI 的功能列由 type 驱动，不应挂载普通字段的 scoped slot。
const isNativeColumn = computed(() => ['index', 'selection', 'expand'].includes(columnProps.value.type))

/** cellSlot 列不经过 Row/Item 字段渲染链路。 */
const cellSlotFn = computed(() => {
  const slotName = 'cellSlot' in props.column ? props.column.cellSlot : undefined
  return slotName ? parentSlots[slotName] || null : null
})

/** 仅布局列具有 children；cellSlot 列缺失对应 Slot 时保持空单元格。 */
const layoutRows = computed(() => 'children' in props.column
  ? props.column.children || []
  : [])

/** 为当前单元格构造无字段语义的精简 Slot 上下文。 */
const createCellSlotContext = (row: TableRow, index: number): FormTableCellSlotContext => ({
  row,
  index,
  columnConfig: props.column as CellSlotColumnConfig,
  updateRow: patch => updateApi?.updateRow(row, patch)
})

/** 根据配置名称查找实际存在的父级表头插槽。 */
const headerSlotFn = computed(() => props.column.headerSlot
  ? parentSlots[props.column.headerSlot] || null
  : null)

/** 仅在没有原生 renderHeader 且确有自定义内容或属性时接管普通列表头。 */
const shouldRenderHeader = computed(() => {
  // 原生 renderHeader 的优先级高于 FormTable 的具名表头插槽。
  return typeof columnProps.value.renderHeader !== 'function'
    && (Boolean(headerSlotFn.value) || Object.keys(resolvedHeaderTargetProps.value).length > 0)
})

/** 传给自定义表头插槽的完整列上下文。 */
const headerSlotProps = computed<FormTableHeaderSlotContext>(() => extendLazyContext(
  columnContext.value,
  {
    columnIndex: props.columnIndex,
    header: resolvedHeader.value,
    label: props.column.label
  }
))
</script>
