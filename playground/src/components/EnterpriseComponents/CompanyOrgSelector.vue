<template>
  <el-select
    :value="selectedCode"
    :disabled="disabled"
    placeholder="请选择采购组织"
    style="width: 100%;"
    @change="handleSelect"
  >
    <el-option
      v-for="organization in organizations"
      :key="organization.code"
      :label="organization.name"
      :value="organization.code"
    />
  </el-select>
</template>

<script lang="ts" setup>
const props = defineProps<{
  selectedCode?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'node-select', organization: { code: string; name: string }): void
}>()

const organizations = [
  { code: 'HZ-PURCHASE', name: '杭州采购中心' },
  { code: 'SH-PURCHASE', name: '上海采购中心' },
  { code: 'SZ-PURCHASE', name: '深圳采购中心' }
]

const handleSelect = (code: string) => {
  const organization = organizations.find(item => item.code === code)
  if (organization) emit('node-select', organization)
}
</script>
