# 自定义字段 Type

实例级 `fieldTypes` 可以把稳定、重复的业务组件协议注册成具名字段，使 columns 像内置 type 一样直接使用 `type: 'employee'`。它只是一层轻量解析，解析后仍复用现有组件 model、校验、Hint、受控更新和 `binding.map` 链路。

## 注册与使用

```ts
import {
  createFormTable,
  defineFormTableColumns,
  defineFormTableTypes,
  type TableRow
} from '@itagan/form-table'
import EmployeePicker from './EmployeePicker.vue'

interface PurchaseRow extends TableRow {
  employeeId: string
}

interface EmployeeSelection {
  id: string
  name: string
}

const fieldTypes = defineFormTableTypes<PurchaseRow>()({
  employee: {
    is: EmployeePicker,
    model: {
      prop: 'selected-user-id',
      event: 'user-confirm',
      valueFromEvent: (...args) =>
        (args[0] as EmployeeSelection).id
    },
    props: { clearable: true }
  }
})

const FormTable = createFormTable<PurchaseRow, typeof fieldTypes>()

const columns = defineFormTableColumns<PurchaseRow, typeof fieldTypes>([{
  label: '负责人',
  formItems: [{
    fieldKey: 'employeeId',
    type: 'employee'
  }]
}])
```

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :field-types="fieldTypes"
/>
```

注册表泛型非空时，组件 Props 会要求传入对应的 `fieldTypes`；未使用注册类型时，现有 `createFormTable<TRow>()`、`defineFormTableColumns<TRow>()` 和默认组件写法不变。

## 定义与字段覆盖

注册定义只包含跨页面稳定的技术协议：

| 属性 | 作用 |
| --- | --- |
| `is` | 稳定的组件对象或全局组件名 |
| `model` | Vue 2 model prop、事件、`valueToProp/valueFromEvent`，或 `false` |
| `props` | 静态或按字段上下文求值的默认属性 |

自定义 type 的 Item `component` 只允许 `props/listeners/model`：

- 注册 props 和字段 props 分别求值后浅合并，字段 props 优先；
- 字段 model 未配置时继承注册 model，配置对象或 `false` 时整体覆盖；
- listener 只属于当前 Item，第一个参数为 ActionContext，后面保留全部原始事件参数；
- model 事件先写回字段，再调用同名 listener。

```ts
{
  fieldKey: 'employeeId',
  type: 'employee',
  component: {
    props: ({ row }) => ({ disabled: row.status === 'approved' }),
    listeners: {
      'user-confirm'({ updateRow }, employee, meta) {
        const selected = employee as EmployeeSelection
        updateRow({ employeeName: selected.name })
        console.log(meta)
      }
    }
  }
}
```

字段不能覆盖注册定义的 `is`，也不能使用 `resolveComponent/slot/options/optionProps`。需要动态选择组件、复杂选项模板或一次性协议时，继续使用 `type: 'component'`；需要多组件模板时使用 `type: 'slot'`。

## 非对称值转换

行字段与组件 model 格式不一致时，可以在稳定 model 协议中同时声明输入和输出转换。例如行数据保存金额“分”，组件接收金额“元”：

```ts
money: {
  is: MoneyInput,
  model: {
    prop: 'amount',
    event: 'amount-change',
    valueToProp: (cents, context) => Number(cents || 0) / 100,
    valueFromEvent: (...args) => Math.round(Number(args[0] || 0) * 100)
  }
}
```

`valueToProp` 的首参是当前 `bindingValue`，第二个参数是只读字段渲染上下文；其中 `context.value` 始终保留主字段原值。员工 ID 转对象、ISO 字符串转 `Date`、枚举 code 转 Option 等同步转换也适用。异步查询、跨字段副作用或带内部状态的复杂转换继续使用 Adapter、listener 或 Slot。

## 与 binding.map 组合

当组件 model 是对象或数组时，Item 可以继续使用现有 `binding.map` 读写多个行字段：

```ts
{
  fieldKey: 'employeeId',
  type: 'employee',
  binding: {
    map: [
      { fieldPath: 'employeeId', valuePath: 'id', fallbackValue: '' },
      { fieldPath: 'employeeName', valuePath: 'name', fallbackValue: '' },
      { fieldPath: 'departmentId', valuePath: 'departmentId', fallbackValue: '' },
      { fieldPath: 'departmentName', valuePath: 'departmentName', fallbackValue: '' }
    ]
  }
}
```

读取时多个字段先组合为 `bindingValue`，再由 `valueToProp` 转换为组件值；写回时先经过 `valueFromEvent`，再生成一个行 patch。组件清空或输出缺少路径时，各项使用自己的 `fallbackValue`。字段路径属于具体业务结构，因此保留在 Item，不进入注册定义。

## 名称、替换与错误处理

内置 type 以及 `component`、`slot` 是保留名称，`defineFormTableTypes` 会在类型和运行时拒绝冲突。即使 JavaScript 配置绕过 helper，内置 type 仍优先。

注册表按 FormTable 实例提供，两个实例可以使用同名但不同的定义。可以把 `fieldTypes` 替换为一个新对象来重新解析；不承诺原对象的深层修改触发更新，业务代码应保持注册表引用稳定或整体替换。

未知 type 在开发环境按实例和名称警告一次并留下空字段内容，生产环境静默留空。远程 Schema 仍应在业务白名单层提前校验，不能从服务端下发组件对象或函数。

完整运行示例见 [`/custom-field-types`](http://localhost:5173/custom-field-types)。架构取舍和首版边界见[自定义字段 Type 架构设计](../design/custom-field-type-proposal.md)。
