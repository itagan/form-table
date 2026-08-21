<template>
  <el-date-picker
    :value="range"
    type="daterange"
    value-format="yyyy-MM-dd"
    range-separator="至"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    clearable
    style="width: 100%;"
    @input="handleInput"
  />
</template>

<script lang="ts" setup>
defineProps<{
  range?: Array<string | null> | null
}>()

const emit = defineEmits<{
  (event: 'range-change', range: string[] | null): void
}>()

const handleInput = (range: string[] | null) => {
  emit('range-change', range)
}
</script>
