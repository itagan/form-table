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

`component.props/listeners/options/optionProps` 是三种模式共用的渲染配置。自定义组件默认保留 Vue 2 原生 `v-model`，也可通过 `component.model` 指定 `{ prop, event, valueFromEvent }`，或设为 `false` 禁用模型注入。slot 模式会把解析后的 `component` 通过上下文返回，由模板自行绑定。

Slot 内容直接渲染，不附加内部 `div/span` 包装；需要根节点样式时由 Slot 模板自行提供。

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

字段规则直接配置在 `formItemProps.rules`。`resetFields()` 保持 Element UI 原生语义；受控场景由调用方恢复 `tableData` 后调用 `clearValidate()`。单字段校验等底层能力可通过 `getFormRef()` 使用。

表头必填标记等展示使用 `headerSlot` 明确渲染；字段是否必填只由 `formItemProps.rules` 决定。

动态配置只获得当前层级有意义的上下文：Column 为 `tableData/columnConfig`，Row 增加 `row/index/rowConfig`，Field 增加 `fieldKey/value/itemConfig`。组件 listener 额外获得 `setValue/updateRow`；slot 上下文再提供 `propPath/component`，不回传占位字段。数据和配置引用采用类型层面的浅只读约束，运行时不冻结对象。

命名边界：`row` 是当前业务数据行，`rowConfig` 是布局配置；`itemConfig` 是原始字段配置，Slot 的 `component` 是当前行解析后的组件配置。

`tableProps.rowKey` 是可选能力。普通同步编辑和增删行依靠对象引用即可；异步 listener 等待期间可能刷新、克隆或替换全部行对象时，建议配置唯一稳定的 rowKey。更新助手会在最新 `tableData` 中重新定位，目标行不存在时忽略更新，避免误写其他行。

远程 schema 建议只返回布局、`type`、静态 props/options 等 JSON；组件对象、事件函数与 slot 实现由页面按 `fieldKey` 本地增强。核心不执行远程代码，也不维护业务组件注册表。
