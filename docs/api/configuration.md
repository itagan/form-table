# 配置 API

FormTable 的配置核心由 `tableData`、`columns`、`rules`、`formData` 和 `customComponents` 组成。

## Props

| 属性 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tableData` | `TableRow[]` | 是 | 表格行数据 |
| `columns` | `ColumnConfig[]` | 是 | 表格列、单元格布局和字段配置 |
| `rules` | `Record<string, ValidationRule[]>` | 否 | Element UI form rules，支持精确路径和通配路径 |
| `formData` | `FormTableRecord` | 否 | 表单级上下文数据，会传入动态配置和插槽上下文 |
| `customComponents` | `CustomComponentConfig[]` | 否 | 自定义字段组件注册列表 |
| `loading` | `boolean` | 否 | 透传到内部 `el-table` 的加载状态 |

除 FormTable 自有 props 外，常用 Element UI 属性会通过白名单透传给内部组件。例如 `border`、`stripe`、`height` 会进入 `el-table`，`label-width`、`size`、`disabled` 会进入 `el-form`。

## API 分层

FormTable 的配置按使用成本分层。多数业务只需要前两层，复杂场景再进入完整结构。

| 层级 | 配置入口 | 适用场景 |
| --- | --- | --- |
| 主推荐 API | `columns[].fields`、字段顶层常用配置 | 一列里只有一行字段，字段只需要基础属性、选项和必填校验 |
| 布局增强 API | `columns[].fieldRow`、字段 `layout` | 一行里多个字段需要 `gutter`、`justify`、`align`、`span` |
| 高级结构 API | `columns[].children` | 一个表格单元格里需要多行字段布局 |
| 扩展 API | `component`、`display`、`behavior`、`customComponents`、slot | 自定义组件、动态显隐、联动、格式化和业务插槽 |

推荐从 `fields` 开始；当简单结构表达不了布局时，再逐步补充 `fieldRow`、`children` 或扩展配置。

## 数据结构

## ColumnConfig

```ts
interface ColumnConfig {
  key?: string
  name: string
  required?: boolean
  headerSlot?: string
  visible?: DynamicValue<boolean>
  props?: DynamicValue<ComponentBind>
  fieldRow?: Omit<RowConfig, 'children'>
  fields?: FormItemConfig[]
  children?: RowConfig[]
}
```

`ColumnConfig` 对应一个 `el-table-column`。简单场景直接用 `fields` 配置一行字段：

```ts
const columns: ColumnConfig[] = [{
  name: '基础信息',
  fieldRow: {
    gutter: 8
  },
  fields: [
    {
      key: 'name',
      type: 'input',
      label: '姓名',
      placeholder: '请输入姓名'
    },
    {
      key: 'age',
      type: 'number',
      label: '年龄'
    }
  ]
}]
```

`fieldRow` 会作为这行字段的行级配置，等价于 `children: [{ ...fieldRow, children: fields }]`。需要在一个表格单元格里排多行时，再使用 `children`。只有表格列自身属性需要调整时，再配置 `props`，例如：

```ts
const columns: ColumnConfig[] = [{
  name: '序号',
  props: {
    type: 'index',
    width: '80px',
    align: 'center',
    index: (index: number) => index + 1
  },
  children: []
}]
```

列头渲染优先级为 `props.renderHeader` > `headerSlot` > 默认表头。`ColumnConfig.required` 只控制表头必填标记；字段校验可以通过字段顶层 `required`、全局 `rules` 或字段自身 `rules` 配置。

## RowConfig

```ts
interface RowConfig {
  key?: string
  visible?: DynamicValue<boolean>
  bind?: DynamicValue<ComponentBind>
  props?: DynamicValue<ComponentBind>
  gutter?: number
  children: FormItemConfig[]
}
```

`RowConfig` 对应单元格里的一个 `el-row`。一个列可以配置多行布局，每行的 `children` 对应若干字段。`fields` 等价于 `children: [{ ...fieldRow, children: fields }]`。

## FormItemConfig

```ts
interface FormItemConfig {
  key: string
  type: FormItemType
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  readonly?: boolean
  options?: DynamicValue<FormItemOption[]>
  optionProps?: DynamicValue<OptionPropsConfig>
  required?: boolean
  requiredMessage?: string
  trigger?: string | string[]
  layout?: FormItemLayoutConfig
  component?: FormItemComponentConfig
  display?: FormItemDisplayConfig
  behavior?: FormItemBehaviorConfig
  rules?: ValidationRule[]
  label?: string
  labelWidth?: string
}
```

配置职责建议按简单到高级阅读：

- 顶层常用字段：优先使用，控制基础组件属性、选项和必填校验，例如 `placeholder`、`disabled`、`options`、`required`
- `layout`：字段自身布局，例如 `span`、`colProps`
- `component`：组件私有能力，例如 `bind`、`listeners`、`slotName` 或自定义组件 `name`
- `display`：展示行为，例如 `tooltip`、`formatter`、`emptyText`
- `behavior`：运行时行为，例如 `visible`、`defaultValue`、`onValueChange`

顶层常用字段适合基础场景，`component.bind` 适合高级属性和覆盖。组件属性合并优先级为：组件默认值 < 顶层常用字段 < `component.bind`。

```ts
const columns: ColumnConfig[] = [{
  name: '基础信息',
  fields: [
    {
      key: 'status',
      type: 'select',
      label: '状态',
      placeholder: '请选择状态',
      clearable: true,
      required: true,
      requiredMessage: '请选择状态',
      options: [
        { label: '启用', value: 'enabled' },
        { label: '停用', value: 'disabled' }
      ],
      component: {
        bind: {
          filterable: true,
          clearable: false
        }
      }
    }
  ]
}]
```

## 字段类型

内置字段类型包括：

| 类型 | 渲染组件 |
| --- | --- |
| `input` / `textarea` | `el-input` |
| `number` | `el-input-number` |
| `select` | `el-select` |
| `radio` | `el-radio-group` |
| `checkbox` | `el-checkbox-group` |
| `date` / `datetime` | `el-date-picker` |
| `time` | `el-time-picker` |
| `switch` | `el-switch` |
| `rate` | `el-rate` |
| `slider` | `el-slider` |
| `color` | `el-color-picker` |
| `upload` | `el-upload` |
| `cascader` | `el-cascader` |
| `autocomplete` | `el-autocomplete` |
| `tag-input` | `el-select` |
| `text` | 纯文本展示 |
| `slot` | 业务插槽 |
| `custom` | `customComponents` 注册的自定义组件 |

## 动态配置

`visible`、`props`、`layout.colProps`、`component.bind`、`component.options`、`component.optionProps`、顶层 `options` 和顶层 `optionProps` 都支持函数写法。函数会收到运行时上下文：

```ts
const columns: ColumnConfig[] = [{
  name: '联系方式',
  children: [{
    children: [{
      key: 'phone',
      type: 'input',
      behavior: {
        visible: ({ row }) => row.needContact !== false
      },
      component: {
        bind: ({ row }) => ({
          disabled: row.status === 'archived',
          placeholder: '请输入手机号'
        })
      }
    }]
  }]
}]
```

上下文包含 `row`、`index`、`fieldKey`、`formData` 和 `tableData`。

## 联动配置

字段值变化后可以通过 `behavior.onValueChange` 返回当前行 patch：

```ts
const columns: ColumnConfig[] = [{
  name: '职级',
  children: [{
    children: [{
      key: 'level',
      type: 'select',
      component: {
        options: [
          { label: '初级', value: 'junior' },
          { label: '高级', value: 'senior' }
        ]
      },
      behavior: {
        onValueChange: ({ value }) => {
          if (value === 'senior') {
            return { auditRequired: true }
          }
        }
      }
    }]
  }]
}]
```

返回的 patch 会合并到当前行，并继续通过 `update:tableData` 通知外层。

## 规则路径

支持精确路径：

```ts
const rules = {
  'tableData.0.name': [{ required: true, message: '请输入姓名' }]
}
```

也支持动态行通配路径：

```ts
const rules = {
  'tableData.*.name': [{ required: true, message: '请输入姓名' }]
}
```

字段自身也可以配置 `rules`。当全局 `rules`、顶层 `required` 和字段 `rules` 同时存在时，组件会合并到对应的 `el-form-item` 校验路径。

## 自定义组件

自定义字段使用 `type: 'custom'`，推荐在 `component.name` 里直接传当前页面导入的组件对象：

```ts
import PhoneInput from './PhoneInput.vue'

const columns: ColumnConfig[] = [{
  name: '手机号',
  children: [{
    children: [{
      key: 'phone',
      type: 'custom',
      component: {
        name: PhoneInput,
        bind: {
          placeholder: '请输入手机号'
        }
      }
    }]
  }]
}]
```

`component.name` 也可以传字符串。字符串会先从 `customComponents` 注册表查找；如果没有匹配项，会交给 Vue 动态组件按全局组件名解析：

```ts
const customComponents = [
  { name: 'PhoneInput', component: PhoneInput }
]

const columns: ColumnConfig[] = [{
  name: '手机号',
  children: [{
    children: [{
      key: 'phone',
      type: 'custom',
      component: {
        name: 'PhoneInput'
      }
    }]
  }]
}]
```

自定义组件建议遵循 Vue 2 默认 `v-model` 约定：接收 `value`，通过 `input` 事件派发新值。
