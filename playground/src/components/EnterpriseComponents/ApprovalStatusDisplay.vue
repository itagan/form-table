<template>
  <el-tag :type="tagType" size="small">{{ label }}</el-tag>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  status?: string
}>()

const statusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  pending: { label: '审批中', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' }
}

const currentStatus = computed(() => statusMap[props.status || 'draft'] || statusMap.draft)
const label = computed(() => currentStatus.value.label)
const tagType = computed(() => currentStatus.value.type)
</script>
