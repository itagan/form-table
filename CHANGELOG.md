# Changelog

## Unreleased

### Changed

- 仓库调整为 npm 包、playground、文档说明共存的 pnpm workspace。
- `FormTable` 源码迁移到 `packages/form-table/src`，调试页面迁移到 `playground/src`。
- playground 首页改为示例导航，移除 Vue 默认脚手架页面和无关组件。

### Improved

- npm 包补充 `exports`、`types`、`peerDependencies`、`sideEffects`、`publishConfig` 和仓库元信息。
- 增加公开类型入口和发布前检查说明。

## 2026-07-02

### Changed

- 新版配置协议不再兼容旧版直写组件属性
- `FormItemConfig` 按职责分组为 `layout`、`component`、`display`、`behavior`
- 组件属性统一通过 `component.bind` 配置，移除 `component.props`
- `slotComponent` 简化为 `slot`
- `ComponentWrapper` 只负责渲染，动态配置解析前移到 `FormTableItem`

### Improved

- 新增 schema 归一化能力，缓存字段映射和字段 key 列表
- 将字段联动、行操作、校验控制拆成独立工具模块
- 移除 `index.vue` 中大量流程逻辑，降低主组件复杂度
- 隐藏字段校验清理改为集中控制，并减少深度 watch
- 文档入口收敛到 `README.md`、`CURRENT_FORMTABLE_DOC.md`、`CHANGELOG.md`

### Removed

- 删除过时或重复文档：`USAGE.md`、`SLOT_USAGE.md`、`README.en.md`、`RELEASE_NOTES_v1.0.0.md`、`NPM_PACKAGE_GUIDE.md`
- 删除旧版顶层组件属性配置，如 `placeholder`、`disabled`、`rows`、`format` 等

## 2026-03-27

### Changed

- 仓库只保留新版 `FormTable` 实现，移除旧版本组件和历史过程文档
- 统一文档入口，详细说明集中到 `CURRENT_FORMTABLE_DOC.md`
- 根目录 `README.md` 收敛为项目首页说明
- 组件目录 README 调整为实现导航

### Improved

- 简化 `FormTable` 主组件数据流，围绕 `props` 直接工作
- 收紧类型定义，减少不必要的细分配置
- 明确推荐通过 `component.bind` 配置组件属性
- 新增统一归档事件 `event`，便于集中监听和调试
- 精简 `attrs` 透传白名单，只保留常用稳定属性
- 高级示例页新增 `component.bind`、`select + options`、`textarea`、`event` 的演示

### Fixed

- 修复自定义组件属性透传不完整的问题
- 修复 `PhoneInput` 切换国家区号时不会同步回写值的问题
- 修复多处文档、示例、事件名与实际实现不一致的问题

### Current Entry Points

- 组件入口：`packages/form-table/src/index.vue`
- 当前文档：`CURRENT_FORMTABLE_DOC.md`
- 基础示例：`playground/src/views/FormTableView.vue`
- 高级示例：`playground/src/views/FormTableAdvancedView.vue`
