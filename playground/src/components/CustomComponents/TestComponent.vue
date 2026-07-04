<template>
  <div class="test-component">
    <el-button 
      :type="buttonType" 
      :size="size"
      @click="handleClick"
    >
      {{ displayText }}
    </el-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'TestComponent',
  props: {
    value: {
      type: String,
      default: 'test'
    },
    size: {
      type: String,
      default: 'default'
    }
  },
  computed: {
    buttonType() {
      return this.value === 'success' ? 'success' : 'primary'
    },
    displayText() {
      return `测试组件: ${this.value}`
    }
  },
  methods: {
    handleClick(event: Event) {
      const newValue = this.value === 'success' ? 'primary' : 'success'
      this.$emit('input', newValue)
      this.$emit('change', newValue)
      this.$emit('click', event)
    }
  }
})
</script>

<style scoped>
.test-component {
  padding: 4px;
}
</style>
