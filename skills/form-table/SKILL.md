---
name: form-table
description: Use when implementing or changing editable tables with @itagan/form-table in Vue 2.7 and Element UI projects, including field configuration, validation, row actions, and custom rendering. Do not use for unrelated table libraries or Vue 3 projects.
---

# FormTable

Build the requested table with the public `@itagan/form-table` API. Check the consuming project's installed package version and conventions before adapting examples. Use the installed public types and the [published documentation](https://itagan.github.io/form-table/) to confirm configuration paths and behavior. The linked source documents below provide focused guidance when needed.

## Core model

- `tableData` is the single row-data source. Prefer `<FormTable v-model="tableData" :columns="columns" />`; use `:table-data` plus `@update:tableData` when a Store, derived view, or DTO conversion requires an explicit adapter.
- Define fields inside `columns[].formItems[]`. Each field uses `fieldKey` for its row-data path, `type` for rendering, `formItemProps.rules` for validation, and `component` for control configuration. Do not substitute `prop`, a top-level `formItems`, `component.name`, or a top-level `rules` array.
- Keep API calls, save and cancel flows, row insertion and deletion, and business state in the page or Store. The component emits updated row arrays; it does not mutate the input array.
- Use `rowKey` when rows may be replaced during an asynchronous operation or Element Table needs stable row identity. Keep row, column, and item keys unique and stable in their respective scopes. Do not use an array index captured before an `await` to update a row.

## Choose a rendering path

1. For a standard Element UI field, use a built-in `type` such as `input`, `select`, `number`, `date`, or `text`. Use `component.props` for its Element UI props and `component.options` for built-in select, radio, and checkbox choices.
2. For a single additional Vue component, use `type: 'component'` with `component.is`. Describe a nonstandard value prop or event in `component.model`. Pass business component options through `component.props`, not the built-in `component.options` path.
3. For custom markup that still represents one field and needs field validation, use `type: 'slot'` with `component.slot`; use the Slot's `setValue` or `updateRow` to write back.
4. For a whole-cell layout or action column without field validation, use `columns[].cellSlot`. Do not combine `cellSlot` and `formItems` in one column. Add, delete, copy, or move rows by replacing the page's `tableData`.
5. Wrap complex component protocols in an Adapter. Register a custom field Type only for a stable protocol reused across pages.

## Build and check

1. Identify the row shape, editable fields, validation, row actions, and whether the data may refresh while editing.
2. Define `columns` using the rendering path above. Prefer the smallest configuration that meets the request.
3. Bind `tableData` with `v-model` unless an explicit adapter is required. Use automatic model updates for ordinary fields, `setValue` for one field, `updateRow` for multiple fields in one row, and the Ref's `updateRows` for atomic multirow changes.
4. Place validation in `formItemProps.rules`; let FormTable generate the `el-form-item.prop` path. Do not set `formItemProps.prop` manually.
5. Check the project's types and run its relevant verification. Check behavior in the browser when the task changes interaction or rendering.

## Minimal configuration

```ts
import type { ColumnConfig } from '@itagan/form-table'

const columns: ColumnConfig[] = [{
  key: 'name-column',
  label: '姓名',
  formItems: [{
    key: 'name-field',
    fieldKey: 'name',
    type: 'input',
    formItemProps: {
      rules: [{ required: true, message: '请输入姓名' }]
    },
    component: {
      props: { clearable: true }
    }
  }]
}]
```

## Look up details only when needed

- First integration: [quick start](https://github.com/itagan/form-table/blob/master/docs/guide/quick-start.md) and [API overview](https://github.com/itagan/form-table/blob/master/docs/api/configuration.md).
- Field, component, Slot, event, and Ref contracts: [Column / Item](https://github.com/itagan/form-table/blob/master/docs/api/columns.md), [Component](https://github.com/itagan/form-table/blob/master/docs/api/component.md), [Slot contexts](https://github.com/itagan/form-table/blob/master/docs/api/contexts.md), [events and Ref](https://github.com/itagan/form-table/blob/master/docs/api/events-and-ref.md).
- Rendering choices: [extension model](https://github.com/itagan/form-table/blob/master/docs/architecture/extension-model.md).
- Updates, async identity, and row actions: [controlled updates](https://github.com/itagan/form-table/blob/master/docs/features/data-updates.md), [stable identity](https://github.com/itagan/form-table/blob/master/docs/features/stable-identity.md), [common row actions](https://github.com/itagan/form-table/blob/master/docs/features/common-row-actions.md).
- Validation, remote configuration, and business flows: [validation](https://github.com/itagan/form-table/blob/master/docs/features/validation-reset.md), [remote schema](https://github.com/itagan/form-table/blob/master/docs/features/remote-schema.md), [form workflow](https://github.com/itagan/form-table/blob/master/docs/examples/form-workflow.md).
