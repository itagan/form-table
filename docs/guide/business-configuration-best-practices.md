# 业务配置最佳实践

FormTable 保持轻量运行时，只负责布局、字段渲染、校验路径和受控数据更新。业务组件协议、默认属性和跨字段联动应先在业务代码中组合；只有重复模式稳定后，才值得考虑增加新的核心扩展协议。

## 先选择最小的接入方式

| 需求 | 推荐方式 | 是否需要扩展 FormTable |
| --- | --- | --- |
| Element UI 标准字段 | 内置 `type` | 否 |
| 偶尔接入一个业务组件 | `type: 'component'` | 否 |
| 同类字段在多个 columns 中重复 | 配置工厂函数 | 否 |
| 历史组件具有特殊 model 协议 | Adapter 组件 | 否 |
| 服务端下发业务字段名称 | 本地白名单映射到配置工厂 | 否 |
| 大量项目需要统一的具名组件配置 | 评估组件预设 | 未来能力 |
| Schema 需要直接使用业务 `type` | 评估开放自定义 type 协议 | 未来能力 |

当前公开的 `type` 只有内置类型、`component` 和 `slot`。文中提到的组件预设和自定义 type 是演进判断，不是现有 API。

## 单次接入直接使用 component

只在少数位置使用的组件直接写入 columns，保持依赖和行为可见：

```ts
import EmployeePicker from '@/components/EmployeePicker.vue'
import type { ColumnConfig } from '@itagan/form-table'

interface EmployeeSelection {
  code: string
  name: string
  departmentName: string
}

const columns: ColumnConfig[] = [{
  label: '负责人',
  formItems: [{
    fieldKey: 'employeeCode',
    type: 'component',
    component: {
      is: EmployeePicker,
      model: {
        prop: 'employee-code',
        event: 'employee-confirm',
        valueFromEvent: (...args) => (
          args[0] as EmployeeSelection
        ).code
      },
      listeners: {
        'employee-confirm'({ updateRow }, employee) {
          const selected = employee as EmployeeSelection
          updateRow({
            employeeName: selected.name,
            departmentName: selected.departmentName
          })
        }
      }
    }
  }]
}]
```

`model` 只描述组件稳定的值协议；当前页面特有的关联字段更新继续放在 `listeners` 中。

## 重复配置使用工厂函数

相同组件、model 和默认属性开始重复时，先提取普通函数。函数最终仍返回标准 `FormItemConfig`，不会增加 FormTable 的运行时查找和合并过程。

```ts
import MoneyInput from '@/components/MoneyInput.vue'
import type {
  ColumnConfig,
  FormItemConfig,
  FormTableFieldRenderContext,
  TableRow
} from '@itagan/form-table'

interface PurchaseRow extends TableRow {
  currency?: string
  status?: string
  priceLimit?: number
}

interface MoneyItemOptions {
  fieldKey: string
  label: string
  precision?: number
  placeholder?: string
}

function createMoneyItem(options: MoneyItemOptions): FormItemConfig<PurchaseRow> {
  const {
    fieldKey,
    label,
    precision = 2,
    placeholder = '请输入金额'
  } = options

  return {
    fieldKey,
    type: 'component',
    formItemProps: { label },
    component: {
      is: MoneyInput,
      model: {
        prop: 'amount',
        event: 'amount-change'
      },
      props: ({ row }: FormTableFieldRenderContext<PurchaseRow>) => ({
        currency: row.currency || 'CNY',
        precision,
        placeholder,
        max: row.priceLimit,
        disabled: row.status === 'approved'
      })
    }
  }
}
```

页面只表达字段差异：

```ts
const columns: ColumnConfig<PurchaseRow>[] = [{
  label: '金额',
  formItems: [
    createMoneyItem({ fieldKey: 'unitPrice', label: '单价' }),
    createMoneyItem({
      fieldKey: 'totalAmount',
      label: '总额',
      precision: 4
    })
  ]
}]
```

工厂参数应保持业务语义，例如 `currency`、`precision` 和 `editable`。如果工厂只是把 `FormItemConfig` 的每个属性原样再声明一次，它并没有降低业务理解成本。

## 特殊协议使用 Adapter 组件

