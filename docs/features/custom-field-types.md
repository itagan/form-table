# 自定义字段 Type

> **高级扩展：**本能力用于治理已经跨页面稳定重复的组件、model 和默认 Props。单次接入优先使用 `type: 'component'`，复杂旧协议优先使用 Adapter；选择顺序见[扩展模型](../architecture/extension-model.md)。

实例级 `fieldTypes` 可以把稳定、重复的业务组件协议注册成具名字段，使 columns 像内置 type 一样直接使用 `type: 'employee'`。它只是一层轻量解析，解析后仍复用现有组件 model、校验、Hint、受控更新和 `binding.map` 链路。

## 注册与使用

```ts
import {
  createFormTable,
  defineFormTableColumns,
  defineFormTableType,
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

interface EmployeePickerProps {
  clearable?: boolean
  disabled?: boolean
}

type EmployeePickerEvents = {
  'user-confirm': [employee: EmployeeSelection, meta: { source: string }]
  search: [keyword: string]
}

const employeeType = defineFormTableType<PurchaseRow>()<
  EmployeePickerProps,
  EmployeePickerEvents
>({
  is: EmployeePicker,
  model: {
    prop: 'selected-user-id',
    event: 'user-confirm',
    valueFromEvent: (_context, employee, meta) => {
      void meta.source
      return employee.id
    }
  },
  props: { clearable: true }
})

const fieldTypes = defineFormTableTypes<PurchaseRow>()({
  employee: employeeType
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

### 可选的 Props / 事件协议

`defineFormTableType` 不是运行时必需包装：它原样返回定义对象，只在类型层保存组件 Props 与事件参数元组。Vue 2 组件、全局字符串组件和部分声明文件无法稳定自动推导事件，因此需要精确提示时显式声明协议；省略它时保持原来的宽松配置，已有代码无需迁移。

协议化定义进入注册表后，Item 的 `component.props` 会提示属性名和值类型；`model.event` 只能选择事件表中的名称，`valueFromEvent` 和 Item listener 都会获得对应的原始事件参数类型。例如上面的 `user-confirm` 中，`employee` 自动为 `EmployeeSelection`，`meta.source` 自动为 `string`。`valueFromEvent` 的首参是只读字段渲染上下文，可读取当前 `row/index/fieldKey/value`，但不提供更新助手。该辅助函数不创建组件、不复制对象，也不增加每个单元格的运行时逻辑。

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
    valueToProp: (_context, cents) => Number(cents || 0) / 100,
    valueFromEvent: (_context, amount) => Math.round(Number(amount || 0) * 100)
  }
}
```

`valueToProp` 的首参是只读字段渲染上下文，第二个参数是当前 `bindingValue`；`valueFromEvent` 的首参使用同一种上下文，后续参数来自所选 model 事件。其中 `context.value` 始终保留主字段原值。员工 ID 转对象、ISO 字符串转 `Date`、枚举 code 转 Option 等同步转换也适用。异步查询、跨字段副作用或带内部状态的复杂转换继续使用 Adapter、listener 或 Slot。

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

### 金额与币种：多字段映射后再转换

下面的行数据保存金额“分”和币种编码，金额组件则接收金额“元”和币种组成的对象：

```ts
interface PurchaseRow extends TableRow {
  id: string
  amountInCents: number
  currencyCode: string
}

interface StoredMoney {
  amountInCents: number
  currency: string
}

interface MoneyEditorValue {
  amount: number
  currency: string
}

const fieldTypes = defineFormTableTypes<PurchaseRow>()({
  money: {
    is: MoneyEditor,
    model: {
      prop: 'money',
      event: 'money-change',

      valueToProp(context, value): MoneyEditorValue {
        const stored = value as StoredMoney

        return {
          amount: Number(stored.amountInCents || 0) / 100,
          currency: stored.currency || context.row.currencyCode
        }
      },

      valueFromEvent(_context, money): StoredMoney | null {
        if (!money) return null

        return {
          amountInCents: Math.round(money.amount * 100),
          currency: money.currency
        }
      }
    },
    props: {
      clearable: true,
      supportedCurrencies: ['CNY', 'USD', 'EUR']
    }
  }
})
```

Item 只负责声明当前业务行中哪些字段参与映射：

```ts
const columns = defineFormTableColumns<PurchaseRow, typeof fieldTypes>([{
  label: '采购金额',
  formItems: [{
    fieldKey: 'amountInCents',
    type: 'money',
    binding: {
      map: [
        {
          fieldPath: 'amountInCents',
          valuePath: 'amountInCents',
          fallbackValue: 0
        },
        {
          fieldPath: 'currencyCode',
          valuePath: 'currency',
          fallbackValue: 'CNY'
        }
      ]
    },
    component: {
      listeners: {
        'money-change'(context, money, meta) {
          console.log(context.bindingValue, money, meta)
        }
      }
    }
  }]
}])
```

一条 `{ amountInCents: 123450, currencyCode: 'CNY' }` 的行数据会依次转换为：

```text
binding.map
  { amountInCents: 123450, currency: 'CNY' }

valueToProp
  { amount: 1234.5, currency: 'CNY' }

MoneyEditor.money
```

组件发出 `money-change({ amount: 2000, currency: 'USD' }, meta)` 时，`valueFromEvent` 先收到只读字段上下文和已推导的事件参数，再得到 `{ amountInCents: 200000, currency: 'USD' }`；随后 `binding.map` 一次写回 `{ amountInCents: 200000, currencyCode: 'USD' }`。因此只产生一次 `update:tableData`，两个实际变化字段分别产生 `field-change`；同名 listener 仍收到完整原始参数，其 `context.bindingValue` 是转换前的旧业务绑定值。组件清空并发出 `null` 时，两个字段分别使用 `0` 和 `'CNY'`。

## 名称、替换与错误处理

内置 type 以及 `component`、`slot` 是保留名称，`defineFormTableTypes` 会在类型和运行时拒绝冲突。即使 JavaScript 配置绕过 helper，内置 type 仍优先。

注册表按 FormTable 实例提供，两个实例可以使用同名但不同的定义。可以把 `fieldTypes` 替换为一个新对象来重新解析；不承诺原对象的深层修改触发更新，业务代码应保持注册表引用稳定或整体替换。

未知 type 在开发环境按实例和名称警告一次并留下空字段内容，警告会包含首次出现的列/字段位置以及当前实例可用的自定义名称。开发环境还会检查无效 `is/model/props`、注册级越界键，以及自定义 Item 对 `is/resolveComponent/slot/options/optionProps` 的越界使用；同一实例中的同类问题只提示一次。生产环境不执行这些诊断，未知内容仍静默留空。远程 Schema 仍应在业务白名单层提前校验，不能从服务端下发组件对象或函数。

## 为什么不提供预设继承和 Schema 包装

自定义 type 已能通过 `is/model/props` 表达稳定业务组件协议。内置字段的固定参数可直接注册对应组件或由配置函数生成；注册表分层可使用对象展开；行类型与注册表继续通过 `createFormTable` 和 `defineFormTableColumns` 显式配对。

因此当前不提供 `base: 'number'`、`mergeFormTableTypes()` 或 `createFormTableSchema()`。这些 API 的主要收益是减少少量配置代码，却会增加内置预设继承、冲突覆盖和第二套 Schema 入口。复杂配置治理保留在业务层，FormTable 核心继续保持轻量、高性能，并优先服务高度自定义组件。

完整运行示例见 [`/custom-field-types`](http://localhost:5173/custom-field-types)。架构取舍和首版边界见[自定义字段 Type 架构设计](../design/custom-field-type-proposal.md)。
