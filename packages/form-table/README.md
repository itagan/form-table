# FormTable

Vue 2.7 + Element UI 的表格内表单组件。组件只负责布局、字段渲染、校验路径和数据更新；行操作与字段联动由调用方维护。

## 核心配置

```ts
const columns = [{
  name: '基本信息',
  props: { minWidth: 320 },
  children: [{
    props: { gutter: 8 },
    children: [{
      key: 'name',
      type: 'input',
      colProps: { span: 12 },
      formItemProps: {
        rules: [{ required: true, message: '请输入姓名' }]
      },
      component: {
        props: { clearable: true }
      }
    }]
  }]
}]
```

三种字段渲染模式：

- `type: 'input'`：常用 Element UI 组件快捷映射。
- `component: { is: CustomInput }`：直接传入自定义组件。
- `slot: 'actions'`：完全自定义 scoped slot。

## 使用

```vue
<FormTable
  :table-data="tableData"
  :columns="columns"
  :form-props="{ size: 'small' }"
  :table-props="{ border: true }"
  @update:tableData="tableData = $event"
  @field-change="handleFieldChange"
  @selection-change="handleSelectionChange"
>
  <template #actions="{ row, index, updateRow }">
    <el-button @click="updateRow({ enabled: !row.enabled })">切换</el-button>
    <el-button @click="removeRow(index)">删除</el-button>
  </template>
</FormTable>
```

Table 原生事件直接透传。通过 ref 可调用 `validate()`、`resetFields()`、`clearValidate()`、`getFormRef()` 和 `getTableRef()`。

表头必填标记等展示使用 `headerSlot` 明确渲染；字段是否必填只由 `formItemProps.rules` 决定。
