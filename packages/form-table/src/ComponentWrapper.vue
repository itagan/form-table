<template>
  <span v-if="type === 'text'">{{ value }}</span>

  <component
    v-else-if="isSelectLike"
    :is="component.renderer"
    v-model="modelValue"
    v-bind="component.props"
    v-on="component.listeners"
  >
    <el-option
      v-for="(option, optionIndex) in component.options"
      :key="getOptionKey(option, optionIndex, component.optionProps)"
      :label="getOptionLabel(option, component.optionProps)"
      :value="getOptionValue(option, component.optionProps)"
      :disabled="getOptionDisabled(option, component.optionProps)"
    />
  </component>

  <component
    v-else-if="type === 'radio'"
    :is="component.renderer"
    v-model="modelValue"
    v-bind="component.props"
    v-on="component.listeners"
  >
    <el-radio
      v-for="(option, optionIndex) in component.options"
      :key="getOptionKey(option, optionIndex, component.optionProps)"
      :label="getOptionValue(option, component.optionProps)"
      :disabled="getOptionDisabled(option, component.optionProps)"
    >
      {{ getOptionLabel(option, component.optionProps) }}
    </el-radio>
  </component>

  <component
    v-else-if="type === 'checkbox'"
    :is="component.renderer"
    v-model="modelValue"
    v-bind="component.props"
    v-on="component.listeners"
  >
    <el-checkbox
      v-for="(option, optionIndex) in component.options"
      :key="getOptionKey(option, optionIndex, component.optionProps)"
      :label="getOptionValue(option, component.optionProps)"
      :disabled="getOptionDisabled(option, component.optionProps)"
    >
      {{ getOptionLabel(option, component.optionProps) }}
    </el-checkbox>
  </component>

  <component
    v-else
    :is="component.renderer"
    v-model="modelValue"
    v-bind="component.props"
    v-on="component.listeners"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type {
  FormItemType,
  FormTableValue,
  ResolvedComponentConfig
} from './types'
import {
  getOptionDisabled,
  getOptionKey,
  getOptionLabel,
  getOptionValue
} from './utils/display'

/** 上层已完成动态解析，本组件只接收渲染所需的最小数据。 */
const props = defineProps<{
  type: FormItemType
  value: FormTableValue
  component: ResolvedComponentConfig
}>()

/** 将字段组件的 input 事件交回 FormTableItem 执行不可变更新。 */
const emit = defineEmits<{
  (event: 'input', value: FormTableValue): void
}>()

// 将任意字段组件的 Vue 2 v-model 统一转换为上层的不可变数据更新。
const modelValue = computed({
  get: () => props.value,
  set: value => emit('input', value)
})

/** select 与 tag-input 共用 el-option 子节点渲染分支。 */
const isSelectLike = computed(() => props.type === 'select' || props.type === 'tag-input')
</script>
