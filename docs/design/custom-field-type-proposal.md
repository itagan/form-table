# 自定义字段 Type 架构设计

> 状态：首版已实现。本文记录已选定的公开 API、运行时规则、首版边界及后续不扩张原则。

## 背景

FormTable 已经通过内置 `type`、`type: 'component'` 和 `type: 'slot'` 覆盖常见字段渲染。业务组件也可以声明非标准 model、动态 props、事件监听和复合字段 `binding.map`。

当同一业务组件在多个页面重复出现时，开发者仍需要重复填写：

- 实际组件 `is`；
- 组件接收值的 prop；
- 组件发出值的事件；
- 从复杂事件载荷中提取 model 值的方法；
- 稳定的默认 props。

自定义 type 的目标是把这套稳定技术协议注册为一个业务字段名称，使其使用习惯与内置 type 一致：

```ts
{ fieldKey: 'name', type: 'input' }
{ fieldKey: 'enabled', type: 'switch' }
{ fieldKey: 'employeeId', type: 'employee' }
```

## 设计目标

### 使用方式接近内置 type

开发者直接通过 `type` 选择字段，不需要增加 `customType` 或 `component.preset` 层级：

```ts
{
  fieldKey: 'employeeId',
  type: 'employee'
}
```

### 封装稳定的双向绑定协议

自定义 type 不只是组件名称别名，还负责隐藏非标准 Vue 2 model：

```ts
employee: {
  is: EmployeePicker,
  model: {
    prop: 'selected-user-id',
    event: 'user-confirm',
    valueFromEvent: (...args) => (
      args[0] as EmployeeSelection
    ).id
  }
}
```

字段使用者只关心 `employeeId`，不需要重复处理 `selected-user-id/user-confirm`。

### 复用现有渲染链

注册类型解析后继续进入现有字段组件流程：

```text
自定义 type 名称
  → 查找 FieldTypeDefinition
  → 归一化为现有组件配置
  → DynamicFieldRenderer
  → 现有 model、binding、Hint、校验和受控更新
```

不增加额外 Vue 组件实例，不引入独立渲染器或插件生命周期。

### 保持业务处理显式

type 定义只描述跨页面稳定的技术协议。当前页面的权限、接口调用、关联字段处理和交互副作用继续放在字段 props/listeners、页面或业务 Store 中。

## 非目标

第一版自定义 type 不负责：

- 自定义 VNode 或模板渲染器；
- 改变 Column、Row 或 FormItem 结构；
- 改变字段路径和校验协议；
- 替换 FormTable 的受控更新机制；
- 注册生命周期钩子；
- 动态安装或卸载插件；
- 执行远程 Schema 中的代码；
- 封装页面特有的接口调用和跨字段副作用。

复杂组件继续使用显式 `type: 'component'`，自定义模板继续使用 `type: 'slot'`。

## 字段渲染层级

| 层级 | 使用方式 | 适用场景 |
| --- | --- | --- |
| 内置字段 | `type: 'input'` | Element UI 标准字段 |
| 注册字段 | `type: 'employee'` | 协议稳定、重复使用的业务组件 |
| 自定义组件 | `type: 'component'` | 动态组件、非对称数据、复杂事件和一次性接入 |
| 字段 Slot | `type: 'slot'` | 多组件模板和完全自定义内容 |

自定义 type 是“使用方提供的业务内置 type”，不是新的渲染模式。

## 公共 API

### 注册定义

```ts
const fieldTypes = defineFormTableTypes<PurchaseRow>()({
  employee: {
    is: EmployeePicker,
    model: {
      prop: 'selected-user-id',
      event: 'user-confirm',
      valueFromEvent: (...args) => (
        args[0] as EmployeeSelection
      ).id
    },
    props: {
      clearable: true
    }
  },

  money: {
    is: MoneyInput,
    model: {
      prop: 'amount',
      event: 'amount-change',
      valueFromEvent: (...args) => (
        args[0] as MoneyChangePayload
      ).amount
    },
    props: {
      currency: 'CNY',
      precision: 2
    }
  }
})
```

`defineFormTableTypes` 原样返回注册表，用于保留名称字面量、提供字段上下文类型，并在类型层和运行时检查保留名称。

