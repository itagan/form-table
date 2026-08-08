<template>
  <el-select
    :value="selectedSkuId"
    :disabled="disabled"
    filterable
    placeholder="搜索物料编码或名称"
    style="width: 100%;"
    @change="handleSelect"
  >
    <el-option
      v-for="sku in skus"
      :key="sku.id"
      :label="`${sku.code} / ${sku.name}`"
      :value="sku.id"
    />
  </el-select>
</template>

<script lang="ts" setup>
interface SkuSelection {
  id: string
  code: string
  name: string
  specification: string
  unit: string
  taxRate: number
}

const props = defineProps<{
  selectedSkuId?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'select-sku', sku: SkuSelection, source: 'search'): void
}>()

const skus: SkuSelection[] = [
  { id: 'sku-1001', code: 'M-1001', name: '工业控制器', specification: '8DI/8DO', unit: '台', taxRate: 13 },
  { id: 'sku-1002', code: 'M-1002', name: '温度传感器', specification: '-20~120℃', unit: '只', taxRate: 13 },
  { id: 'sku-1003', code: 'M-1003', name: '屏蔽控制电缆', specification: '4×1.5mm²', unit: '米', taxRate: 13 }
]

const handleSelect = (id: string) => {
  const sku = skus.find(item => item.id === id)
  if (sku) emit('select-sku', sku, 'search')
}
</script>
