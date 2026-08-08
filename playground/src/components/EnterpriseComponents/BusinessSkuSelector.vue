<template>
  <el-select
    :value="selectedSkuId"
    :disabled="disabled"
    filterable
    :placeholder="placeholder"
    style="width: 100%;"
    @change="handleSelect"
  >
    <el-option
      v-for="sku in availableSkus"
      :key="sku.id"
      :label="`${sku.code} / ${sku.name} / ${sku.specification}`"
      :value="sku.id"
      :disabled="sku.stock === 0"
    >
      <div class="sku-option">
        <span>{{ sku.code }} · {{ sku.name }}</span>
        <small>{{ sku.specification }}｜库存 {{ sku.stock }} {{ sku.unit }}</small>
      </div>
    </el-option>
  </el-select>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface SkuSelection {
  id: string
  code: string
  name: string
  specification: string
  unit: string
  taxRate: number
  stock: number
}

const props = withDefaults(defineProps<{
  selectedSkuId?: string
  disabled?: boolean
  placeholder?: string
  includeOutOfStock?: boolean
}>(), {
  selectedSkuId: '',
  disabled: false,
  placeholder: '搜索物料编码或名称',
  includeOutOfStock: true
})

const emit = defineEmits<{
  (event: 'select-sku', sku: SkuSelection, source: 'search'): void
}>()

const skus: SkuSelection[] = [
  { id: 'sku-1001', code: 'M-1001', name: '工业控制器', specification: '8DI/8DO', unit: '台', taxRate: 13, stock: 28 },
  { id: 'sku-1002', code: 'M-1002', name: '温度传感器', specification: '-20~120℃', unit: '只', taxRate: 13, stock: 116 },
  { id: 'sku-1003', code: 'M-1003', name: '屏蔽控制电缆', specification: '4×1.5mm²', unit: '米', taxRate: 13, stock: 0 }
]

// 模拟接口返回的物料权限过滤；业务项目中可替换为远程搜索结果。
const availableSkus = computed(() => (
  props.includeOutOfStock === false ? skus.filter(sku => sku.stock > 0) : skus
))

const handleSelect = (id: string) => {
  const sku = skus.find(item => item.id === id)
  if (sku) emit('select-sku', sku, 'search')
}
</script>

<style scoped>
.sku-option {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.sku-option small {
  color: #909399;
}
</style>
