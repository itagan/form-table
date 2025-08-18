<template>
  <el-form-item 
    :prop="propPath" 
    :rules="rules"
    :label="label"
    :label-width="labelWidth"
  >
    <!-- 使用Tooltip包装 -->
    <el-tooltip 
      v-if="isUseTooltip"
      effect="dark" 
      :disabled="!hasContent" 
      :content="tooltipContent" 
      placement="top-start" 
      v-bind="tooltipProps"
    >
      <component-wrapper />
    </el-tooltip>
    
    <!-- 不使用Tooltip -->
    <component-wrapper v-else />
  </el-form-item>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import ComponentWrapper from './ComponentWrapper.vue'

// 定义插槽
defineSlots<{
  [key: string]: (props: { row: any; index: number }) => any
}>()

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

// 计算属性
const hasContent = computed(() => {
  return !!props.row[props.config.key]
})

const tooltipContent = computed(() => {
  return props.row[props.config.key] || ''
})
</script>
