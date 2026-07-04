# FormTable

基于 `Vue 2.7 + Element UI + TypeScript` 的表格表单组件，适合后台“表格内嵌表单”场景。

## 安装

```bash
pnpm add formtable
```

使用方需要安装并注册 peer dependencies：

- `vue@^2.7.7`
- `element-ui@^2.15.14`

## 使用

```ts
import 'element-ui/lib/theme-chalk/index.css'
import 'formtable/style.css'
import FormTable from 'formtable'
import type { ColumnConfig, TableRow } from 'formtable'
```

也可以注册为全局组件：

```ts
import Vue from 'vue'
import { FormTablePlugin } from 'formtable'

Vue.use(FormTablePlugin)
```

## 构建产物

包发布时只包含以下内容：

- `dist/formtable.es.js`：ES module 入口
- `dist/formtable.umd.cjs`：CommonJS / UMD 入口
- `dist/style.css`：组件样式
- `dist/types/public-types.d.ts`：公开类型入口

## 类型边界

包入口只导出业务侧稳定使用的公开类型，例如 `ColumnConfig`、`FormItemConfig`、`TableRow`、`FormTableExpose`、`FormTableEventPayload` 和 `FormTableFieldChangePayload`。

内部 provide/inject key、dispatch、内部事件命令和组件编排类型不会从 `formtable` 包入口导出。

完整 API 文档维护在仓库根目录：

- `CURRENT_FORMTABLE_DOC.md`

## 组件架构

```text
FormTable (index.vue)          ← 入口: el-form + el-table 组合
├── FormTableColumn            ← 列: el-table-column，每列可包含多行布局
│   └── FormTableRow           ← 行: el-row，每行包含多个表单项
│       └── FormTableItem      ← 表单项: el-form-item，负责校验和 tooltip
│           └── ComponentWrapper ← 动态组件: 根据 type 渲染对应 Element 组件
```

## 数据流

```text
props.tableData → el-table 渲染
                  ↓ 用户编辑
            dispatch('update:row', rowIndex, row, fieldKey, value)
                  ↓
            onValueChange（如有配置）继续解析联动 patch
                  ↓
            emit('update:tableData', newTableData)
                  ↓
            外层通过 v-model 或 @update:tableData 同步
```

`slot` 也遵循同一条更新链路，推荐在插槽里使用组件提供的 `value` / `setValue`，避免直接修改 `row`。

## 配置约定

- 结构字段直接配置，比如 `label`、`rules`
- 结构能力按职责放到 `layout`、`component`、`display`、`behavior`
- 组件属性统一放到 `component.bind`
- `component.bind`、`layout.colProps`、`component.options` 支持函数写法，可按当前上下文动态返回
- 列头支持 `required`、`headerSlot` 和 `column.props.renderHeader`
- 顶层 `attrs` 用来扩展 `el-form` / `el-table` / `el-table-column`
- 只有 `behavior.visible`、`behavior.defaultValue`、`display.formatter`、`layout.colProps` 这类结构能力额外提供独立配置

## 能力矩阵

| 能力 | 使用方式 | 说明 |
| ------ | ------ | ------ |
| FormTable 自有 props | `tableData`、`columns`、`rules`、`formData`、`customComponents`、`loading` | 管理表格内表单的数据、结构、校验和扩展组件 |
| Element Form props | 顶层 attrs，如 `label-width`、`size`、`disabled` | 通过白名单透传给内部 `el-form` |
| Element Table props | 顶层 attrs，如 `border`、`stripe`、`height`、`max-height` | 通过白名单透传给内部 `el-table` |
| Element Table events | 直接监听同名事件，如 `@row-click`、`@selection-change`、`@sort-change` | 参数保持 Element UI 原生格式，同时进入 `@event` 安全归档 |
| Element Form methods | `ref.validate()`、`ref.resetFields()`、`ref.clearValidate()`、`ref.getNativeFormRef()` | FormTable ref 汇总常用方法，也可取原生实例 |
| Element Table methods | `ref.clearSelection()`、`ref.doLayout()`、`ref.sort()`、`ref.getNativeTableRef()` | FormTable ref 汇总常用方法，也可取原生实例 |
| Element Table Column props | `column.props`，如 `width`、`align`、`type`、`renderHeader` | 透传给 `el-table-column`；`type=index/selection/expand` 使用原生列渲染 |
| FormTable 扩展能力 | 字段 slot、表头 slot、`required`、行操作、路径字段、显隐和联动 | 解决表格内表单场景中 Element UI 原生 API 不直接覆盖的部分 |

## 关键模块

| 文件 | 职责 |
| ------ | ------ |
| `types.ts` | 类型定义 + provide/inject Symbol keys |
| `composables/useFormTableModel.ts` | formModel、运行时上下文、tableData/formData 同步 |
| `composables/useFormTableSchema.ts` | columns 归一化、字段索引、可见字段校验路径 |
| `composables/useFormTableRows.ts` | 字段提交、同步联动、行增删改移、actions |
| `composables/useFormTableValidation.ts` | 隐藏字段校验清理和 validateField 包装 |
| `composables/useFormTableEvents.ts` | 内部更新命令和外部业务事件分流 |
| `composables/useFormTableExpose.ts` | 维护业务侧通过 ref 调用的公开方法 |
| `utils/attrs.ts` | 从 $attrs 按白名单提取 el-form/el-table/el-column 属性 |
| `utils/componentProps.ts` | 解析 FormItemConfig 为组件类型 + 合并属性 |
| `utils/schema.ts` | 归一化 columns，生成字段索引 |
| `utils/fieldChange.ts` | 处理字段变化、联动 patch 和变更记录 |
| `utils/rowActions.ts` | 处理增删插移等纯行操作 |
| `utils/validation.ts` | 处理校验字段计算和隐藏字段错误清理 |
| `configs/defaultComponentConfigs.ts` | 各 type 的默认配置和组件映射表 |

