# Changelog

## Unreleased

### Added

- 新增可复用的公共自定义表头 Playground 示例，支持必填标识、图标、Tooltip 和多列共享同一 `headerSlot`。
- 新增字段组件 `nativeListeners` 配置，可携带字段更新上下文监听 Element UI、直接组件、注册 Type 和 `text` 根节点的标准 DOM 事件。
- 新增字段组件事件专题，集中说明 model、组件 `$emit`、根节点 DOM 事件、`text` 和 Slot 的选择及执行边界。

### Changed

- 文档明确 FormTable 不会根据字段校验规则自动推断表头必填状态；简单标识可使用 `headerProps` 配合样式，复杂展示推荐封装业务表头组件并通过 `headerSlot` 渲染。

## 1.3.2 - 2026-09-01

### Fixed

- 修复动态 Hint 直接返回数字时初始值不展示的问题，数字（包括 `0`）现会自动转换为字符串。

## 1.3.1 - 2026-08-31

### Fixed

- 修复 GitHub Pages 部署环境中的文档与 Playground 双向导航链接。

### Changed

- 将 npm 包的仓库、主页和问题反馈地址更新为 GitHub，并保留 Gitee 镜像说明。
- 重构字段上下文、受控更新、动态列、Tooltip 与字段类型诊断等内部实现，并重新组织测试与公开类型断言，保持公开 API 不变。
- 优化文档信息架构、编辑行身份说明，以及 Playground 响应式导航和切换动效。

## 1.3.0 - 2026-08-30

### Added

- 新增稳定的 `.form-table-form-item` 与 `.form-table-field-control--full` 样式定位标记，方便业务进行局部覆盖。
- 补充 Row、Col、FormItem 与字段组件的 class/style 定位、动态透传和 scoped CSS 使用指南。
- 补充宽表通过外部按钮滚动到首列、末列或指定字段的文档与 Playground 示例。

### Changed

- 将组件布局样式迁移到独立 CSS 源码，继续保留显式 `@itagan/form-table/style.css` 入口、包导出和 CSS sideEffects。
- 内置 `number/date/time/time-select` 默认填满字段列宽，并保留 `component.props.style` 和业务 class 覆盖能力。
- 补充 `select` 等非固定宽度内置组件通过 `component.props.style` 或业务 class 铺满字段列的文档。

## 1.2.0 - 2026-08-29

### Added

- FormTable Ref 新增按业务行定位字段、单字段校验与清理、字段聚焦和首个错误定位方法。
- FormTable Ref 新增原子 `updateRows`，可在一次受控数组提交中顺序组合多行 Patch。
- 新增可选 `navigationOptions`，支持 Enter/Shift+Enter 在当前已挂载的可编辑字段间导航。

### Changed

- 串联字段定位、原子批量更新和键盘导航的 README、侧栏、专题、API 与 Playground 文档入口。

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
