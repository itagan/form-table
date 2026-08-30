# Changelog

## Unreleased

## 1.2.0 - 2026-08-29

### Added

- FormTable Ref 新增按业务行定位字段、单字段校验与清理、字段聚焦和首个错误定位方法。
- FormTable Ref 新增原子 `updateRows`，可在一次受控数组提交中顺序组合多行 Patch。
- 新增可选 `navigationOptions`，支持 Enter/Shift+Enter 在当前已挂载的可编辑字段间导航。

### Changed

- 串联字段定位、原子批量更新和键盘导航的 README、侧栏、专题、API 与 Playground 文档入口。
- 将组件布局样式收敛到独立 CSS 源码和稳定类名，并补充加载、覆盖及跨环境边界文档。
- 补充 Row、Col、FormItem 与字段组件的 class/style 定位、动态透传和 scoped CSS 使用指南。

## 1.1.0 - 2026-08-29

### Added

- `component.props` 和自定义字段 Type 的默认 Props 可读取当前 `bindingValue`，便于复合绑定组件按组合值计算属性。
- 新增公开类型 `FormTableFieldBindingContext`，区分只读 Props 上下文与包含更新能力的字段事件上下文。

## 1.0.1 - 2026-08-28

### Fixed

- 修复稳定 key 复用 FormTable、父级整体重建循环项且多个实例共享列配置时，单元格操作 Slot 仍调用旧闭包的问题。
- 表头、字段内容、FormItem Label 和 Error Slot 改为解析父组件最新函数，避免配置对象复用时渲染陈旧内容。

### Added

- 新增共享列、共享 `cellSlot`、循环渲染和整体重建板块对象的 Playground 示例与使用文档。
- 文档明确 npm 公开包入口、`latest` 安装方式和新版本维护流程。

## 1.0.0 - 2026-08-25

[`@itagan/form-table@1.0.0`](https://www.npmjs.com/package/@itagan/form-table/v/1.0.0) 首次公开发布。

### Added

- 提供基于 Vue 2.7 和 Element UI 的可编辑 FormTable 组件，支持 TypeScript 类型声明、ES Module、CommonJS 和独立样式入口。
- 提供 15 种 Element UI 内置字段类型、自定义组件字段、字段 Slot、单元格 Slot，以及可复用的自定义字段类型注册机制。
- 支持动态列、动态字段配置、受控表格数据、稳定行列身份、嵌套字段路径和不可变行更新。
- 支持 `binding.map` 复合字段映射，可将对象或数组组件值原子写回多个行字段。
- 提供字段校验、原生 Table/Form Ref、Element Table 事件透传和完整的字段更新上下文。
- 提供表头与字段 Hint，支持原生 title、单实例 Tooltip、键盘访问和 ARIA 描述关系。
- 提供文档站、Playground、常见业务场景示例和可直接复制的配置示例。

### Compatibility

- Vue：`^2.7.1`。
- Element UI：`^2.4.9`。
- 推荐使用 Vue `2.7.16` 与 Element UI `2.15.14`。
- Vue 和 Element UI 作为 peer dependencies，不会打包进发布产物。

### Quality

- 公共入口、运行时导出和类型声明均经过发布包消费测试。
- 覆盖最低 peer dependency 版本的类型、挂载、数据更新和校验验证。
- 发布门禁包含代码规范、测试覆盖率、类型检查、库构建、文档检查、站点构建和 npm 打包检查。
