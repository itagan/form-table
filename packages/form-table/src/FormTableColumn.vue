<template>
  <el-table-column
    v-if="columnRender.kind === 'plain'"
    :label="resolvedColumnLabel"
    v-bind="columnProps"
  />

  <el-table-column
    v-else
    :label="resolvedColumnLabel"
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
        <template v-else>{{ resolvedColumnLabel }}</template>
      </span>
    </template>

    <template v-slot="scope">
      <SlotRenderer
        v-if="cellSlotFn"
        :slot-fn="cellSlotFn"
        :slot-props="createCellSlotContext(scope.row, scope.$index)"
      />
      <template v-else-if="columnRender.kind === 'layout'">
        <FormTableRow
          :row="scope.row"
          :row-index="resolveRowIndex(scope.row, scope.$index)"
          :display-index="scope.$index"
          :column-context="columnContext"
          :items="columnRender.items"
          :row-props="columnRender.rowProps"
        />
      </template>
    </template>
  </el-table-column>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import FormTableRow from './FormTableRow.vue'
import SlotRenderer from './SlotRenderer'
import type {
  ColumnConfig,
  FormTableCellSlotContext,
  FormTableColumnContext,
  FormTableHintContext,
  FormTableTableContext,
  FormTableHeaderSlotContext,
  FormTableSlots,
  FormTableRowIndexResolver,
  FormTableUpdateApi,
  TableRow
} from './types'
import {
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_HINT_CONTEXT_KEY,
  FORM_TABLE_ROW_INDEX_KEY,
  FORM_TABLE_SLOTS_KEY,
  FORM_TABLE_UPDATE_KEY
} from './types/internal'
import {
  createColumnContext,
  createTableContext,
  extendLazyContext,
  resolveDynamicValue
} from './utils/dynamic'
import { resolveColumnRenderConfig } from './utils/columnRender'
import { applyHintTargetProps, resolveFormTableHint } from './utils/hint'

/** 当前列配置及其在可见列集合中的下标。 */
const props = defineProps<{
  column: ColumnConfig
  columnIndex: number
}>()

/** 将公开列联合类型一次归一化为纯列、布局列或 cellSlot 列。 */
const columnRender = computed(() => resolveColumnRenderConfig(props.column))

/** 根组件提供的表级响应式数据，是列动态回调的基础上下文。 */
const formTableContext = inject<FormTableTableContext>(
  FORM_TABLE_CONTEXT_KEY,
  () => createTableContext(() => []),
  true
)

/** 父组件具名插槽集合，用于解析表头和列级单元格 Slot。 */
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, () => ({}), true)

/** 根组件未提供模式时保持原生 title，便于列组件独立挂载测试。 */
const hintContext = inject<FormTableHintContext | undefined>(FORM_TABLE_HINT_CONTEXT_KEY, undefined)
const hintMode = hintContext?.mode ?? computed(() => 'title' as const)
const hintTargets = hintContext?.targets ?? computed(() => 'field' as const)

/** 根组件下发的行更新入口，供列级单元格 Slot 执行业务操作。 */
const updateApi = inject<FormTableUpdateApi | undefined>(FORM_TABLE_UPDATE_KEY, undefined)

/** 将 Element Table 显示下标映射回受控 tableData 数据源下标。 */
const resolveRowIndex = inject<FormTableRowIndexResolver>(
  FORM_TABLE_ROW_INDEX_KEY,
  (): FormTableRowIndexResolver => (_row, displayIndex) => displayIndex,
  true
)

/** 合并表级数据和当前列配置，供列属性、表头和下级行共同复用。 */
const columnContext = computed<FormTableColumnContext>(() => createColumnContext(
  formTableContext,
  props.column
))

/** 解析静态或函数形式的 el-table-column 透传属性。 */
const columnProps = computed(() => resolveDynamicValue(props.column.props, columnContext.value) || {})

/** 顶层 label 提供默认标题，Element Column props 中的显式值可以覆盖。 */
const resolvedColumnLabel = computed(() => columnProps.value.label ?? props.column.label)

/** 表头属性保持独立解析，不向 Slot 暴露 Hint 内部状态。 */
const resolvedHeaderProps = computed(() => (
  resolveDynamicValue(props.column.headerProps, columnContext.value) || {}
))

/** 默认和 Slot 表头共用同一个 FormTable 管理的属性与提示锚点。 */
const resolvedHeaderTargetProps = computed(() => {
  if (
    hintMode.value === false
    || hintTargets.value === 'field'
    || !Object.prototype.hasOwnProperty.call(props.column, 'headerHint')
  ) {
    return resolvedHeaderProps.value
  }

  return applyHintTargetProps(
    resolvedHeaderProps.value,
    resolveFormTableHint(resolveDynamicValue(props.column.headerHint, columnContext.value)),
    hintMode.value,
    { focusable: true }
  )
})

/** cellSlot 列不经过 Row/Item 字段渲染链路。 */
const cellSlotFn = computed(() => {
  const renderConfig = columnRender.value
  return renderConfig.kind === 'cell-slot' && renderConfig.slotName
    ? parentSlots[renderConfig.slotName] || null
    : null
})

/** 为当前单元格构造无字段语义的精简 Slot 上下文。 */
const createCellSlotContext = (
  row: TableRow,
  displayIndex: number
): FormTableCellSlotContext | undefined => {
  const renderConfig = columnRender.value
  if (renderConfig.kind !== 'cell-slot') return undefined
  return {
    row,
    index: resolveRowIndex(row, displayIndex),
    displayIndex,
    columnConfig: renderConfig.column,
    updateRow: patch => updateApi?.updateRow(row, patch)
  }
}

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
    label: resolvedColumnLabel.value ?? ''
  }
))
</script>