## 推荐阅读顺序

1. `types.ts` - 理解数据结构
2. `index.vue` - 理解入口和数据流
3. `composables/` - 理解模型、schema、事件、行操作和校验如何编排
4. `FormTableColumn.vue` → `FormTableRow.vue` → `FormTableItem.vue` → `ComponentWrapper.vue` - 理解渲染链路
5. `utils/` 和 `configs/` - 理解配置解析

## 示例参考

- `playground/src/views/FormTableView.vue`：基础编辑和校验。
- `playground/src/views/FormTableAdvancedView.vue`：插槽、自定义组件、行操作、联动和事件归档。
- `playground/src/views/DynamicSlotTestView.vue`：动态插槽、显隐和删除行复现。
- `playground/src/views/DebugView.vue`：自定义组件直连与 FormTable 注册后的行为对照。

## 维护检查

核心行为测试位于 `src/__tests__/FormTable.behavior.test.ts`，用于保护组件级数据流：

- 内置输入组件编辑后应触发 `update:tableData` 和 `field-change`
- 字段 slot 应通过 `setValue` 进入同一条更新链路
- `customComponents` 注册的自定义组件应继续支持默认 `v-model`

发布前推荐运行：

```bash
pnpm release:check
```

## 发布前检查

```bash
pnpm test
pnpm build
npm pack --dry-run
```

## 索引列

索引列复用 Element UI 原生 `el-table-column` 能力，通过 `column.props.type = 'index'` 配置。FormTable 会跳过单元格表单布局，让 Element UI 自己渲染索引内容。

表格内表单行通常是动态高度，不建议给索引列配置 `fixed`；Element UI 固定列克隆在复杂行高下可能出现高度不同步。

```ts
const columns = [
  {
    name: '序号',
    props: {
      type: 'index',
      width: '70px',
      align: 'center',
      index: (index) => index + 1
    },
    children: []
  }
]
```

## 表头渲染

列头渲染优先级为：`props.renderHeader` > `headerSlot` > 默认表头。默认表头会在 `required: true` 时展示必填标识。

`required` 只控制列头必填标识，不会自动生成字段校验规则；字段校验仍通过全局 `rules` 或字段自身 `rules` 配置。

```ts
const columns = [
  {
    name: '姓名',
    required: true,
    headerSlot: 'name-header',
    children: []
  }
]
```

```vue
<template #name-header="{ label, required }">
  <span v-if="required" class="required-mark">*</span>
  <span>{{ label }}</span>
  <el-tooltip content="按姓名筛选">
    <i class="el-icon-search"></i>
  </el-tooltip>
</template>
```

`headerSlot` 的上下文包含 `column`、`columnIndex`、`label`、`required`、`formData` 和 `tableData`。

列配置的 `props` 会直接透传给 `el-table-column`，因此也可以使用 Element UI 原生的 `render-header` 对应的 camelCase 写法 `renderHeader`：

```ts
const columns = [
  {
    name: '联系方式',
    props: {
      renderHeader: (h, { column }) => h('span', [
        h('span', column.label),
        h('el-tooltip', {
          props: {
            content: '按姓名筛选'
          }
        }, [
          h('i', {
            class: 'el-icon-search'
          })
        ])
      ])
    },
    children: []
  }
]
```

## 规则说明

- 支持精确规则路径，如 `tableData.0.name`
- 支持通配规则路径，如 `tableData.*.name`
- `FormItemConfig.key` 也支持路径写法，如 `profile.city`

## 同步说明

- 内部字段编辑会触发 `update:tableData`
- 同时也会触发 `update:formData`，并自动带上最新的 `tableData`
- 因显隐切换而隐藏的字段会自动清理已有校验状态
- 隐藏字段默认保留值，不会自动从行数据中删除

## ref 方法

- 表单方法：`validate`、`resetFields`、`clearValidate`、`validateField`
- 表格原生方法：`clearSelection`、`toggleRowSelection`、`toggleAllSelection`、`toggleRowExpansion`、`setCurrentRow`、`clearSort`、`clearFilter`、`doLayout`、`sort`
- 原生实例：`getNativeFormRef`、`getNativeTableRef`
- 行操作：`addRow`、`insertRow`、`copyRow`、`updateRow`、`moveRow`、`getRow`、`removeRow`、`validateRow`
- `slot` 上下文也提供当前行的快捷方法，如 `removeCurrentRow`、`copyCurrentRow`、`insertBefore`、`insertAfter`
- `slot` 上下文也提供 `isFirstRow`、`isLastRow`、`moveUp`、`moveDown`，更适合直接写操作列

## 字段事件

- 组件提供统一的 `field-change` 事件
- 单个字段组件事件可通过 `listeners` 配置透传并拿到字段上下文
- 如果字段配置了 `onValueChange`，可以在值变化后返回行 patch 做最小联动更新
- `addRow`、`insertRow`、`copyRow` 产生的新行也会应用 `onValueChange`
- 表格原生事件会同名透出并进入统一 `event` 归档：`select`、`select-all`、`selection-change`、`cell-mouse-enter`、`cell-mouse-leave`、`cell-click`、`cell-dblclick`、`row-click`、`row-contextmenu`、`row-dblclick`、`header-click`、`header-contextmenu`、`sort-change`、`filter-change`、`current-change`、`header-dragend`、`expand-change`
