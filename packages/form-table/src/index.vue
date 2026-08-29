<template>
  <div
    ref="containerRef"
    class="form-table-container"
    data-form-table-hint-root
    @keydown="handleNavigationKeydown"
  >
    <el-form
      ref="formRef"
      v-bind="props.formProps"
      :model="formModel"
      @validate="handleFormValidate"
    >
      <el-table
        ref="tableRef"
        v-bind="resolvedTableProps"
        :row-key="props.rowKey"
        v-on="tableListeners"
        :data="props.tableData"
        v-loading="props.loading"
      >
        <FormTableColumn
          v-for="(entry, columnIndex) in visibleColumns"
          :key="entry.renderKey"
          :column="entry.column"
          :column-index="columnIndex"
        />
        <template v-if="slots.empty" v-slot:empty>
          <slot name="empty" />
        </template>
        <template v-if="slots.append" v-slot:append>
          <slot name="append" />
        </template>
      </el-table>
    </el-form>
    <FormTableHintTooltip
      v-if="isTooltipHintMode"
      ref="hintTooltipControllerRef"
      :container="containerRef"
      :tooltip-props="props.hintOptions.tooltipProps"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

/** Vue 2 根组件 v-model 复用现有 tableData/update:tableData 受控协议。 */
export default defineComponent({
  name: 'FormTable',
  model: {
    prop: 'tableData',
    event: 'update:tableData'
  }
})
</script>

<script lang="ts" setup>
import { computed, getCurrentInstance, provide, reactive, ref, useSlots, watchEffect } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import FormTableHintTooltip from './FormTableHintTooltip.vue'
import type {
  ColumnConfig,
  ComponentProps,
  FormTableElementFormRef,
  FormTableElementTableRef,
  FormTableFieldChangePayload,
  FieldTypeRegistry,
  FormTableFormProps,
  FormTableHintContext,
  FormTableHintMode,
  FormTableHintTargets,
  FormTableHintOptions,
  FormTableNavigationOptions,
  FormTableRowKey,
  FormTableTableProps,
  FormTableSlots,
  FormTableTableContext,
  FormTableUpdateApi,
  FormTableValue,
  TableRow
} from './types'
import {
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_FIELD_TYPES_KEY,
  FORM_TABLE_HINT_CONTEXT_KEY,
  FORM_TABLE_ROW_INDEX_KEY,
  FORM_TABLE_SLOTS_KEY,
  FORM_TABLE_UPDATE_KEY
} from './types/internal'
import { useColumnIdentity } from './composables/useColumnIdentity'
import { useControlledTableUpdate } from './composables/useControlledTableUpdate'
import { useFormTableFieldLocator } from './composables/useFormTableFieldLocator'
import { useFormTableKeyboardNavigation } from './composables/useFormTableKeyboardNavigation'
import { useRowIndex } from './composables/useRowIndex'
import { createTableContext } from './utils/dynamic'
import { collectFieldTypeDiagnostics } from './utils/fieldTypeDiagnostics'
import {
  getVue2ComponentListeners,
  resolveTableListeners,
  resolveTableProps
} from './utils/formTableRuntimeAdapter'

/** FormTable 对外接收的受控数据、列配置以及 Element UI 透传属性。 */
const props = withDefaults(defineProps<{
  /** 根组件 v-model 对应 prop；更新统一发出 update:tableData。 */
  tableData: TableRow[]
  columns: ColumnConfig[]
  formProps?: FormTableFormProps
  tableProps?: FormTableTableProps
  rowKey?: FormTableRowKey
  hintOptions?: FormTableHintOptions
  navigationOptions?: FormTableNavigationOptions
  loading?: boolean
  fieldTypes?: FieldTypeRegistry
}>(), {
  tableData: () => [],
  columns: () => [],
  formProps: () => ({}),
  tableProps: () => ({}),
  hintOptions: () => ({ mode: 'title', targets: 'field' }),
  loading: false
})

/** 注册表通过新对象替换即可响应更新；不为原地深层修改建立额外协议。 */
const resolvedFieldTypes = computed<FieldTypeRegistry>(() => props.fieldTypes || {})

/** 未知名称按当前实例去重，避免同一 type 在每个单元格重复输出。 */
if (import.meta.env.DEV) {
  const warnedDiagnostics = new Set<string>()
  watchEffect(() => {
    const diagnostics = collectFieldTypeDiagnostics(
      resolvedFieldTypes.value,
      props.columns
    )
    for (const diagnostic of diagnostics) {
      if (warnedDiagnostics.has(diagnostic.key)) continue
      warnedDiagnostics.add(diagnostic.key)
      console.warn(diagnostic.message)
    }
  })
}

/** 数据更新和字段粒度变更是组件自身负责派发的两个业务事件。 */
const emit = defineEmits<{
  (event: 'update:tableData', data: TableRow[]): void
  (event: 'field-change', payload: FormTableFieldChangePayload): void
  (event: 'form-validate', propPath: string, valid: boolean, message: string | null): void
}>()

