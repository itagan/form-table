# API 类型边界

`@itagan/form-table` 包入口只导出业务侧稳定使用的公开类型。

```ts
import FormTable, {
  FormTablePlugin,
  type ColumnConfig,
  type FormTableExpose,
  type TableRow
} from '@itagan/form-table'
```

## 公开类型

- `ColumnConfig`
- `RowConfig`
- `FormItemConfig`
- `FormItemType`
- `TableRow`
- `FormTableRecord`
- `FormTableProps`
- `FormTableExpose`
- `FormTableEventPayload`
- `FormTableFieldChangePayload`
- `FormTableSlotContext`
- `FormTableHeaderSlotContext`
- `CustomComponentConfig`
- `ValidationRule`

## 常用类型组合

### 表格行

```ts
import type { TableRow } from '@itagan/form-table'

const tableData: TableRow[] = [
  { name: '张三', age: 25 }
]
```

`TableRow` 是宽松的键值结构，字段名由 `FormItemConfig.key` 决定。

### 列配置

```ts
import type { ColumnConfig } from '@itagan/form-table'

const columns: ColumnConfig[] = [{
  name: '基础信息',
  fields: [
    { key: 'name', type: 'input' },
    { key: 'age', type: 'number' }
  ]
}]
```

`fields` 是推荐的简单入口。只有单元格内需要多行布局时，再把列配置升级为 `children`。

### Ref 标注

```ts
import { ref } from 'vue'
import type { FormTableExpose } from '@itagan/form-table'

const formTableRef = ref<FormTableExpose>()
```

`FormTableExpose` 只描述 FormTable 承诺维护的公开方法。需要完整 Element UI 实例时使用 `getNativeFormRef` 或 `getNativeTableRef`。

## 内部类型

以下内容保留在源码内部，不作为 npm 包 API 承诺：

- provide / inject keys
- dispatch 类型
- 内部事件命令
- 内部 actions 编排类型
- Element UI 实例的内部编排细节

公开类型出口维护在：

- `packages/form-table/src/types.public.ts`
- `packages/form-table/src/public-types.ts`

## 兼容性约定

补丁版本会尽量保持以下内容兼容：

- 默认导出 `FormTable`
- 命名导出 `FormTable`
- 命名导出 `FormTablePlugin`
- `@itagan/form-table/style.css`
- 本页列出的公开类型名称

以下内容不承诺作为稳定 API：

- `src/` 内部文件路径
- `dist/` 内部 chunk 文件名
- 未从包入口导出的类型
- playground 和 docs 的内部实现
