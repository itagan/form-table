<template>
  <el-tooltip
    ref="tooltipRef"
    v-bind="resolvedProps"
    :content="content"
    :enterable="false"
  />
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue'
import type { ComponentProps, FormTableHintRootContext } from './types'
import { FORM_TABLE_HINT_ROOT_KEY } from './types'
import { useFormTableHintTooltip } from './composables/useFormTableHintTooltip'
import type { FormTableHintTooltipRef } from './composables/useFormTableHintTooltip'
import { resolveHintTooltipProps } from './utils/formTableRuntimeAdapter'

const props = defineProps<{
  tooltipProps?: ComponentProps
}>()

const containerRef = inject<FormTableHintRootContext>(FORM_TABLE_HINT_ROOT_KEY, ref(null))
const tooltipRef = ref<FormTableHintTooltipRef | null>(null)
const content = ref('')
const resolvedProps = computed(() => resolveHintTooltipProps(props.tooltipProps || {}))

useFormTableHintTooltip({
  containerRef,
  tooltipRef,
  content
})
</script>
