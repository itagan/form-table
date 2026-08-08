<template>
  <div class="meal-editor">
    <el-select :value="value.mealType" :disabled="readonly" placeholder="就餐类型" @input="patch('mealType', $event)">
      <el-option label="早餐" value="breakfast" />
      <el-option label="午餐" value="lunch" />
      <el-option label="晚餐" value="dinner" />
      <el-option label="茶歇" value="tea" />
    </el-select>
    <el-input :value="value.supplies" :disabled="readonly" placeholder="物资名称" @input="patch('supplies', $event)" />
    <el-input :value="value.remark" :disabled="readonly" placeholder="备注（非必填）" @input="patch('remark', $event)" />
  </div>
</template>

<script setup lang="ts">
import type { DemandDetail, DemandType } from './types'

const props = defineProps<{ value: DemandDetail, demandType: DemandType, readonly?: boolean }>()
const emit = defineEmits<{ (event: 'change', value: DemandDetail): void }>()
const patch = (key: string, value: unknown) => emit('change', { ...props.value, [key]: value })
</script>

<style scoped>
.meal-editor { display: grid; grid-template-columns: 1fr 1.2fr 2fr; gap: 6px; }
</style>