旧组件在多个页面使用不同的 prop、事件或事件载荷时，优先通过 Adapter 统一为 Vue 2 标准 v-model：

```vue
<template>
  <LegacyEmployeePicker
    :employee-code="value"
    v-bind="$attrs"
    @employee-confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
defineProps<{ value?: string }>()

const emit = defineEmits<{
  (event: 'input', value: string): void
  (event: 'employee-change', employee: EmployeeSelection): void
}>()

interface EmployeeSelection {
  code: string
  name: string
}

const handleConfirm = (employee: EmployeeSelection) => {
  emit('input', employee.code)
  emit('employee-change', employee)
}
</script>
```

columns 中不再重复底层协议：

```ts
{
  fieldKey: 'employeeCode',
  type: 'component',
  component: {
    is: EmployeePickerAdapter,
    listeners: {
      'employee-change'({ updateRow }, employee) {
        const selected = employee as EmployeeSelection
        updateRow({ employeeName: selected.name })
      }
    }
  }
}
```

Adapter 负责跨页面稳定的技术兼容，配置工厂负责同类字段默认值，columns listener 负责当前页面的业务联动。

## 远程 Schema 使用本地白名单

服务端只下发可序列化、可审核的业务名称。前端显式映射到本地工厂，不让远程数据携带组件对象、函数或事件处理器：

```ts
interface RemoteField {
  fieldKey: string
  label: string
  type: string
  precision?: number
}

const fieldFactories = {
  money: (schema: RemoteField) => createMoneyItem({
    fieldKey: schema.fieldKey,
    label: schema.label,
    precision: schema.precision
  }),
  employee: (schema: RemoteField) => createEmployeeItem({
    fieldKey: schema.fieldKey,
    label: schema.label
  })
}

function enhanceRemoteField(schema: RemoteField): FormItemConfig {
  const factory = fieldFactories[schema.type as keyof typeof fieldFactories]

  if (!factory) {
    throw new Error(`不支持的业务字段类型：${schema.type}`)
  }

  return factory(schema)
}
```

这层转换同时承担组件白名单、默认属性、版本兼容和异常处理。完整远程配置边界见[远程 Schema 与本地增强](../features/remote-schema.md)。

## 保持配置稳定

- columns 和配置工厂结果尽量创建一次，不在模板或高频 computed 中反复生成。
- 动态 `props/options/visible` 保持同步、纯函数，不在求值过程中请求接口或修改行数据。
- 技术协议放在 Adapter 或工厂中，页面权限、接口调用和字段联动留在页面或业务 Store。
- 工厂返回公开的 `FormItemConfig`，不要依赖 FormTable 内部解析结果。
- 服务端 Schema 只保存允许的字符串和静态数据，所有可执行行为由可信前端代码补充。

## 何时升级核心能力

业务配置可以按三个层级演进：

### 1. 函数和 Adapter：当前首选

不修改 FormTable。适合验证重复模式，并保持零额外运行时成本、完整类型检查和按需引入。

### 2. 组件预设：较小扩展

当多个项目都在重复实现同一种配置工厂，可以评估为 `type: 'component'` 增加具名预设。预设只应复用 `is/model/props/listeners/options` 等组件配置，不介入字段路径、校验、布局和数据更新。

引入前需要确定注册作用域、覆盖优先级、动态 props 合并以及未注册名称的错误行为。没有稳定的合并需求时，普通函数更直接。

### 3. 自定义 type：完整协议扩展

只有业务目标明确升级为可扩展 Schema/DSL，并且大量配置需要直接表达 `type: 'money'`、`type: 'employee'` 时，才考虑开放自定义 type。

这会影响公开类型联合、名称冲突、注册机制、服务端白名单、多实例隔离和错误处理，属于核心协议设计。若未来采用，自定义 type 的注册定义应同时承担预设能力，不再保留另一套重复的 `component.preset` API。

判断顺序始终是：先确认重复，再提取业务函数；函数模式在多个项目中稳定后，才把它提升为公共协议。

## 相关文档

[完整配置指南](./configuration-guide.md) · [自定义字段组件](../features/custom-component.md) · [企业复杂组件接入](../examples/enterprise-components.md) · [性能优化建议](../features/performance-optimization.md)
