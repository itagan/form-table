# Changelog

## 1.0.0 - 2026-08-23

`@itagan/form-table` 首次公开发布。

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
