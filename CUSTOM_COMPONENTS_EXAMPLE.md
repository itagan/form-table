# FormTable 自定义组件使用示例

## 1. 创建自定义组件

### PhoneInput 组件 (src/components/CustomComponents/PhoneInput.vue)
```vue
<template>
  <div class="phone-input-wrapper">
    <el-input
      v-model="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      @input="handleInput"
      @blur="handleBlur"
    >
      <template #prefix>📱</template>
    </el-input>
    <div v-if="showError" class="error-tip">{{ errorMessage }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入手机号',
  disabled: false,
  clearable: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
  'blur': [event: Event]
}>()

const displayValue = ref('')
const showError = ref(false)
const errorMessage = ref('')

const formatPhoneNumber = (value: string) => {
  if (!value) return ''
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
}

const validatePhone = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return { valid: false, message: '请输入手机号' }
  if (numbers.length !== 11) return { valid: false, message: '手机号必须是11位数字' }
  if (!/^1[3-9]\d{9}$/.test(numbers)) return { valid: false, message: '请输入正确的手机号格式' }
  return { valid: true, message: '' }
}

const handleInput = (value: string) => {
  const formatted = formatPhoneNumber(value)
  displayValue.value = formatted
  
  const numbers = value.replace(/\D/g, '')
  const validation = validatePhone(numbers)
  
  showError.value = !validation.valid && numbers.length > 0
  errorMessage.value = validation.message
  
  emit('update:modelValue', numbers)
  emit('change', numbers)
}

const handleBlur = (event: Event) => {
  const numbers = displayValue.value.replace(/\D/g, '')
  const validation = validatePhone(numbers)
  
  if (numbers && !validation.valid) {
    showError.value = true
    errorMessage.value = validation.message
  } else {
    showError.value = false
  }
  
  emit('blur', event)
}

watch(() => props.modelValue, (newValue) => {
  if (newValue !== displayValue.value.replace(/\D/g, '')) {
    displayValue.value = formatPhoneNumber(newValue || '')
  }
}, { immediate: true })
</script>

<style lang="less" scoped>
.phone-input-wrapper {
  position: relative;
  
  .error-tip {
    position: absolute;
    top: 100%;
    left: 0;
    color: #f56c6c;
    font-size: 12px;
    line-height: 1;
    margin-top: 4px;
  }
}
</style>
```

### StatusTag 组件 (src/components/CustomComponents/StatusTag.vue)
```vue
<template>
  <div class="status-tag-wrapper">
    <el-tag
      :type="tagType"
      :size="size"
      :effect="effect"
      @click="handleClick"
    >
      {{ displayText }}
    </el-tag>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  modelValue?: string | boolean | number
  options?: Array<{
    value: string | boolean | number
    label: string
    type?: 'success' | 'warning' | 'danger' | 'info'
  }>
  size?: 'large' | 'default' | 'small'
  effect?: 'dark' | 'light' | 'plain'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  options: () => [
    { value: true, label: '启用', type: 'success' },
    { value: false, label: '禁用', type: 'danger' },
    { value: 'pending', label: '待处理', type: 'warning' },
    { value: 'processing', label: '处理中', type: 'info' }
  ],
  size: 'default',
  effect: 'light'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | boolean | number]
  'change': [value: string | boolean | number]
  'click': [event: Event]
}>()

const currentOption = computed(() => {
  return props.options.find(option => option.value === props.modelValue) || props.options[0]
})

const tagType = computed(() => {
  return currentOption.value?.type || 'info'
})

const displayText = computed(() => {
  return currentOption.value?.label || String(props.modelValue)
})

const handleClick = (event: Event) => {
  emit('click', event)
}
</script>

<style lang="less" scoped>
.status-tag-wrapper {
  .el-tag {
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .el-tag:hover {
    transform: scale(1.05);
  }
}
</style>
```

## 2. 在 FormTable 中使用

### 导入自定义组件
```typescript
import PhoneInput from '@/components/CustomComponents/PhoneInput.vue'
import StatusTag from '@/components/CustomComponents/StatusTag.vue'
```

### 注册自定义组件
```typescript
const customComponents = ref([
  {
    name: 'PhoneInput',
    component: PhoneInput
  },
  {
    name: 'StatusTag',
    component: StatusTag
  }
])
```

### 配置列定义
```typescript
const columns = ref<ColumnConfig[]>([
  {
    name: '联系方式',
    props: { width: '300px' },
    children: [{
      children: [
        {
          key: 'phone',
          type: 'custom',                    // 指定为自定义组件类型
          customComponent: 'PhoneInput',     // 指定自定义组件名称
          colSpan: 24,
          placeholder: '请输入手机号'
        }
      ]
    }]
  },
  {
    name: '工作状态',
    props: { width: '200px' },
    children: [{
      children: [
        {
          key: 'workStatus',
          type: 'custom',
          customComponent: 'StatusTag',
          colSpan: 24,
          options: [                          // 传递给自定义组件的属性
            { value: 'processing', label: '处理中', type: 'info' },
            { value: 'pending', label: '待处理', type: 'warning' },
            { value: 'completed', label: '已完成', type: 'success' },
            { value: 'failed', label: '失败', type: 'danger' }
          ]
        }
      ]
    }]
  }
])
```

### 在模板中使用
```vue
<FormTable
  ref="formTableRef"
  :table-data="tableData"
  :columns="columns"
  :rules="rules"
  :form-data="formData"
  :loading="loading"
  :custom-components="customComponents"
  @update:table-data="handleTableDataUpdate"
/>
```

## 3. 关键要点

1. **组件接口**：自定义组件必须支持 `v-model`（`modelValue` + `update:modelValue`）
2. **事件传递**：实现 `change`、`blur`、`focus` 等事件
3. **属性传递**：通过 `bind` 属性传递额外属性
4. **验证支持**：与表单验证系统兼容
5. **样式隔离**：使用 `scoped` 样式避免冲突

## 4. 运行效果

运行项目后，您将看到：
- 手机号输入框带有格式化显示（xxx-xxxx-xxxx）
- 实时验证手机号格式
- 状态标签显示不同颜色的状态
- 完整的表单验证功能
