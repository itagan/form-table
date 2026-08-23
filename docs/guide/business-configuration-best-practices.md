# 业务配置最佳实践

FormTable 保持轻量运行时，只负责布局、字段渲染、校验路径和受控数据更新。业务组件协议、默认属性和跨字段联动应先在业务代码中组合；重复模式稳定后，可以用实例级自定义 type 把技术协议提升为可复用名称。

## 先选择最小的接入方式

| 需求 | 推荐方式 | 是否需要扩展 FormTable |
| --- | --- | --- |
| Element UI 标准字段 | 内置 `type` | 否 |
| 偶尔接入一个业务组件 | `type: 'component'` | 否 |
| 同类字段在多个 columns 中重复 | 配置工厂函数 | 否 |
| 组件值只需同步输入/输出转换 | `component.model.valueToProp/valueFromEvent` | 否 |
| 历史组件协议涉及异步、状态或多步交互 | Adapter 组件 | 否 |
| 服务端下发业务字段名称 | 本地白名单映射到配置工厂 | 否 |
| 多页面重复稳定的组件/model/默认 props | 实例级自定义 type | 是，已支持 |
| Schema 需要直接使用已审核业务 `type` | 自定义 type + 本地白名单 | 是，已支持 |

自定义 type 是轻量注册层，不替代普通函数、Adapter、`component` 或 `slot`。选择依据是协议是否稳定且重复，而不是组件本身是否复杂。

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

### 1. 函数和 Adapter：无核心改动

不修改 FormTable。适合验证重复模式，并保持零额外运行时成本、完整类型检查和按需引入。

### 2. 组件预设：由自定义 type 覆盖

首版没有增加独立的 `component.preset` API。实例级自定义 type 已覆盖“具名复用 `is/model/default props`”的核心需求，避免两套名称、注册和合并规则。只需要局部减少重复时，普通函数仍更直接。

### 3. 自定义 type：稳定业务字段协议

当多个页面需要直接表达 `type: 'money'`、`type: 'employee'` 时，使用 `defineFormTableTypes` 注册稳定的 `is/model/default props`。需要精确的字段 Props 和业务事件参数提示时，再用零运行时成本的 `defineFormTableType` 声明协议；它不是必需包装。Item 可按页面覆盖 `props/model` 并监听原始事件，复合值继续使用 `binding.map`；不增加注册级 listener、动态组件或 Option Renderer。

注册表按实例隔离，内置名称受到保护，非空注册表泛型会约束 columns 和必传 Prop。具体 API 见[自定义字段 Type](../features/custom-field-types.md)，设计取舍见[架构设计](../design/custom-field-type-proposal.md)。

判断顺序始终是：先确认重复，再提取业务函数；函数模式在多个项目中稳定后，才把它提升为公共协议。

## 相关文档

[完整配置指南](./configuration-guide.md) · [自定义字段 Type](../features/custom-field-types.md) · [自定义字段组件](../features/custom-component.md) · [企业复杂组件接入](../examples/enterprise-components.md) · [性能优化建议](../features/performance-optimization.md)
