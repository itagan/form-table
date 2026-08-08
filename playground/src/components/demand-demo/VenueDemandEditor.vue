<template>
  <div class="scene-editor">
    <el-select :value="value.venueType" :disabled="readonly" placeholder="会场类型" @input="patch('venueType', $event)">
      <el-option label="会议室" value="meeting" />
      <el-option label="宴会厅" value="banquet" />
      <el-option label="展厅" value="exhibition" />
    </el-select>
    <el-input-number :value="value.attendeeCount" :disabled="readonly" :min="1" controls-position="right" @input="patch('attendeeCount', $event)" />
    <el-input :value="value.equipment" :disabled="readonly" placeholder="设备需求（非必填）" @input="patch('equipment', $event)" />
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
.scene-editor { display: grid; grid-template-columns: 1fr 0.8fr 1.8fr; gap: 6px; }
.scene-editor > :last-child { grid-column: 1 / -1; }
</style>
