<template>
  <div class="transport-editor">
    <el-select v-if="mode !== 'car'" :value="value.seatClass" :placeholder="mode === 'flight' ? '舱位等级' : '车次类型'" @input="patch('seatClass', $event)">
      <el-option v-for="option in seatOptions" :key="option.value" :label="option.label" :value="option.value" />
    </el-select>
    <el-select v-else :value="value.carType" placeholder="车型" @input="patch('carType', $event)">
      <el-option label="轿车" value="sedan" />
      <el-option label="商务车" value="mpv" />
      <el-option label="大巴" value="bus" />
    </el-select>
    <el-input :value="value.departure" placeholder="出发城市" @input="patch('departure', $event)" />
    <el-input :value="value.arrival" placeholder="到达城市" @input="patch('arrival', $event)" />
    <el-input :value="value.remark" placeholder="备注（非必填）" @input="patch('remark', $event)" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DemandDetail, DemandType } from './types'

const props = defineProps<{ value: DemandDetail, mode: Extract<DemandType, 'flight' | 'train' | 'car'> }>()
const emit = defineEmits<{ (event: 'change', value: DemandDetail): void }>()
const seatOptions = computed(() => props.mode === 'flight'
  ? [{ label: '经济舱', value: 'economy' }, { label: '公务舱', value: 'business' }]
  : [{ label: '二等座', value: 'second' }, { label: '一等座', value: 'first' }, { label: '商务座', value: 'business' }])
const patch = (key: string, value: unknown) => emit('change', { ...props.value, [key]: value })
</script>

<style scoped>
.transport-editor { display: grid; grid-template-columns: 1fr 1fr 1fr 1.4fr; gap: 6px; }
</style>