### 实例注册

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :field-types="fieldTypes"
/>
```

第一版只提供实例级注册，不提供全局可变的 `registerType()`：

- 避免测试和 SSR 请求之间共享状态；
- 避免多个业务包按加载顺序互相覆盖；
- 让 columns 依赖的类型来源保持可见；
- 允许同一页面的不同 FormTable 使用不同注册表。

公司级默认类型可以通过 `BusinessFormTable` 包装组件统一传入。

### 字段使用

```ts
{
  fieldKey: 'employeeId',
  type: 'employee',
  component: {
    props: ({ row }) => ({
      departmentId: row.departmentId,
      disabled: row.status === 'approved'
    }),
    listeners: {
      'user-confirm'({ updateRow }, employee) {
        const selected = employee as EmployeeSelection

        updateRow({
          employeeName: selected.name,
          departmentName: selected.departmentName
        })
      }
    }
  }
}
```

使用习惯与内置 type 保持一致：`component.props` 提供当前字段属性，`component.listeners` 监听原始组件事件。

## Type 定义能力

第一版收敛为：

```ts
interface FieldTypeDefinition<TRow extends TableRow = TableRow> {
  is: string | Component
  model?: FieldModelConfig | false
  props?: DynamicValue<
    ComponentProps,
    FormTableFieldRenderContext<TRow>
  >
}
```

### `is`

必须指向一个稳定的 Vue 组件对象或全局组件名称。动态选择完全不同的组件时继续使用 `type: 'component' + resolveComponent`。

### `model`

沿用现有 `FieldModelConfig`：

```ts
interface FieldModelConfig {
  prop?: string
  event?: string
  valueFromEvent?: (...args: unknown[]) => FormTableValue
}
```

- 省略时使用组件真实的 Vue 2 v-model/model 选项；
- 对象形式声明非标准 prop、事件和取值函数；
- `false` 表示不注入 model，通常不适合注册为普通可编辑 type。

### `props`

只保存跨页面稳定的默认属性，可以是静态对象或现有字段动态上下文函数。

### 第一版不在定义中提供 listeners

model 已经负责稳定的值协议；注册级 listener 容易隐藏字段更新、副作用和执行顺序。业务 listener 留在具体 Item：

```ts
component: {
  listeners: {
    'user-confirm'({ updateRow }, employee) {
      // 当前页面的关联字段处理
    }
  }
}
```

如果未来出现明确的跨项目稳定技术事件，再独立评估注册级 listener，而不是第一版直接开放。

### 第一版不复用通用 options 渲染

当前 `options/optionProps` 的子节点渲染只对内置 `select/radio/checkbox` 有明确语义。自定义组件需要选项时，通过 props 接收自己的选项结构：

```ts
{
  fieldKey: 'employeeId',
  type: 'employee',
  component: {
    props: ({ row }) => ({
      candidates: getCandidates(row.departmentId)
    })
  }
}
```

不在第一版增加自定义 Option Renderer 或内置 type 继承协议。

## 配置合并规则

注册定义与 Item 配置只进行必要的浅层组合：

| 配置 | 规则 |
| --- | --- |
| `is` | 来自注册定义，Item 不允许覆盖 |
| `resolveComponent` | 注册类型不支持，复杂场景使用 `component` |
| `props` | 两侧分别求值后浅合并，Item 优先 |
| `model` | Item 未配置时继承注册定义；显式对象或 `false` 整体覆盖 |
| `listeners` | 只来自 Item，保持现有事件行为 |
| `options/optionProps` | 不参与自定义 type 通用协议 |
| `slot` | 不支持 |

不进行深合并，避免对象、数组和回调产生难以预测的组合结果。

## 数据读取与写回

### 单字段值

未配置 `binding` 时：

```text
读取
row[fieldKey]
  → type.model.prop
  → 业务组件

写回
业务组件发出 type.model.event
  → valueFromEvent(...args)
  → setValue(fieldKey)
  → Item 同名 listener(...原始参数)
