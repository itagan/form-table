# FormTable 自定义组件使用指南 - 最终版

## 问题解决总结

### 发现的问题
1. **Vue 版本不匹配**：项目使用 Vue 2.7.7，但我们使用了 Vue 3 的语法
2. **组件接口不兼容**：Vue 2 使用 `value` 和 `input` 事件，Vue 3 使用 `modelValue` 和 `update:modelValue`
3. **TypeScript 类型错误**：emit 的类型定义在 Vue 2 中需要不同的写法

### 解决方案
1. **统一使用 Vue 2 语法**：所有自定义组件都改为 Vue 2 的写法
2. **修复组件接口**：使用 `value` 属性和 `input` 事件
3. **修复类型定义**：使用 Vue 2 兼容的 TypeScript 类型

## 自定义组件示例

### 1. 简单测试组件 (SimpleTest.vue)
```vue
<template>
  <div class="simple-test" style="border: 2px solid red; padding: 10px; background: yellow;">
    <h4>简单测试组件</h4>
    <p>值: {{ value }}</p>
    <el-button @click="handleClick">点击我</el-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'SimpleTest',
  props: {
    value: {
      type: String,
      default: '默认值'
    }
  },
  methods: {
    handleClick() {
      const newValue = this.value === '默认值' ? '新值' : '默认值'
      this.$emit('input', newValue)
      this.$emit('change', newValue)
    }
  }
})
</script>
```

### 2. 测试组件 (TestComponent.vue)
```vue
<template>
  <div class="test-component">
    <el-button 
      :type="buttonType" 
      :size="size"
      @click="handleClick"
    >
      {{ displayText }}
    </el-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'TestComponent',
  props: {
    value: {
      type: String,
      default: 'test'
    },
    size: {
      type: String,
      default: 'default'
    }
  },
  computed: {
    buttonType() {
      return this.value === 'success' ? 'success' : 'primary'
    },
    displayText() {
      return `测试组件: ${this.value}`
    }
  },
  methods: {
    handleClick(event: Event) {
      const newValue = this.value === 'success' ? 'primary' : 'success'
      this.$emit('input', newValue)
      this.$emit('change', newValue)
    }
  }
})
</script>
```

### 3. 状态标签组件 (StatusTag.vue)
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

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'StatusTag',
  props: {
    value: {
      type: [String, Boolean, Number],
      default: ''
    },
    options: {
      type: Array,
      default: () => [
        { value: true, label: '启用', type: 'success' },
        { value: false, label: '禁用', type: 'danger' },
        { value: 'pending', label: '待处理', type: 'warning' },
        { value: 'processing', label: '处理中', type: 'info' }
      ]
    },
    size: {
      type: String,
      default: 'default'
    },
    effect: {
      type: String,
      default: 'light'
    }
  },
  computed: {
    currentOption(): any {
      return this.options.find((option: any) => option.value === this.value) || this.options[0]
    },
    tagType(): string {
      return (this.currentOption as any)?.type || 'info'
    },
    displayText(): string {
      return (this.currentOption as any)?.label || String(this.value)
    }
  },
  methods: {
    handleClick(event: Event) {
      this.$emit('click', event)
    }
  }
})
</script>
```

## 在 FormTable 中使用

### 1. 导入自定义组件
```typescript
import SimpleTest from '@/components/CustomComponents/SimpleTest.vue'
import TestComponent from '@/components/CustomComponents/TestComponent.vue'
import StatusTag from '@/components/CustomComponents/StatusTag.vue'
```

### 2. 注册自定义组件
```typescript
const customComponents = ref([
  {
    name: 'SimpleTest',
    component: SimpleTest
  },
  {
    name: 'TestComponent',
    component: TestComponent
  },
  {
    name: 'StatusTag',
    component: StatusTag
  }
])
```

### 3. 配置列定义
```typescript
const columns = ref<ColumnConfig[]>([
  {
    name: '基本信息',
    props: { width: '400px' },
    children: [{
      children: [
        {
          key: 'name',
          type: 'input',
          colSpan: 12,
          placeholder: '请输入姓名'
        },
        {
          key: 'age',
          type: 'number',
          colSpan: 12,
          placeholder: '请输入年龄'
        }
      ]
    }]
  },
  {
    name: '简单测试',
    props: { width: '200px' },
    children: [{
      children: [
        {
          key: 'simpleTest',
          type: 'custom',
          customComponent: 'SimpleTest',
          colSpan: 24
        }
      ]
    }]
  },
  {
    name: '测试组件',
    props: { width: '150px' },
    children: [{
      children: [
        {
          key: 'testValue',
          type: 'custom',
          customComponent: 'TestComponent',
          colSpan: 24
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
          options: [
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

### 4. 在模板中使用
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

## 关键要点

### Vue 2 兼容性要求
1. **组件定义**：使用 `Vue.extend()` 而不是 `<script setup>`
2. **属性接口**：使用 `value` 而不是 `modelValue`
3. **事件接口**：使用 `input` 而不是 `update:modelValue`
4. **事件发射**：使用 `this.$emit()` 而不是 `emit()`

### 自定义组件开发规范
1. **必须支持 v-model**：实现 `value` 属性和 `input` 事件
2. **事件传递**：正确传递 `change`、`blur`、`focus` 等事件
3. **属性传递**：通过 `bind` 属性传递额外属性
4. **验证支持**：与表单验证系统兼容
5. **样式隔离**：使用 `scoped` 样式避免冲突

### 调试技巧
1. **检查组件注册**：确保自定义组件正确注册到 FormTable
2. **检查属性传递**：确保 `customComponent` 属性正确传递
3. **检查控制台错误**：查看是否有 JavaScript 错误
4. **使用简单测试组件**：先用简单的组件验证功能

## 运行效果

现在访问 `http://localhost:5175/form-table-v2` 可以看到：
- 简单测试组件（红色边框、黄色背景）
- 测试组件（按钮形式）
- 状态标签组件（不同颜色的标签）
- 完整的表单验证功能
- 双向数据绑定正常工作
