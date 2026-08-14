<template>
  <el-tooltip
    ref="tooltipRef"
    v-bind="resolvedProps"
    :content="content"
    :enterable="false"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { ComponentProps } from './types'
import { useFormTableHintTooltip } from './composables/useFormTableHintTooltip'
import type { FormTableHintTooltipRef } from './composables/useFormTableHintTooltip'
import { resolveHintTooltipProps } from './utils/formTableRuntimeAdapter'

const props = defineProps<{
  container?: HTMLElement | null
  tooltipProps?: ComponentProps
}>()

const containerRef = computed(() => props.container || null)
const tooltipRef = ref<FormTableHintTooltipRef | null>(null)
const content = ref('')
const resolvedProps = computed(() => resolveHintTooltipProps(props.tooltipProps || {}))

useFormTableHintTooltip({
  containerRef,
  tooltipRef,
  content
})
</script>