```

model 写回先执行，同名字段 listener 随后执行。listener 仍获得完整原始事件参数，可处理其他业务值。

事件上下文中的 `value` 是触发时快照；listener 应使用本次事件载荷读取新值。连续 `setValue/updateRow` 由现有同步更新基线合并。

### 复合字段 binding.map

组件 model 本身是复合对象时，现有 `binding.map` 可以声明多个行字段的双向映射：

```ts
const fieldTypes = defineFormTableTypes<EmployeeRow>()({
  employee: {
    is: EmployeePicker,
    model: {
      prop: 'selection',
      event: 'user-confirm'
    }
  }
})
```

```ts
{
  fieldKey: 'employeeId',
  type: 'employee',
  binding: {
    map: [
      {
        fieldPath: 'employeeId',
        valuePath: 'id',
        fallbackValue: ''
      },
      {
        fieldPath: 'employeeName',
        valuePath: 'name',
        fallbackValue: ''
      },
      {
        fieldPath: 'departmentId',
        valuePath: 'departmentId',
        fallbackValue: ''
      },
      {
        fieldPath: 'departmentName',
        valuePath: 'departmentName',
        fallbackValue: ''
      }
    ]
  }
}
```

读取和写回链路为：

```text
读取
多个 row 字段
  → binding.map 组合 EmployeeSelection
  → selection prop

写回
user-confirm(EmployeeSelection)
  → binding.map 生成一个行 patch
  → 多字段原子写回
```

组件清空并发出 `null` 或缺少相应路径的值时，使用各映射项的 `fallbackValue`。

`binding` 保留在 Item，不进入 type 注册定义，因为 `employeeId/employeeName` 等字段路径属于具体业务数据结构。

### 非对称值协议

现有 `binding.map` 是双向映射。如果组件读取时只接收 ID，写回时却发出完整对象：

```text
读取：employeeId → string
写回：EmployeeSelection → 多个字段
```

则不能只用 `binding.map` 表达。此时选择：

- Adapter 将组件统一为复合值 model；
- type 的 `valueFromEvent` 写回主字段，Item listener 更新关联字段；
- `type: 'component' + model: false + props/listeners` 手动同步。

第一版不为自定义 type 增加独立的输入转换器和输出 patch 转换器，以免演变为新的状态管理协议。

## 事件行为

自定义 type 沿用现有组件事件行为：

```ts
{
  fieldKey: 'employeeId',
  type: 'employee',
  component: {
    listeners: {
      'user-confirm'({ updateRow }, employee) {
        const selected = employee as EmployeeSelection
        updateRow({ employeeName: selected.name })
      },
      search(_context, keyword) {
        console.log(keyword)
      }
    }
  }
}
```

- model 事件先写回字段，再调用同名 listener；
- listener 第一个参数固定为字段上下文；
- 之后完整保留组件原始事件参数；
- 非 model 事件只执行 Item listener；
- FormTable 不解释 `search/open/close` 等业务事件。

## 类型名称与解析优先级

以下现有名称为保留名称，不允许注册覆盖：

```text
input, select, date, time, time-select, number, switch,
radio, checkbox, text, rate, slider, color, cascader,
autocomplete, component, slot
```

解析顺序：

```text
component / slot 特殊模式
  → 内置 type
  → 实例 fieldTypes
  → 未知类型处理
```

跨包发布的业务类型建议使用稳定前缀，例如 `corp-money`，但第一版不强制命名空间。

## 未知类型处理

未知 type 不应导致整张表崩溃，也不应在每个单元格重复输出日志：

- 开发环境按类型名称去重警告；
- 当前字段保留 FormItem，但内容渲染为空；
- 警告说明注册入口和 `type: 'component'` 替代方式；
- 远程 Schema 应在业务白名单转换层提前拒绝未知名称。

开发环境警告：

```text
[FormTable] Unknown field type "employee". Register it through
fieldTypes or use type: "component".
```

## TypeScript 设计

不能把 `FormItemType` 简单放宽为 `string`，否则会失去现有拼写检查：

```ts
{ fieldKey: 'name', type: 'inptu' }
```

注册表名称参与 Item type 联合：

```ts
type AvailableType =
  | BuiltinFormItemType
  | 'component'
  | 'slot'
  | keyof typeof fieldTypes
```

### 选定方案：注册表泛型

```ts
const fieldTypes = defineFormTableTypes<PurchaseRow>()({ /* ... */ })

