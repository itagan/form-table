# FormTable

Vue 2.7 + Element UI 的表格内表单组件。组件只负责布局、字段渲染、校验路径和数据更新；行操作与字段联动由调用方维护。

## 核心配置

```ts
const columns = [{
  label: '基本信息',
  props: { minWidth: 320 },
  children: [{
    props: { gutter: 8 },
    children: [{
      key: 'primary-name',
      fieldKey: 'name',
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

Item 的 `key` 是可选渲染身份，`fieldKey` 是必填数据路径。动态增删、排序或重复使用同一 `fieldKey` 时建议提供稳定 `key`。

字段通过 `type` 明确选择渲染模式：

- `type: 'input'`：常用 Element UI 组件快捷映射。
- `type: 'component' + component.renderer`：直接传入自定义组件。
- `type: 'slot' + component.renderer`：完全自定义 scoped slot。

`component.props/listeners/options/optionProps` 是三种模式共用的渲染配置。slot 模式会把解析后的 `component` 通过上下文返回，由模板自行绑定。

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
  <template #actions="{ row, index, updateRow, component }">
    <el-button v-bind="component.props" @click="updateRow({ enabled: !row.enabled })">切换</el-button>
    <el-button @click="removeRow(index)">删除</el-button>
  </template>
</FormTable>
```

Table 原生事件直接透传。通过 ref 可调用 `validate()`、`resetFields()`、`clearValidate()`、`getFormRef()` 和 `getTableRef()`。

表头必填标记等展示使用 `headerSlot` 明确渲染；字段是否必填只由 `formItemProps.rules` 决定。

动态配置只获得当前层级有意义的上下文：Column 为 `tableData`，Row 增加 `row/index`，Field 增加 `fieldKey/value`。组件 listener 额外获得 `setValue/updateRow`；slot 上下文再提供 `propPath/component`，不再回传占位字段。`row/tableData` 采用类型层面的浅只读约束，运行时不冻结对象。

远程 schema 建议只返回布局、`type`、静态 props/options 等 JSON；组件对象、事件函数与 slot 实现由页面按 `fieldKey` 本地增强。核心不执行远程代码，也不维护业务组件注册表。
