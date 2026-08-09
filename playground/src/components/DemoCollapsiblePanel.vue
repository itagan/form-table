<template>
  <section class="demo-collapsible-panel">
    <button
      type="button"
      class="demo-collapsible-panel__summary"
      :aria-expanded="isOpen ? 'true' : 'false'"
      @click="isOpen = !isOpen"
    >
      <span class="demo-collapsible-panel__title">{{ title }}</span>
      <span class="demo-collapsible-panel__action">
        {{ isOpen ? '收起' : '展开' }}
        <i :class="isOpen ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
      </span>
    </button>
    <div v-show="isOpen" class="demo-collapsible-panel__content">
      <slot />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  defaultOpen?: boolean
}>(), {
  defaultOpen: false
})

const isOpen = ref(props.defaultOpen)

watch(() => props.defaultOpen, value => {
  isOpen.value = value
})
</script>

<style scoped>
.demo-collapsible-panel__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 32px;
  cursor: pointer;
  width: 100%;
  padding: 0;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  user-select: none;
}
.demo-collapsible-panel__summary:focus { outline: 2px solid #409eff; outline-offset: 3px; }
.demo-collapsible-panel__title { font-size: 20px; font-weight: 600; }
.demo-collapsible-panel__action {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  color: #409eff;
  font-size: 14px;
  font-weight: 500;
}
.demo-collapsible-panel__content { margin-top: 18px; }
</style>
