<template>
  <el-alert
    :title="`暂不支持的需求类型：${demandType}`"
    type="warning"
    :closable="false"
    show-icon
  />
</template>

<script setup lang="ts">
import type { DemandDetail, DemandType } from './types'

defineProps<{ value: DemandDetail, demandType: DemandType, readonly?: boolean }>()
defineEmits<{ (event: 'change', value: DemandDetail): void }>()
</script>
