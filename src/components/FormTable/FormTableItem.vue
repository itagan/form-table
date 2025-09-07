<template>
  <el-form-item 
    :prop="propPath" 
    :rules="rules"
    :label="label"
    :label-width="labelWidth"
    v-bind="formItemAttrs"
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
      <ComponentWrapper 
        :type="config.type"
        :field-key="config.key"
        :row="row"
        :custom-component="config.customComponent"
        :custom-components="customComponents"
        v-bind="config.bind"
      />
    </el-tooltip>
    
    <!-- 普通组件 -->
    <ComponentWrapper 
      v-else
      :type="config.type"
      :field-key="config.key"
      :row="row"
      :custom-component="config.customComponent"
      :custom-components="customComponents"
      v-bind="config.bind"
    />
  </el-form-item>
</template>

<script lang="ts" setup>
import { computed, inject, useAttrs } from 'vue'
import ComponentWrapper from './ComponentWrapper.vue'

// 注入自定义组件
const customComponents = inject('customComponents', {} as Record<string, any>)

const props = defineProps({
  propPath: {
    type: String,
    required: true
  },
  rules: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    default: ''
  },
  labelWidth: {
    type: String,
    default: 'auto'
  },
  isUseTooltip: {
    type: Boolean,
    default: false
  },
  tooltipProps: {
    type: Object,
    default: () => ({})
  },
  row: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  config: {
    type: Object,
    required: true
  }
})

const attrs = useAttrs()

// 合并attrs，支持el-form-item的所有属性
const formItemAttrs = computed(() => {
  return attrs
})

// 优化的计算属性 - 避免重复计算
const hasContent = computed(() => {
  const value = props.row[props.config.key]
  return value !== null && value !== undefined && value !== ''
})

const tooltipContent = computed(() => {
  const value = props.row[props.config.key]
  return value ? String(value) : ''
})
</script>
