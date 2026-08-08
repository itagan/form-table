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

const props = defineProps<{
  type: FormItemType
  value: FormTableValue
  component: ResolvedComponentConfig
}>()

const emit = defineEmits<{
  (event: 'input', value: FormTableValue): void
}>()

const modelValue = computed({
  get: () => props.value,
  set: value => emit('input', value)
})
const isSelectLike = computed(() => props.type === 'select' || props.type === 'tag-input')
</script>
