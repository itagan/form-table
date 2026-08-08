<template>
  <div class="pricing-editor">
    <el-input-number
      :value="value.quantity"
      :disabled="readonly"
      :min="1"
      controls-position="right"
      @input="patch('quantity', $event)"
    />
    <span class="unit-label">{{ value.unit }}</span>
    <el-input-number
      :value="value.unitPrice"
      :disabled="readonly"
      :min="0"
      :precision="2"
      controls-position="right"
      @input="patch('unitPrice', $event)"
    />
    <span class="unit-label">元/{{ value.unit }}</span>
  </div>
</template>

<script setup lang="ts">
import type { DemandPricing, DemandType } from './types'

const props = defineProps<{ value: DemandPricing, demandType: DemandType, readonly?: boolean }>()
const emit = defineEmits<{ (event: 'change', value: DemandPricing): void }>()
const patch = (key: 'quantity' | 'unitPrice', value: number) => emit('change', { ...props.value, [key]: value })
</script>

<style scoped>
.pricing-editor { display: flex; align-items: center; gap: 6px; }
.pricing-editor :deep(.el-input-number) { width: 120px; }
.unit-label { flex-shrink: 0; color: #606266; font-size: 12px; }
</style>
