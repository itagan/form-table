<template>
  <div class="simple-test" style="border: 2px solid red; padding: 10px; background: yellow;">
    <h4>简单测试组件</h4>
    <p>值: {{ value }}</p>
    <el-button @click="handleClick">点击我</el-button>
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
      console.log('SimpleTest clicked, new value:', newValue)
    }
  }
})
</script>

<style scoped>
.simple-test {
  margin: 5px 0;
}
</style>
