# Enter 字段导航

> 可运行 Demo：[行列操作与异步提交 ↗](http://localhost:5173/row-column-operations)

FormTable 默认不接管键盘。传入 `navigationOptions` 后，普通单行编辑控件可使用 Enter 移动到下一个已挂载字段，Shift+Enter 返回上一个字段：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :navigation-options="{ enabled: true }"
/>
```

传入空对象同样启用；需要保留配置引用并临时关闭时设置 `enabled: false`。省略整个 Prop 时，Enter 行为与升级前完全一致。

## 导航规则

- 顺序来自当前实际 DOM，会跟随 Element Table 排序、筛选以及字段动态显隐。
- 隐藏、未挂载、禁用、只读或没有可聚焦内容的字段会被跳过。
- Enter 前进，Shift+Enter 后退；到达首尾后停止，不循环。
- Tab、Shift+Tab 保持浏览器原生行为。
- Textarea、`contenteditable`、按钮和 `role="button"` 不接管 Enter。
- 输入法组合期间、Ctrl/Cmd/Alt+Enter 不接管。

字段 Slot 和自定义组件只要在 FormItem 内提供标准可聚焦元素即可参与导航。复杂组件若需要自定义内部焦点顺序，应自行处理键盘，并在对应目标上阻止事件继续冒泡。

## 与 Ref 聚焦方法的关系

键盘导航与 `focusField(row, fieldKey)`、`scrollToFirstError()` 共用同一套挂载字段查询和聚焦规则，不维护另一份字段注册表。程序化跳转使用 Ref；用户连续录入使用可选键盘导航。

当前能力不提供 Tab 网格模式、循环导航、复制粘贴或向下填充。跨行批量写回使用 Ref `updateRows`，复杂表格快捷键由业务页面或字段组件实现。

## 相关 API

[FormTable Props](../api/form-table.md) · [校验、清理与重置](./validation-reset.md) · [数据更新与受控回写](./data-updates.md)