const FormTable = createFormTable<PurchaseRow, typeof fieldTypes>()
const columns = defineFormTableColumns<PurchaseRow, typeof fieldTypes>([
  /* ... */
])
```

第二个注册表泛型沿 `FormItemConfig/ColumnConfig/FormTableProps/FormTableComponent` 传播，默认 `EmptyFieldTypeRegistry`，因此现有单泛型和无泛型 API 完全兼容。非空注册表下 `fieldTypes` Prop 必传，注册名称保持精确拼写检查。

首版不增加绑定式 Schema 工具或 Module Augmentation。前者会增加与 `createFormTable` 重叠的公共概念；后者是项目级全局状态，不能自然表达实例隔离。

## 性能设计

自定义 type 不应改变现有组件层级：

- 每个字段解析时进行一次对象属性查找；
- type 默认 props 和 Item props 在现有 computed 中各求值一次并浅合并；
- 不创建额外 Adapter 实例；
- 不建立全局响应式注册中心；
- `fieldTypes` 按稳定配置处理，不支持运行期间频繁原地修改；
- 未知类型警告按名称去重。

注册表查找与当前内置 type 映射属于同级成本。性能风险主要来自使用方反复创建 columns/fieldTypes 或在动态 props 中执行昂贵业务逻辑，文档仍应要求稳定引用和纯函数。

## 远程 Schema 与安全边界

服务端可以保存已审核的类型名称：

```json
{
  "fieldKey": "employeeId",
  "type": "employee"
}
```

但 `fieldTypes` 仍由可信前端代码提供。服务端不能下发：

- 组件对象；
- props 函数；
- `valueFromEvent`；
- listeners；
- 任意可执行代码。

业务层应维护允许名称白名单，并在 columns 进入 FormTable 前完成 Schema 校验。

## 测试边界

首版回归覆盖：

- 内置 type、`component` 和 `slot` 行为不变；
- 注册类型的标准 v-model 和自定义 model；
- `valueFromEvent` 与同名 Item listener 的顺序和原始参数；
- 静态及动态默认 props 与 Item props 的浅合并；
- `binding.map` 的读取、原子写回、清空和 fallback；
- 未知名称警告去重及空内容渲染；
- 保留名称注册失败；
- 两个 FormTable 实例的注册表隔离；
- 自定义 type 名称的类型推断和拼写错误；
- 最低 Vue/Element UI peer 组合；
- 大量单元格下不增加组件实例和明显解析开销。

## 首版最终决策

| 问题 | 选定规则 |
| --- | --- |
| TypeScript 方案 | 显式注册表泛型；现有 API 增加可选第二泛型 |
| 注册表更新 | 允许替换为新对象并重新解析；不承诺原地深层修改 |
| Item model | 对象或 `false` 可整体覆盖注册 model，不做深合并 |
| 未知 type | 开发环境按实例和名称警告一次，生产环境静默，字段内容为空 |
| 发现时机 | 根组件在开发环境扫描 columns；字段渲染仍有未知目标保护 |
| Option 子节点 | 首版不复用；通过组件 props 自行传入选项 |

## 已实现的第一版范围

首版包含：

```text
实例级 fieldTypes
  +
直接使用 type: 'employee'
  +
组件 is / model / 默认 props
  +
Item component.props / listeners
  +
现有 binding.map
  +
保留名称保护与未知类型警告
  +
注册表驱动的 TypeScript 联合
```

不包含注册级 listeners、动态组件、Option Renderer、全局注册、生命周期、自定义渲染和额外数据转换协议。

## 架构结论

自定义 type 的职责可以概括为：

```text
FieldTypeDefinition
  组件是谁
  值传给哪个 prop
  监听哪个 model 事件
  如何从事件中提取字段值
  有哪些稳定默认 props

binding.map
  复合组件值与当前行字段如何双向映射

Item component.props/listeners
  当前页面的参数与业务事件如何处理

component / slot
  超出轻量字段协议的复杂组件和模板
```

这使自定义 type 在使用习惯上接近内置 type，同时仍然只是现有组件协议的轻量注册层，不把 FormTable 扩展为通用插件或状态管理框架。
