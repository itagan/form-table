<template>
  <CompanySupplierPicker
    :supplier-id="value"
    :org-code="orgCode"
    :disabled="disabled"
    @supplier-change="handleSupplierChange"
  />
</template>

<script lang="ts" setup>
import CompanySupplierPicker from './CompanySupplierPicker.vue'

interface SupplierSelection {
  id: string
  code: string
  name: string
  taxRate: number
}

defineProps<{
  value?: string
  orgCode?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'input', value: string): void
  (event: 'supplier-change', supplier: SupplierSelection | null, source: 'favorite' | 'search'): void
}>()

const handleSupplierChange = (
  supplier: SupplierSelection | null,
  source: 'favorite' | 'search'
) => {
  // Adapter 只归一化历史组件协议，并完整保留额外业务事件。
  emit('input', supplier?.id || '')
  emit('supplier-change', supplier, source)
}
</script>
