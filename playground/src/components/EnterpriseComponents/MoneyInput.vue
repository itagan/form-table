<template>
  <div class="money-input">
    <span class="currency">{{ currency }}</span>
    <el-input-number
      :value="amount"
      :disabled="disabled"
      :min="min"
      :precision="precision"
      :controls="false"
      style="width: 100%;"
      @change="handleChange"
    />
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  amount?: number
  currency?: string
  precision?: number
  min?: number
  disabled?: boolean
}>(), {
  amount: 0,
  currency: 'CNY',
  precision: 2,
  min: 0,
  disabled: false
})

const emit = defineEmits<{
  (event: 'amount-change', amount: number, meta: { currency: string; formatted: string }): void
}>()

// 公司金额组件使用自定义协议，并同时返回格式化结果供审计或埋点使用。
const handleChange = (amount: number | undefined) => {
  const normalized = Number(amount || 0)
  emit('amount-change', normalized, {
    currency: props.currency,
    formatted: normalized.toFixed(props.precision)
  })
}
</script>

<style scoped>
.money-input {
  display: flex;
  align-items: center;
  width: 100%;
}

.currency {
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  color: #606266;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-right: 0;
  border-radius: 4px 0 0 4px;
  font-size: 12px;
}

.money-input :deep(.el-input__inner) {
  border-radius: 0 4px 4px 0;
  text-align: right;
}
</style>
