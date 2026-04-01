<template>
  <el-form-item 
    :prop="propPath" 
    :rules="rules"
    :label="label"
    :label-width="labelWidth"
    v-bind="attrs"
  >
    <!-- 插槽组件 -->
    <slot 
      v-if="config.type === 'slotComponent' && config.slotName"
      :name="config.slotName" 
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
import { computed, useAttrs } from 'vue'
import ComponentWrapper from './ComponentWrapper.vue'
import type { FormItemConfig } from './types'

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
