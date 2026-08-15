# 校验、清理与重置

> 可运行 Demo：[基础表格表单 ↗](http://localhost:5173/form-table)

FormTable 复用 Element UI `el-form-item` 的 rules 和 Form 实例，只负责为表格行字段生成完整校验路径。

## 配置校验规则

```ts
const columns: ColumnConfig[] = [{
  label: '联系人',
  formItems: [{
    fieldKey: 'profile.phone',
    type: 'input',
    formItemProps: {
      rules: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }
      ]
    }
  }]
}]
```

第一行的 `profile.phone` 会自动生成：

```text
tableData.0.profile.phone
```

不要在 `formItemProps.prop` 中手工拼接下标；该属性会被 FormTable 生成的路径覆盖。

## 校验整表

```vue
<FormTable ref="formTableRef" v-model="tableData" :columns="columns" />
```

```ts
const valid = await formTableRef.value?.validate()

if (valid) {
  await submit(tableData.value)
}
```

`validate()` 统一返回 `Promise<boolean>`。校验失败返回 `false`，调用方不需要捕获 rejected Promise。

## 校验单个字段

字段 Slot 可以直接使用 scope 中的 `propPath`：

```vue
<template #phone-editor="{ propPath }">
  <el-button @click="validateField(propPath)">校验手机号</el-button>
</template>
```

```ts
function validateField(propPath) {
  formTableRef.value
    ?.getFormRef()
    ?.validateField?.(propPath)
}
```

普通字段也可以按规则拼接 `tableData.${index}.${fieldKey}`，但行变动后不要缓存旧路径。

## 清除校验状态

```ts
formTableRef.value?.clearValidate()
```

新增、删除、复制、移动或服务端刷新行后，数组下标可能变化。建议在 DOM 更新后清理旧校验状态：

```ts
tableData.value = removeRow(tableData.value, id)
await nextTick()
formTableRef.value?.clearValidate()
```

只清理某个字段时，可使用原生 Form Ref：

```ts
formTableRef.value
  ?.getFormRef()
  ?.clearValidate?.('tableData.0.profile.phone')
```

## 重置受控数据

FormTable 不公开数据重置方法。受控业务显式保存并恢复初始快照：

```ts
const initialTableData = cloneDeep(tableData.value)

async function resetTable() {
  tableData.value = cloneDeep(initialTableData)
  await nextTick()
  formTableRef.value?.clearValidate()
}
```

这样可以明确决定是否删除新增行、恢复已删除行，以及哪些服务端字段需要保留。

如确需 Element Form 原生行为，可以调用 `getFormRef().resetFields()`；它会直接修改 `tableData`，并且不会发出 `update:tableData` 或 `field-change`，不属于 FormTable 的受控更新协议。

## 动态规则

`formItemProps` 可以根据当前行返回不同 rules：

```ts
formItemProps: ({ row }) => ({
  rules: row.contactType === 'phone'
    ? [{ required: true, message: '请输入手机号', trigger: 'blur' }]
    : []
})
```

动态规则函数应保持纯计算，不在其中修改数据或调用接口。异步业务校验继续使用 Element UI validator callback 协议。

## 选择方法

| 需求 | 方法 |
| --- | --- |
| 提交前校验全部字段 | `await validate()` |
| 校验某个动态字段 | `getFormRef().validateField(propPath)` |
| 行变化后清除旧错误 | `clearValidate()` |
| 完全使用 Element 原生重置 | `getFormRef().resetFields()`（绕过受控协议） |
| 按业务初始数据重置 | 替换 `tableData` 后调用 `clearValidate()` |

## 相关 API

[Column / Item](../api/columns.md) · [事件与 Ref](../api/events-and-ref.md)
