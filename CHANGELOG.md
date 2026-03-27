# Changelog

## 2026-03-27

### Changed

- 仓库只保留新版 `FormTable` 实现，移除旧版本组件和历史过程文档
- 统一文档入口，详细说明集中到 `CURRENT_FORMTABLE_DOC.md`
- 根目录 `README.md` 收敛为项目首页说明
- `USAGE.md`、`SLOT_USAGE.md`、`src/components/FormTable/README.md` 调整为轻量入口页

### Improved

- 简化 `FormTable` 主组件数据流，围绕 `props` 直接工作
- 收紧类型定义，保留常见字段直写，减少不必要的细分配置
- 明确推荐通过 `bind` 透传非常见组件属性
- 新增统一归档事件 `event`，便于集中监听和调试
- 精简 `attrs` 透传白名单，只保留常用稳定属性
- 高级示例页新增 `bind`、`select + options`、`textarea + bind`、`event` 的演示

### Fixed

- 修复自定义组件属性透传不完整的问题
- 修复 `PhoneInput` 切换国家区号时不会同步回写值的问题
- 修复多处文档、示例、事件名与实际实现不一致的问题

### Current Entry Points

- 组件入口：`src/components/FormTable/index.vue`
- 当前文档：`CURRENT_FORMTABLE_DOC.md`
- 基础示例：`src/views/FormTableView.vue`
- 高级示例：`src/views/FormTableAdvancedView.vue`
