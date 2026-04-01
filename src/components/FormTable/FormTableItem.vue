<template>
  <el-form-item 
    :prop="propPath" 
    :rules="rules"
    :label="label"
    :label-width="labelWidth"
    v-bind="attrs"
  >
    <!-- 插槽组件: 从 FormTable 顶层注入的 $slots 中取具名插槽 -->
    <SlotRenderer
      v-if="config.type === 'slotComponent' && config.slotName && slotFn"
      :slot-fn="slotFn"
      :row="row"
      :index="index"
    />
    
    <!-- 带Tooltip的组件 -->
    <el-tooltip 
      v-else-if="isUseTooltip"
      effect="dark" 
      :disabled="!hasContent" 
      :content="tooltipContent" 
      placement="top-start" 
      v-bind="tooltipProps"
    >
      <ComponentWrapper v-bind="wrapperProps" />
    </el-tooltip>
    
    <!-- 普通组件 -->
    <ComponentWrapper v-else v-bind="wrapperProps" />
  </el-form-item>
</template>

<script lang="ts" setup>
/**
 * FormTableItem - 表单项渲染
 *
 * 负责渲染单个表单字段，包含三种模式:
 * 1. slotComponent: 通过 slotName 具名插槽自定义渲染
 * 2. 带 Tooltip: isUseTooltip=true 时，内容超出用 el-tooltip 展示
 * 3. 普通组件: 由 ComponentWrapper 根据 type 动态渲染
 */
import { computed, defineComponent, h, inject, useAttrs } from 'vue'
import ComponentWrapper from './ComponentWrapper.vue'
import type { FormItemConfig } from './types'
import { FORM_TABLE_SLOTS_KEY } from './types'

// 渲染顶层插槽的包装组件，用 div 包裹以兼容 Vue 2 单根节点要求
const SlotRenderer = defineComponent({
  props: {
    slotFn: { type: Function, required: true as true },
    row: { type: Object, default: () => ({}) },
    index: { type: Number, default: 0 }
  },
  setup(props) {
    return () => h('div', props.slotFn({ row: props.row, index: props.index }))
  }
})

interface Props {
  propPath: string
  rules?: any[]
  label?: string
  labelWidth?: string
  isUseTooltip?: boolean
  tooltipProps?: Record<string, any>
  row: Record<string, any>
  index: number
  config: FormItemConfig
}

const props = withDefaults(defineProps<Props>(), {
  rules: () => [],
  label: '',
  labelWidth: 'auto',
  isUseTooltip: false,
  tooltipProps: () => ({})
})

const attrs = useAttrs()
const parentSlots = inject(FORM_TABLE_SLOTS_KEY, {} as Record<string, any>)

// 从顶层 FormTable 注入的 slots 中取出对应具名插槽函数
const slotFn = computed(() => {
  return parentSlots[props.config.slotName!] || null
})
const wrapperProps = computed(() => {
  const {
    key,
    type,
    customComponent,
    bind,
    rules,
    label,
    labelWidth,
    isUseTooltip,
    tooltipProps,
    colSpan,
    ...componentConfig
  } = props.config

  return {
    type,
    fieldKey: key,
    row: props.row,
    rowIndex: props.index,
    customComponent,
    bind,
    ...componentConfig
  }
})

const hasContent = computed(() => {
  const value = props.row[props.config.key]
  return value !== null && value !== undefined && value !== ''
})

const tooltipContent = computed(() => {
  const value = props.row[props.config.key]
  return value ? String(value) : ''
})
</script>
