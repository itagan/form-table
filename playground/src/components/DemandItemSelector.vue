<template>
  <section class="selector-card">
    <div class="selector-heading">
      <strong>选择要填写的需求项</strong>
      <el-tag size="small" type="info">独立组件</el-tag>
    </div>

    <el-checkbox-group :value="selectedKeys" @input="emitSelection">
      <el-checkbox
        v-for="option in options"
        :key="option.key"
        :label="option.key"
      >
        {{ option.label }}
      </el-checkbox>
    </el-checkbox-group>

    <p>组件通过 selected-keys 接收值，勾选变化后通过 change(selectedKeys) 向父页面传参。</p>
  </section>
</template>

<script lang="ts" setup>
interface DemandSelectionOption {
  key: string
  label: string
}

defineProps<{
  options: DemandSelectionOption[]
  selectedKeys: string[]
}>()

const emit = defineEmits<{
  (event: 'change', selectedKeys: string[]): void
}>()

const emitSelection = (selectedKeys: string[]) => {
  emit('change', [...selectedKeys])
}
</script>

<style scoped>
.selector-card {
  margin-top: 20px;
  padding: 22px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.selector-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

p {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 13px;
}
</style>
