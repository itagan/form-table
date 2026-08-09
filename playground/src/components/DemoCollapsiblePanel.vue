<template>
  <el-collapse v-model="activeNames" class="demo-collapsible-panel">
    <el-collapse-item :name="panelName">
      <template #title>
        <span class="demo-collapsible-panel__title">{{ title }}</span>
      </template>
      <div class="demo-collapsible-panel__content">
        <slot />
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  defaultOpen?: boolean
}>(), {
  defaultOpen: false
})

const panelName = 'content'
const activeNames = ref<string[]>(props.defaultOpen ? [panelName] : [])

watch(() => props.defaultOpen, value => {
  activeNames.value = value ? [panelName] : []
})
</script>

<style scoped>
.demo-collapsible-panel { border-top: 0; border-bottom: 0; }
.demo-collapsible-panel__title { font-size: 20px; font-weight: 600; }
.demo-collapsible-panel__content { margin-top: 18px; }
:deep(.el-collapse-item__header) {
  min-height: 32px;
  height: auto;
  line-height: 1.4;
  background: transparent;
}
:deep(.el-collapse-item__wrap) { background: transparent; border-bottom: 0; }
:deep(.el-collapse-item__content) { padding-bottom: 0; }
</style>
