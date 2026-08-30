# 样式定位与属性透传

当一个字段需要单独调整对齐、宽度、间距或状态样式时，先确定目标节点，再把 `class/style` 放到对应配置层。FormTable 不要求业务通过深层 Element UI 选择器猜测 DOM。

## 配置与目标节点

一个字段列的实际结构可以简化为：

```text
FormTable
└─ el-table-column 单元格
   └─ el-row                         columns[].rowProps
      └─ el-col                      formItems[].colProps
         └─ el-form-item             formItems[].formItemProps
            └─ 实际字段组件           formItems[].component.props
```

| 想调整的位置 | 配置入口 | 常见用途 |
| --- | --- | --- |
| 同一表格单元格内的字段整体布局 | `columns[].rowProps` | gutter、换行、水平和垂直对齐、整组背景 |
| 某个字段占用的栅格区域 | `formItems[].colProps` | span、offset、字段列宽、字段外围留白 |
| 某个 FormItem | `formItems[].formItemProps` | Label、校验区域、底部间距、状态 class |
| 输入框或业务组件根节点 | `formItems[].component.props` | width、输入组件 class、组件自身 Props |

`rowProps`、`colProps` 和 `formItemProps` 都是对对应 Element UI 组件的透传，并支持静态对象或动态函数。`component.props` 传给最终实际字段组件。

## 一次配置四个层级

```ts
const columns = [{
  label: '联系方式',
  rowProps: {
    gutter: 8,
    class: 'contact-field-row',
    style: { alignItems: 'center' }
  },
  formItems: [{
    fieldKey: 'phone',
    type: 'input',
    colProps: {
      span: 12,
      class: 'phone-field-col',
      style: { paddingRight: '4px' }
    },
    formItemProps: {
      label: '电话',
      class: 'phone-form-item',
      style: { marginBottom: '8px' }
    },
    component: {
      props: {
        placeholder: '请输入手机号',
        clearable: true,
        class: 'phone-input',
        style: { width: '100%' }
      }
    }
  }]
}]
```

这些 class 会添加到对应节点，不会替换 FormTable 的 `.form-table-field-layout` 或 `.form-table-form-item` 内部标记。内联 `style` 适合单点覆盖；需要复用、响应状态或统一主题时优先使用 class。

## 动态 class 和 style

四个入口都可以根据当前行返回不同配置：

```ts
{
  label: '金额',
  rowProps: ({ row }) => ({
    class: { 'amount-row--locked': row.locked }
  }),
  formItems: [{
    fieldKey: 'amount',
    type: 'number',
    colProps: ({ row }) => ({
      span: row.showTax ? 12 : 24,
      class: 'amount-col'
    }),
    formItemProps: ({ row }) => ({
      class: {
        'amount-item': true,
        'amount-item--warning': row.amount < 0
      },
      style: { marginBottom: row.compact ? '0' : '8px' }
    }),
    component: {
      props: ({ row }) => ({
        disabled: row.locked,
        class: 'amount-input',
        style: { width: row.compact ? '120px' : '100%' }
      })
    }
  }]
}
```

`rowProps` 的动态上下文是行上下文；`colProps/formItemProps` 是字段上下文；`component.props` 还可以读取只读 `bindingValue`。这些函数应保持同步和无副作用。

## 自定义组件中的 class/style

自定义组件与内置组件使用同一个 `component.props` 入口：

```ts
{
  fieldKey: 'ownerId',
  type: 'component',
  component: {
    is: EmployeePicker,
    props: {
      departmentId: 'sales',
      class: 'employee-picker--compact',
      style: { width: '100%' }
    }
  }
}
```

这里需要区分两类值：

- `departmentId` 等普通键按组件 Prop/attribute 透传，不会因同时配置 `class/style` 而改变。
- `class/style` 按 Vue 2 VNode 的原生语义应用到自定义组件的根节点，不参与 model，也不会覆盖其他 Props 或 listeners。

因此，自定义组件不应依赖声明名为 `class` 或 `style` 的业务 Prop 来读取这两个值。如果需要控制组件内部某个节点，应定义语义明确的 Prop，例如：

```ts
component: {
  is: EmployeePicker,
  props: {
    class: 'employee-picker-root',
    panelClass: 'employee-picker-panel--compact',
    panelStyle: { maxHeight: '240px' }
  }
}
```

其中根节点 class 由 Vue 应用，`panelClass/panelStyle` 由 `EmployeePicker` 自己接收并绑定到内部节点。

## scoped 样式为什么可能匹配不到

`rowProps/colProps/formItemProps` 添加的节点由 FormTable 内部渲染。调用页面的 `<style scoped>` 会附加页面自己的 scope 属性，普通选择器不一定能进入这些内部节点。

以下写法最稳定：

```vue
<style>
.order-page .phone-field-col {
  padding-inline: 4px;
}

.order-page .phone-form-item {
  margin-bottom: 8px;
}
</style>
```

如果页面必须使用 scoped CSS，使用当前构建工具支持的深度选择器：

```vue
<style scoped>
.order-page :deep(.phone-field-col) {
  padding-inline: 4px;
}

.order-page :deep(.phone-form-item) {
  margin-bottom: 8px;
}
</style>
```

旧版 Vue 2 工具链可能使用 `::v-deep`。如果不确定项目支持哪一种，局部 `style` 配置或带页面命名空间的非 scoped 样式更容易预测。

## 常见误区

- `rowProps` 只作用于字段列单元格内唯一的 `el-row`，不是 `tableProps.rowClassName` 对应的整条表格行。
- `colProps` 默认包含 `span: 24`；显式配置会覆盖默认值。
- `rowProps` 默认包含 `type: 'flex'`；需要普通 Row 时设置 `type: undefined`。
- `formItemProps.prop` 由 FormTable 根据行下标和 `fieldKey` 管理，不能手工覆盖；其他 FormItem Props、class 和 style 正常透传。
- `component.props.class/style` 作用于实际组件根节点。要修改第三方组件内部节点，仍应使用该组件公开的 Prop、专属 class 或经过业务评估的选择器。
- 字段使用 `type: 'slot'` 时，FormTable 不创建实际字段组件；应在 Slot 模板中自行绑定 class、style 和解析后的 `component.props`。

全局样式文件、加载顺序、稳定类名和 SSR/UMD 边界见[样式加载与覆盖契约](../architecture/style-loading.md)。完整类型和动态上下文见 [Column / Item](../api/columns.md) 与 [Component 配置](../api/component.md)。
