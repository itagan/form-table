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
  config: Record<string, any>
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
  const config = props.config as FormItemConfig
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
  } = config

  return {
    type,
    fieldKey: key,
    row: props.row,
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
