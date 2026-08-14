# FormTable

Vue 2.7 + Element UI 的轻量表格内表单组件，负责布局、字段渲染、校验路径和受控数据更新。

## 安装与版本

> 包尚未发布到 npm。首次发布前请使用仓库 workspace 或 `npm pack` 生成的本地包验证。

```bash
pnpm add @itagan/form-table
```

使用方需要预先安装并注册 Vue 与 Element UI：

- Vue `>=2.7.1 <3.0.0`
- Element UI `>=2.4.9 <3.0.0`
- 推荐 Vue `2.7.16` + Element UI `2.15.14`

Vue 3 和 Element Plus 暂不支持。完整兼容说明见[快速开始](https://gitee.com/itagan/form-table/blob/master/docs/guide/quick-start.md)。

## 最小示例

```ts
import FormTable, {
  defineFormTableColumns,
  type ColumnConfig
} from '@itagan/form-table'
import '@itagan/form-table/style.css'

const columns: ColumnConfig[] = defineFormTableColumns([{
  key: 'basic',
  label: '基本信息',
  children: [{
    children: [{
      key: 'name',
      fieldKey: 'name',
      type: 'input',
      formItemProps: {
        rules: [{ required: true, message: '请输入姓名' }]
      }
    }]
  }]
}])
```

```vue
<FormTable
  ref="formTableRef"
  v-model="tableData"
  :columns="columns"
  row-key="id"
  :form-props="{ size: 'small' }"
  :table-props="{ border: true }"
  @field-change="handleFieldChange"
  @sort-change="handleSortChange"
>
  <template #empty>暂无可编辑数据</template>
  <template #append>
    <el-button type="text" @click="loadMore">加载更多</el-button>
  </template>
</FormTable>
```

根组件 `v-model` 使用 `tableData/update:tableData`；`:table-data.sync` 仍兼容。字段输入和 Slot 更新助手均进行不可变写回。Table 原生事件直接透传，通过 ref 可调用 `validate()`、`clearValidate()`、`getFormRef()` 和 `getTableRef()`。

## Element Table 事件与根级 Slot

列相关事件继续在 FormTable 根组件监听，不配置额外的 `column.listeners`。排序、筛选、表头、单元格和选择事件均保留 Element UI 的原始参数：

```ts
import type {
  FormTableFilterChangePayload,
  FormTableSortChangePayload
} from '@itagan/form-table'

function handleSortChange({ prop, order }: FormTableSortChangePayload) {
  console.log(prop, order)
}

function handleFilterChange(filters: FormTableFilterChangePayload) {
  console.log(filters)
}
```

`#empty` 和 `#append` 会直接转发给 `el-table`，不增加额外 DOM 或 scope。未提供 `#empty` 时，`tableProps.emptyText` 和 Element UI 默认空状态保持有效。

需要让 Props、事件和动态配置回调共享业务行类型时，使用 `createFormTable<TRow>()` 和 `defineFormTableColumns<TRow>()`；两者都不会创建额外运行时实例。`fieldKey` 保持为字符串，以支持固定字段、嵌套路径和服务端动态字段。

## 完整文档

详细行为统一维护在 VitePress 文档中：

- [快速开始](https://gitee.com/itagan/form-table/blob/master/docs/guide/quick-start.md)
- [配置与 API 总览](https://gitee.com/itagan/form-table/blob/master/docs/api/configuration.md)
- [事件与 Ref](https://gitee.com/itagan/form-table/blob/master/docs/api/events-and-ref.md)
- [公开类型](https://gitee.com/itagan/form-table/blob/master/docs/api/types.md)
- [功能专题](https://gitee.com/itagan/form-table/blob/master/docs/features/index.md)
- [示例索引](https://gitee.com/itagan/form-table/blob/master/docs/examples/index.md)

仓库开发、测试和发布命令见[根 README](https://gitee.com/itagan/form-table)。
