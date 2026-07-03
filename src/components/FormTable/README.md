# FormTable 组件说明

当前组件详细文档统一维护在仓库根目录：

- `CURRENT_FORMTABLE_DOC.md`

这份文件只保留实现导航，API 和示例以根目录文档为准。

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
- 顶层 `attrs` 用来扩展 `el-form` / `el-table` / `el-table-column`
- 只有 `behavior.visible`、`behavior.defaultValue`、`display.formatter`、`layout.colProps` 这类结构能力额外提供独立配置

## 关键模块

| 文件 | 职责 |
| ------ | ------ |
| `types.ts` | 类型定义 + provide/inject Symbol keys |
| `composables/useFormTableModel.ts` | formModel、运行时上下文、tableData/formData 同步 |
| `composables/useFormTableSchema.ts` | columns 归一化、字段索引、可见字段校验路径 |
| `composables/useFormTableRows.ts` | 字段提交、同步联动、行增删改移、actions |
| `composables/useFormTableValidation.ts` | 隐藏字段校验清理和 validateField 包装 |
| `composables/useFormTableEvents.ts` | 内部更新命令和外部业务事件分流 |
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

- `src/views/FormTableView.vue`
- `src/views/FormTableAdvancedView.vue`
- `src/views/DynamicSlotTestView.vue`
- `src/views/DebugView.vue`

## 规则说明

- 支持精确规则路径，如 `tableData.0.name`
- 支持通配规则路径，如 `tableData.*.name`
- `FormItemConfig.key` 也支持路径写法，如 `profile.city`

## 同步说明

- 内部字段编辑会触发 `update:tableData`
- 同时也会触发 `update:formData`，并自动带上最新的 `tableData`
- 因显隐切换而隐藏的字段会自动清理已有校验状态
- 隐藏字段默认保留值，不会自动从行数据中删除

## 行操作

- `ref` 现在支持 `insertRow`、`copyRow`、`updateRow`、`moveRow`、`getRow`、`validateField`、`validateRow`
- `slot` 上下文也提供当前行的快捷方法，如 `removeCurrentRow`、`copyCurrentRow`、`insertBefore`、`insertAfter`
- `slot` 上下文也提供 `isFirstRow`、`isLastRow`、`moveUp`、`moveDown`，更适合直接写操作列

## 字段事件

- 组件提供统一的 `field-change` 事件
- 单个字段组件事件可通过 `listeners` 配置透传并拿到字段上下文
- 如果字段配置了 `onValueChange`，可以在值变化后返回行 patch 做最小联动更新
- `addRow`、`insertRow`、`copyRow` 产生的新行也会应用 `onValueChange`
