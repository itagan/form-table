<template>
  <div class="hint-custom-editor">
    <el-input
      :value="value"
      size="small"
      placeholder="自定义组件仍由外层 FormItem 提供 Hint"
      @input="$emit('input', $event)"
    >
      <template #prepend>业务组件</template>
    </el-input>
    <el-tag size="mini" type="success">component.renderer</el-tag>
    <small v-if="hintUsage" class="hint-usage">{{ hintUsage }}</small>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  value?: string
  hintUsage?: string
}>()

defineEmits<{
  (event: 'input', value: string): void
}>()
</script>

<style scoped>
.hint-custom-editor {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.hint-custom-editor .el-input {
  flex: 1;
}

.hint-usage {
  color: #909399;
  white-space: nowrap;
}
</style>
