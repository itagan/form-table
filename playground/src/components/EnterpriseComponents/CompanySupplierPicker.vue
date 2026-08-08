<template>
  <el-select
    :value="supplierId"
    :disabled="disabled || !orgCode"
    filterable
    clearable
    :placeholder="orgCode ? '搜索供应商名称或编码' : '请先选择采购组织'"
    style="width: 100%;"
    @change="handleSelect"
  >
    <el-option
      v-for="supplier in availableSuppliers"
      :key="supplier.id"
      :label="`${supplier.code} / ${supplier.name}`"
      :value="supplier.id"
    >
      <div class="supplier-option">
        <span>{{ supplier.code }} · {{ supplier.name }}</span>
        <el-tag v-if="supplier.favorite" size="mini" type="warning">常用</el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface Supplier {
  id: string
  code: string
  name: string
  orgCodes: string[]
  taxRate: number
  favorite: boolean
}

const props = defineProps<{
  supplierId?: string
  orgCode?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'supplier-change', supplier: Supplier | null, source: 'favorite' | 'search'): void
}>()

const suppliers: Supplier[] = [
  { id: 'supplier-1', code: 'SUP-001', name: '华东自动化设备有限公司', orgCodes: ['HZ-PURCHASE', 'SH-PURCHASE'], taxRate: 13, favorite: true },
  { id: 'supplier-2', code: 'SUP-002', name: '精密传感科技有限公司', orgCodes: ['HZ-PURCHASE', 'SZ-PURCHASE'], taxRate: 13, favorite: false },
  { id: 'supplier-3', code: 'SUP-003', name: '南方工业电缆集团', orgCodes: ['SZ-PURCHASE'], taxRate: 13, favorite: true }
]

// 供应商可选范围跟随当前采购组织，模拟常见的组织权限约束。
const availableSuppliers = computed(() => {
  if (!props.orgCode) return []
  return suppliers.filter(supplier => supplier.orgCodes.includes(props.orgCode as string))
})

const handleSelect = (id: string) => {
  const supplier = suppliers.find(item => item.id === id) || null
  // 第二个参数用于演示 FormTable 对多参数业务事件的适配能力。
  emit('supplier-change', supplier, supplier?.favorite ? 'favorite' : 'search')
}
</script>

<style scoped>
.supplier-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
</style>
