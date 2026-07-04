<template>
  <div class="status-tag-wrapper">
    <el-tag
      :type="tagType"
      :size="size"
      :effect="effect"
      :closable="closable"
      :disable-transitions="disableTransitions"
      @click="handleClick"
      @close="handleClose"
    >
      {{ displayText }}
    </el-tag>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'StatusTag',
  props: {
    value: {
      type: [String, Boolean, Number],
      default: ''
    },
    options: {
      type: Array,
      default: () => [
        { value: true, label: '启用', type: 'success' },
        { value: false, label: '禁用', type: 'danger' },
        { value: 'pending', label: '待处理', type: 'warning' },
        { value: 'processing', label: '处理中', type: 'info' }
      ]
    },
    size: {
      type: String,
      default: 'default'
    },
    effect: {
      type: String,
      default: 'light'
    },
    closable: {
      type: Boolean,
      default: false
    },
    disableTransitions: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    currentOption(): any {
      return this.options.find((option: any) => option.value === this.value) || this.options[0]
    },
    tagType(): string {
      return (this.currentOption as any)?.type || 'info'
    },
    displayText(): string {
      return (this.currentOption as any)?.label || String(this.value)
    }
  },
  methods: {
    handleClick(event: Event) {
      this.$emit('click', event)
    },
    handleClose(event: Event) {
      this.$emit('close', event)
    }
  }
})
</script>

<style lang="less" scoped>
.status-tag-wrapper {
  .el-tag {
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .el-tag:hover {
    transform: scale(1.05);
  }
}
</style>
