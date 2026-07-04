<template>
  <div class="simple-test">
    <div>
      <strong>简单测试组件</strong>
      <span>值：{{ value }}</span>
    </div>
    <el-button size="mini" @click="handleClick">切换</el-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'SimpleTest',
  props: {
    value: {
      type: String,
      default: '默认值'
    }
  },
  methods: {
    handleClick() {
      const newValue = this.value === '默认值' ? '新值' : '默认值'
      this.$emit('input', newValue)
      this.$emit('change', newValue)
    }
  }
})
</script>

<style scoped>
.simple-test {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #dfe5ef;
  border-radius: 6px;
}

.simple-test strong,
.simple-test span {
  display: block;
}

.simple-test strong {
  color: #111827;
  font-size: 13px;
}

.simple-test span {
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
}
</style>
