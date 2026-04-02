# FormTable 组件说明

当前组件详细文档统一维护在仓库根目录：

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
            emit('update:tableData', newTableData)
                  ↓
            外层通过 v-model 或 @update:tableData 同步
```

`slotComponent` 也遵循同一条更新链路，推荐在插槽里使用组件提供的 `value` / `setValue`，避免直接修改 `row`。

## 配置约定

- 常用字段直接配置
- 非常见组件属性优先放到 `bind`
- 顶层 `attrs` 用来扩展 `el-form` / `el-table` / `el-table-column`
- 只有 `visible`、`defaultValue`、`formatter`、`colProps` 这类结构能力额外提供独立配置

## 关键模块

| 文件 | 职责 |
| ------ | ------ |
| `types.ts` | 类型定义 + provide/inject Symbol keys |
| `utils/attrs.ts` | 从 $attrs 按白名单提取 el-form/el-table/el-column 属性 |
| `utils/componentProps.ts` | 解析 FormItemConfig 为组件类型 + 合并属性 |
| `configs/defaultComponentConfigs.ts` | 各 type 的默认配置和组件映射表 |

## 推荐阅读顺序

1. `types.ts` - 理解数据结构
2. `index.vue` - 理解入口和数据流
3. `FormTableColumn.vue` → `FormTableRow.vue` → `FormTableItem.vue` → `ComponentWrapper.vue` - 理解渲染链路
4. `utils/` 和 `configs/` - 理解配置解析

## 示例参考

- `src/views/FormTableView.vue`
- `src/views/FormTableAdvancedView.vue`
- `src/views/DebugView.vue`

## 规则说明

- 支持精确规则路径，如 `tableData.0.name`
- 支持通配规则路径，如 `tableData.*.name`

## 同步说明

- 内部字段编辑会触发 `update:tableData`
- 同时也会触发 `update:formData`，并自动带上最新的 `tableData`
