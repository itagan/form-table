<template>
  <span class="common-table-header">
    <span v-if="required" class="common-table-header__required" aria-hidden="true">*</span>
    <span v-if="required" class="common-table-header__sr-only">必填</span>
    <span>{{ label }}</span>
    <el-tooltip v-if="tooltip" :content="tooltip" placement="top">
      <span
        class="common-table-header__icon"
        role="img"
        tabindex="0"
        :aria-label="tooltip"
      >
        <i :class="icon || 'el-icon-question'" aria-hidden="true" />
      </span>
    </el-tooltip>
    <i v-else-if="icon" :class="icon" aria-hidden="true" />
  </span>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  label: string
  required?: boolean
  icon?: string
  tooltip?: string
}>(), {
  required: false,
  icon: '',
  tooltip: ''
})
</script>

<style scoped>
.common-table-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.common-table-header__required {
  color: #f56c6c;
}

.common-table-header__icon {
  display: inline-flex;
  cursor: help;
}

.common-table-header__sr-only {
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  margin: -1px;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
