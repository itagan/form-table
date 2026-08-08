<template>
  <el-cascader
    :value="selectedPath"
    :options="organizationTree"
    :disabled="disabled"
    :props="cascaderProps"
    clearable
    filterable
    placeholder="请选择区域 / 采购组织"
    style="width: 100%;"
    @change="handleSelect"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface Organization {
  code: string
  name: string
  regionCode: string
  costCenter: string
}

const props = defineProps<{
  selectedCode?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'node-select', organization: Organization | null): void
}>()

const organizations: Organization[] = [
  { code: 'HZ-PURCHASE', name: '杭州采购中心', regionCode: 'EAST', costCenter: 'CC-HZ-01' },
  { code: 'SH-PURCHASE', name: '上海采购中心', regionCode: 'EAST', costCenter: 'CC-SH-01' },
  { code: 'SZ-PURCHASE', name: '深圳采购中心', regionCode: 'SOUTH', costCenter: 'CC-SZ-01' }
]

// 固定配置避免组件更新时重复创建对象并触发级联选择器无效刷新。
const cascaderProps = { emitPath: true }

const organizationTree = [
  {
    value: 'EAST',
    label: '华东区域',
    children: organizations
      .filter(item => item.regionCode === 'EAST')
      .map(item => ({ value: item.code, label: `${item.name}（${item.costCenter}）` }))
  },
  {
    value: 'SOUTH',
    label: '华南区域',
    children: organizations
      .filter(item => item.regionCode === 'SOUTH')
      .map(item => ({ value: item.code, label: `${item.name}（${item.costCenter}）` }))
  }
]

const selectedPath = computed(() => {
  const organization = organizations.find(item => item.code === props.selectedCode)
  return organization ? [organization.regionCode, organization.code] : []
})

// 级联组件输出完整路径，业务事件只暴露最终组织对象。
const handleSelect = (path: string[]) => {
  const code = path[path.length - 1]
  const organization = organizations.find(item => item.code === code) || null
  emit('node-select', organization)
}
</script>
