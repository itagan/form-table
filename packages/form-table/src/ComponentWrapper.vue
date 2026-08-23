<template>
  <span
    v-if="type === 'text'"
    v-bind="component.props"
    v-on="component.listeners"
  >{{ value }}</span>

  <span v-else-if="!component.is" />

  <DynamicFieldRenderer
    v-else
    :renderer="component.is"
    :value="modelValue"
    :component-props="component.props"
    :component-listeners="component.listeners"
    :model="component.model"
    :on-model-input="handleModelInput"
  >
    <template v-if="type === 'select'">
      <el-option
        v-for="(option, optionIndex) in component.options"
        :key="getOptionKey(option, optionIndex, component.optionProps)"
        :label="getOptionLabel(option, component.optionProps)"
        :value="getOptionValue(option, component.optionProps)"
        :disabled="getOptionDisabled(option, component.optionProps)"
      />
    </template>

    <template v-else-if="type === 'radio'">
      <el-radio
        v-for="(option, optionIndex) in component.options"
        :key="getOptionKey(option, optionIndex, component.optionProps)"
        :label="getOptionValue(option, component.optionProps)"
        :disabled="getOptionDisabled(option, component.optionProps)"
      >
        {{ getOptionLabel(option, component.optionProps) }}
      </el-radio>
    </template>

    <template v-else-if="type === 'checkbox'">
      <el-checkbox
        v-for="(option, optionIndex) in component.options"
        :key="getOptionKey(option, optionIndex, component.optionProps)"
        :label="getOptionValue(option, component.optionProps)"
        :disabled="getOptionDisabled(option, component.optionProps)"
      >
        {{ getOptionLabel(option, component.optionProps) }}
      </el-checkbox>
    </template>
  </DynamicFieldRenderer>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import DynamicFieldRenderer from './DynamicFieldRenderer'
import type {
  FormItemType,
  FormTableFieldRenderContext,
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
  modelContext: FormTableFieldRenderContext
}>()

/** 仅自动 model 渲染链执行同步输入转换；text 在模板分支中继续展示原值。 */
const modelValue = computed(() => {
  const model = props.component.model
  return model && model.valueToProp
    ? model.valueToProp(props.value, props.modelContext)
    : props.value
})

/** 将字段组件的 input 事件交回 FormTableItem 执行不可变更新。 */
const emit = defineEmits<{
  (event: 'input', value: FormTableValue): void
}>()

/** 将任意字段协议产生的新值统一交回上层执行不可变数据更新。 */
const handleModelInput = (value: FormTableValue) => emit('input', value)
</script>
