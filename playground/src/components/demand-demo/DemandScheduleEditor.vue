<template>
  <div v-if="requiresDemandSchedule(demandType)" class="schedule-editor">
    <el-date-picker
      :value="value.start"
      :disabled="readonly"
      type="datetime"
      value-format="yyyy-MM-dd HH:mm:ss"
      :placeholder="getDemandStartPlaceholder(demandType)"
      @input="patch('start', $event)"
    />
    <template v-if="requiresDemandEndTime(demandType)">
      <span>~</span>
      <el-date-picker
        :value="value.end"
        :disabled="readonly"
        type="datetime"
        value-format="yyyy-MM-dd HH:mm:ss"
        :placeholder="getDemandEndPlaceholder(demandType)"
        @input="patch('end', $event)"
      />
    </template>
  </div>
  <span v-else class="empty-schedule">该需求不需要时间</span>
</template>

<script setup lang="ts">
import {
  getDemandEndPlaceholder,
  getDemandStartPlaceholder,
  requiresDemandEndTime,
  requiresDemandSchedule
} from './types'
import type { DemandSchedule, DemandType } from './types'

const props = defineProps<{ value: DemandSchedule, demandType: DemandType, readonly?: boolean }>()
const emit = defineEmits<{ (event: 'change', value: DemandSchedule): void }>()
const patch = (key: keyof DemandSchedule, value: string) => emit('change', { ...props.value, [key]: value })
</script>

<style scoped>
.schedule-editor { display: flex; align-items: center; gap: 6px; }
.schedule-editor :deep(.el-date-editor) { width: 190px; }
.empty-schedule { color: #909399; }
</style>
