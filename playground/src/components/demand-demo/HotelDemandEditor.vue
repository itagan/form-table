<template>
  <div class="hotel-editor">
    <el-input :value="value.hotelName" :disabled="readonly" placeholder="住宿名称" @input="patch('hotelName', $event)" />
    <el-input :value="value.roomName" :disabled="readonly" placeholder="房间名称" @input="patch('roomName', $event)" />
    <el-input-number :value="value.roomCount" :disabled="readonly" :min="1" controls-position="right" @input="patch('roomCount', $event)" />
    <el-select :value="value.roomType" :disabled="readonly" placeholder="床型" @input="patch('roomType', $event)">
      <el-option label="大床" value="king" />
      <el-option label="双床" value="twin" />
      <el-option label="套房" value="suite" />
    </el-select>
    <el-input-number :value="value.guestCount" :disabled="readonly" :min="1" controls-position="right" @input="patch('guestCount', $event)" />
    <el-select :value="value.breakfast" :disabled="readonly" placeholder="早餐" @input="patch('breakfast', $event)">
      <el-option label="含早餐" :value="true" />
      <el-option label="不含早餐" :value="false" />
    </el-select>
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
.hotel-editor { display: grid; grid-template-columns: repeat(4, minmax(100px, 1fr)); gap: 6px; }
.hotel-editor > :last-child { grid-column: span 2; }
</style>
