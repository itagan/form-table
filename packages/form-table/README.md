# FormTable

Vue 2.7 + Element UI 的轻量表格内表单组件，负责布局、字段渲染、校验路径和受控数据更新。

## 安装与版本

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
  formItems: [{
    key: 'name',
    fieldKey: 'name',
    type: 'input',
    formItemProps: {
      rules: [{ required: true, message: '请输入姓名' }]
    }
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

## 自定义字段 Type

重复使用且组件/model 协议稳定的业务字段可以按 FormTable 实例注册，columns 中的使用习惯与内置 type 一致：

```ts
import {
  createFormTable,
  defineFormTableColumns,
  defineFormTableType,
  defineFormTableTypes
} from '@itagan/form-table'

const employeeType = defineFormTableType<PurchaseRow>()<
  { clearable?: boolean },
  { 'user-confirm': [employee: EmployeeSelection] }
>({
  is: EmployeePicker,
  model: {
    prop: 'selected-user-id',
    event: 'user-confirm',
    valueFromEvent: (_context, employee) => employee.id
  },
  props: { clearable: true }
})

const fieldTypes = defineFormTableTypes<PurchaseRow>()({
  employee: employeeType
})

const BusinessFormTable = createFormTable<PurchaseRow, typeof fieldTypes>()
const columns = defineFormTableColumns<PurchaseRow, typeof fieldTypes>([{
  label: '负责人',
  formItems: [{ fieldKey: 'employeeId', type: 'employee' }]
}])
```

```vue
<BusinessFormTable
  v-model="tableData"
  :columns="columns"
  :field-types="fieldTypes"
/>
```

注册定义只包含稳定的 `is/model/props`；字段仍可提供自己的 `props/listeners/model`，现有 `binding.map` 可直接完成复合值的多字段写回。`defineFormTableType` 是可选的零运行时包装，可让 model 事件名、`valueFromEvent` 参数元组和 Item listener 一起获得精确提示；转换函数首参还会收到只读字段上下文。不使用时保持原有宽松类型。通用 model 还支持 `valueToProp/valueFromEvent`，用于“行内存分、组件显示元”或“行内存 ID、组件接收对象”等同步非对称转换。开发环境会定位未知 type 和非法协议配置，生产环境不执行额外诊断。动态组件和一次性复杂协议继续使用 `type: 'component'`，多组件模板使用 `type: 'slot'`。详见[自定义字段 Type](https://gitee.com/itagan/form-table/blob/master/docs/features/custom-field-types.md)。

## 完整文档

详细行为统一维护在 VitePress 文档中：

- [快速开始](https://gitee.com/itagan/form-table/blob/master/docs/guide/quick-start.md)
- [配置与 API 总览](https://gitee.com/itagan/form-table/blob/master/docs/api/configuration.md)
- [事件与 Ref](https://gitee.com/itagan/form-table/blob/master/docs/api/events-and-ref.md)
- [公开类型](https://gitee.com/itagan/form-table/blob/master/docs/api/types.md)
- [自定义字段 Type](https://gitee.com/itagan/form-table/blob/master/docs/features/custom-field-types.md)
- [功能专题](https://gitee.com/itagan/form-table/blob/master/docs/features/index.md)
- [示例索引](https://gitee.com/itagan/form-table/blob/master/docs/examples/index.md)

仓库开发、测试和发布命令见[根 README](https://gitee.com/itagan/form-table)。
