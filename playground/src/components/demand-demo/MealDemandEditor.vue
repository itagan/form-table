<template>
  <div class="meal-editor">
    <el-select :value="value.mealType" placeholder="就餐类型" @input="patch('mealType', $event)">
      <el-option label="早餐" value="breakfast" />
      <el-option label="午餐" value="lunch" />
      <el-option label="晚餐" value="dinner" />
      <el-option label="茶歇" value="tea" />
    </el-select>
    <el-input :value="value.supplies" placeholder="物资名称" @input="patch('supplies', $event)" />
    <el-input :value="value.remark" placeholder="备注（非必填）" @input="patch('remark', $event)" />
  </div>
</template>

<script setup lang="ts">
import type { DemandDetail } from './types'

const props = defineProps<{ value: DemandDetail }>()
const emit = defineEmits<{ (event: 'change', value: DemandDetail): void }>()
const patch = (key: string, value: unknown) => emit('change', { ...props.value, [key]: value })
</script>

<style scoped>
.meal-editor { display: grid; grid-template-columns: 1fr 1.2fr 2fr; gap: 6px; }
</style>
