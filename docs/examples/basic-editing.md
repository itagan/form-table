# 基础编辑示例

> 可运行 Demo：[打开基础编辑页 ↗](http://localhost:5173/form-table)

这个示例是理解 FormTable 的最小完整起点：一份受控 `tableData`、一组 `columns`、内置字段组件和 Element Form 校验。

## 页面包含什么

| 能力 | 配置位置 |
| --- | --- |
| 姓名、年龄等字段布局 | `columns[].formItems` |
| 输入框、数字、选择器和时间选择 | Item `type` |
| 必填规则 | `formItemProps.rules` |
| Placeholder、范围和选项 | `component.props/options` |
| 表头和字段提示 | `headerHint`、Item `hint`、`hintOptions` |
| 添加和删除行 | 页面替换 `tableData` |
| 提交前校验 | FormTable Ref `validate()` |

## 最小数据流

```text
用户输入
→ 字段组件 model 事件
→ FormTable 创建新行和新数组
→ update:tableData
→ 页面 v-model 回写
→ 表格显示新值
```

因此 `tableData` 必须由页面维护。FormTable 不保存另一份内部业务数据，也不会直接修改传入数组。

## 添加和删除行

行结构变化属于页面业务操作：

```ts
const addRow = () => {
  tableData.value = [
    ...tableData.value,
    { name: '', age: 0, school: '', appointmentTime: '' }
  ]
}

const removeRow = () => {
  tableData.value = tableData.value.slice(0, -1)
  formTableRef.value?.clearValidate()
}
```

不要通过字段 Slot 的 `updateRow` 新增或删除数组项；它只负责更新触发时对应的当前行。

## 校验与保存

```ts
const submit = async () => {
  const valid = await formTableRef.value?.validate()
  if (!valid) return

  await saveRows(tableData.value)
}
```

`validate()` 只返回校验结果，不发起请求。保存状态、接口错误和提交 DTO 转换都由页面负责。

## 下一步

- 需要接口加载、脏状态、保存和撤销：看[完整编辑提交流程](./form-workflow.md)。
- 需要行增删复制操作列：看[常见操作列与行增删](../features/common-row-actions.md)。
- 需要接入业务组件：看[自定义字段组件](../features/custom-component.md)。
- 出现值恢复或校验错位：看[排错指南](../guide/troubleshooting.md)。
