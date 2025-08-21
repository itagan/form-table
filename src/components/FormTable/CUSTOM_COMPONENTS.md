# FormTable 自定义组件使用指南

## 概述

FormTable 组件支持通过配置的方式插入自定义组件，提供了灵活的扩展能力。

## 自定义组件配置

### 1. 组件注册

在使用 FormTable 时，通过 `customComponents` 属性注册自定义组件：

```typescript
import PhoneInput from '@/components/CustomComponents/PhoneInput.vue'
import StatusTag from '@/components/CustomComponents/StatusTag.vue'

const customComponents = ref([
  {
    name: 'PhoneInput',        // 组件名称，用于在配置中引用
    component: PhoneInput      // 组件实例
  },
  {
    name: 'StatusTag',
    component: StatusTag
  }
])
```

### 2. 在 FormTable 中使用

```vue
<FormTable
  :table-data="tableData"
  :columns="columns"
  :custom-components="customComponents"
  @update:table-data="handleTableDataUpdate"
/>
```

### 3. 列配置中使用自定义组件

在列配置中，通过设置 `type: 'custom'` 和 `customComponent` 来使用自定义组件：

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

## 自定义组件开发规范

### 1. 组件接口要求

自定义组件需要支持以下接口：

```typescript
interface CustomComponentProps {
  modelValue?: any                    // 双向绑定的值
  [key: string]: any                  // 其他自定义属性
}

interface CustomComponentEmits {
  'update:modelValue': [value: any]   // 更新值的事件
  'change': [value: any]              // 值变化事件
  'blur': [event: Event]              // 失焦事件
  'focus': [event: Event]             // 聚焦事件
}
```

### 2. 组件示例

#### PhoneInput 组件

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
      <template #prefix>
        <span>📱</span>
      </template>
    </el-input>
    <div v-if="showError" class="error-tip">{{ errorMessage }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'

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

// 格式化手机号显示
const formatPhoneNumber = (value: string) => {
  if (!value) return ''
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }
}

// 验证手机号
const validatePhone = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) {
    return { valid: false, message: '请输入手机号' }
  }
  if (numbers.length !== 11) {
    return { valid: false, message: '手机号必须是11位数字' }
  }
  if (!/^1[3-9]\d{9}$/.test(numbers)) {
    return { valid: false, message: '请输入正确的手机号格式' }
  }
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

#### StatusTag 组件

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

## 注意事项

1. **双向绑定**：自定义组件必须支持 `v-model`，即实现 `modelValue` 属性和 `update:modelValue` 事件
2. **事件传递**：组件应该正确传递 `change`、`blur`、`focus` 等事件
3. **属性传递**：通过 `bind` 属性可以传递额外的属性给自定义组件
4. **验证支持**：自定义组件应该与表单验证系统兼容
5. **样式隔离**：建议使用 `scoped` 样式避免样式冲突

## 最佳实践

1. **组件命名**：使用有意义的组件名称，便于维护
2. **类型定义**：为自定义组件定义完整的 TypeScript 类型
3. **错误处理**：在自定义组件中实现适当的错误处理和用户反馈
4. **性能优化**：避免在自定义组件中进行不必要的计算和渲染
5. **文档说明**：为自定义组件编写清晰的使用文档
