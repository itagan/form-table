# 权限与字段可编辑性

> 配套 Demo：[企业复杂组件接入 ↗](http://localhost:5173/enterprise-components) · [多需求费用明细 ↗](http://localhost:5173/heterogeneous-demands)

FormTable 不内置权限系统。页面或业务配置层根据当前用户、行状态和服务端策略决定 Column、Item、组件 Props 与操作 Slot；FormTable 只执行最终配置。详情和编辑的渲染入口选择独立整理在[详情与编辑模式](./detail-and-editing-modes.md)。

## 先区分四种业务语义

| 业务状态 | 推荐处理 | 数据与校验 |
| --- | --- | --- |
| 无查看权限 | Column / Item `visible: false` | 不挂载，也不参与当前表单校验 |
| 可查看但不可编辑 | 只读组件或独立详情配置 | 数据保留；是否校验由页面策略决定 |
| 暂时不可操作 | 组件 `disabled: true` | 数据仍保留，Element 组件通常不触发交互 |
| 行已锁定或已审批 | 动态 Props 读取 `row.status` | 每行独立决定，不要隐藏整列 |

隐藏和禁用不是安全措施。提交 DTO 必须按服务端允许的字段构造，接口仍需重新鉴权并拒绝越权修改。

## 页面级可编辑状态

页面内快速切换并复用字段组件时，可以把响应式状态下发给组件：

```ts
const editable = ref(false)

const columns: ColumnConfig[] = [{
  label: '商品',
  formItems: [{
    fieldKey: 'productName',
    type: 'input',
    component: {
      props: () => ({ readonly: !editable.value })
    }
  }]
}]
```

Select、日期选择器和上传等组件通常使用 `disabled`。如果详情不应继续挂载编辑组件，不要把权限逻辑和渲染模式混成一个布尔值；由页面先决定用户是否能进入编辑，再按[详情与编辑模式](./detail-and-editing-modes.md)生成对应 columns。

## 行状态控制

已提交、审批中或被其他用户锁定的行，应从当前 `row` 计算组件状态：

```ts
component: {
  props: ({ row }) => ({
    disabled: row.status !== 'draft' || row.locked === true
  })
}
```

操作列使用同一业务判断，避免出现字段不可编辑但删除按钮仍可用的分裂状态：

```vue
<template #row-actions="{ row }">
  <el-button
    v-if="canDelete(row)"
    type="text"
    @click="removeRow(row)"
  >
    删除
  </el-button>
</template>
```

删除确认或接口等待跨越异步边界时，按稳定 `rowKey` 重新定位目标行，不使用旧下标。

## meta 保存静态权限标识

远程 Schema 或配置工厂可以使用 Item `meta` 保存静态权限名称：

```ts
{
  fieldKey: 'taxPrice',
  type: 'number',
  meta: {
    viewPermission: 'purchase:price:view',
    editPermission: 'purchase:price:edit'
  },
  visible: ({ itemConfig }) => hasPermission(
    String(itemConfig.meta?.viewPermission)
  ),
  component: {
    props: ({ row, itemConfig }) => ({
      disabled: row.locked || !hasPermission(
        String(itemConfig.meta?.editPermission)
      )
    })
  }
}
```

`meta` 只保存静态业务注解。FormTable 不解析权限名称，也不会把它自动传给组件。用户权限集合、当前组织和行锁状态仍来自页面或 Store；不要把随用户或行变化的数据复制进 `meta`。

## 动态隐藏与校验

Item 不可见时不会挂载对应 FormItem，因此当前 DOM 表单不会校验该字段。产品需要先明确：

- 隐藏字段是否仍应保留并提交。
- 字段再次出现时是否沿用原值。
- 服务端是否仍要求该字段。
- 切换权限或模式后是否需要清理旧错误展示。

如果隐藏字段必须满足提交规则，应在页面 DTO 校验或服务端校验中处理，不能依赖未挂载的 Element FormItem。

## 配置组织建议

小型页面可直接在动态 Props 中调用权限函数。多个页面共享相同策略时，使用配置工厂注入权限能力：

```ts
const columns = createPurchaseColumns({
  canView: permission => permissionStore.has(permission),
  canEditRow: row => row.status === 'draft' && !row.locked
})
```

工厂只组合配置，不保存登录用户或页面状态。技术协议兼容继续放在 Adapter，当前页面权限判断留在页面或业务 Store。

## 上线检查

- 无查看权限的数据是否同时避免出现在导出、日志和提交载荷中。
- `readonly`、`disabled` 和隐藏是否符合产品语义，而不是互相替代。
- 行状态与操作按钮是否使用同一套业务判断。
- 动态隐藏字段的服务端必填规则是否已明确。
- 权限切换或 columns 替换后是否清理了旧校验状态。
- 服务端是否独立完成字段级和操作级鉴权。

## 相关文档

[详情与编辑模式](./detail-and-editing-modes.md) · [动态显隐与配置更新](./dynamic-configuration.md) · [`cellSlot` 列级单元格](./cell-slot.md) · [远程 Schema](./remote-schema.md) · [稳定身份](./stable-identity.md)