/** 暴露给父组件的 Element UI 原始实例引用。 */
const formRef = ref<FormTableElementFormRef | null>(null)
const tableRef = ref<FormTableElementTableRef | null>(null)
const containerRef = ref<HTMLElement | null>(null)

/** hintOptions 是整个表格唯一的提示展示策略。 */
const hintMode = computed<FormTableHintMode>(() => props.hintOptions.mode ?? 'title')
const hintTargets = computed<FormTableHintTargets>(() => props.hintOptions.targets || 'field')
const isTooltipHintMode = computed(() => hintMode.value === 'tooltip')
const defaultFieldHint = computed(() => props.hintOptions.field)

/** 保存父组件插槽和 Vue 2 组件实例，供后代组件及事件透传使用。 */
const slots = reactive(useSlots())
const instance = getCurrentInstance()

// 组件自身事件在本层触发，其余监听器原样交给 el-table。
const tableListeners = computed(() => {
  return resolveTableListeners(getVue2ComponentListeners(instance?.proxy))
})

/** rowKey 是 FormTable 核心身份协议，不允许继续藏在 Element Table 透传属性中。 */
const resolvedTableProps = computed(() => {
  return resolveTableProps(props.tableProps as ComponentProps)
})

/** el-form 的校验模型；字段 prop 始终使用受控 tableData 的数据源下标。 */
const formModel = computed(() => ({ tableData: props.tableData }))

/** 将 Element Form 的逐字段校验结果与 Table 原生事件命名空间分离。 */
const handleFormValidate = (propPath: string, valid: boolean, message: string | null) => {
  emit('form-validate', propPath, valid, message)
}

/** 向列、行、字段组件提供的响应式表级上下文。 */
const formTableContext: FormTableTableContext = createTableContext(() => props.tableData)

const { visibleColumns } = useColumnIdentity(() => props.columns, formTableContext)

/** 内部排序或筛选只改变显示位置；全部单元格共享同一份数据源行索引。 */
const resolveRowIndex = useRowIndex(() => props.tableData)

/** 通过独立受控更新模块统一不可变写回、稳定行定位和同步组合。 */
const updateApi: FormTableUpdateApi = useControlledTableUpdate({
  getTableData: () => props.tableData,
  getRowKey: () => props.rowKey,
  emitUpdate: data => emit('update:tableData', data),
  emitFieldChange: payload => emit('field-change', payload)
})

/** 统一把业务行和字段路径解析为当前 FormItem，供顶层 Ref 方法和键盘导航复用。 */
const fieldLocator = useFormTableFieldLocator({
  getTableData: () => props.tableData,
  getRowKey: () => props.rowKey,
  containerRef,
  formRef
})

/** 键盘导航只消费 P1 的挂载字段注册和聚焦能力，不维护第二份字段顺序。 */
const { handleNavigationKeydown } = useFormTableKeyboardNavigation({
  getOptions: () => props.navigationOptions,
  getMountedFields: fieldLocator.getMountedFields,
  focusElement: fieldLocator.focusElement
})

/** 后代组件共享表数据、更新入口和父级插槽，避免逐层透传无关参数。 */
provide(FORM_TABLE_CONTEXT_KEY, formTableContext)
provide(FORM_TABLE_FIELD_TYPES_KEY, resolvedFieldTypes)
provide(FORM_TABLE_ROW_INDEX_KEY, resolveRowIndex)
provide(FORM_TABLE_UPDATE_KEY, updateApi)
provide(FORM_TABLE_SLOTS_KEY, slots as FormTableSlots)
provide<FormTableHintContext>(FORM_TABLE_HINT_CONTEXT_KEY, {
  mode: hintMode,
  targets: hintTargets,
  defaultFieldHint
})

/**
 * 将 Element UI 的 Promise/callback 两种校验方式统一为 Promise<boolean>，
 * 校验失败时保留 fields 并传给可选回调。
 */
const validate = async (callback?: (valid: boolean, fields?: FormTableValue) => void) => {
  try {
    const valid = Boolean(await formRef.value?.validate?.())
    callback?.(valid)
    return valid
  } catch (fields) {
    callback?.(false, fields)
    return false
  }
}

/** 对外只暴露稳定方法，避免父组件依赖 setup 内部状态。 */
defineExpose({
  validate,
  clearValidate: (fieldProps?: string | string[]) => formRef.value?.clearValidate?.(fieldProps),
  getFieldProp: fieldLocator.getFieldProp,
  validateField: fieldLocator.validateField,
  clearFieldValidate: fieldLocator.clearFieldValidate,
  focusField: fieldLocator.focusField,
  scrollToFirstError: fieldLocator.scrollToFirstError,
  updateRows: updateApi.updateRows,
  getFormRef: () => formRef.value,
  getTableRef: () => tableRef.value
})
</script>

<style lang="less" scoped>
.form-table-container {
  :deep(.form-table-field-layout) {
    flex-wrap: wrap;
  }

  :deep(.el-table__cell .el-form-item) {
    margin-bottom: 0;
  }
}
</style>
