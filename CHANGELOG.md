# Changelog

> 当前 npm 包尚未首次发布。以下版本标题和日期只记录首发前仓库演进，不代表 npm registry 中已有对应版本。

## Unreleased

### Improved

- 字段 Hint Tooltip 保持 `el-form-item` 统一触发，并优先使用唯一可见的实际组件根节点定位；固定宽度组件不再按整个字段区域偏移，多根或无有效根节点时自动回退。
- Hint 的内部依赖注入收敛为单一上下文，Tooltip 控制器改由根组件直接传入容器；同时停止从包入口导出仅服务实现拆分的字段分支、解析结果和内部上下文类型。
- 字段布局从 `Column → RowConfig[] → FormItemConfig[]` 收平为 `Column → FormItemConfig[]`；每个单元格固定使用一个可换行 Flex Row，复杂多 Row 布局统一交给 `cellSlot`。
- 原样透传 Element Table 的 `empty/append` 根级 Slot，并为排序、筛选、表头、单元格及选择事件补充公开类型、可运行示例和回归测试。
- 新增 `createFormTable<TRow>()` 泛型组件工厂，使 `tableData`、列配置、rowKey、动态上下文和组件事件共享业务行类型，且不创建额外运行时组件。
- 公共 API 删除低收益的严格字段路径助手，字段 `model` 删除与省略配置重复的 `true` 状态；Form/Table Ref 改为继承 Element UI 原生类型并只补充业务行泛型。
- 行更新按需校验 rowKey 身份，避免持续扫描整张表和配置树；互斥列模式与配置结构由公开联合类型约束。
- `headerHint/hint` 收敛为动态字符串或关闭值；解析结果仅用于内部展示，不再传播给 component 动态配置、listener 或 Slot。
- `hintOptions.field` 未配置或为 `false` 时无全局字段处理，`true` 默认字符串化，函数统一格式化；Item 不写或返回空值时继承、`false` 关闭、非空内容覆盖。
- 单实例 Tooltip 增加嵌套 FormTable 隔离、表头键盘入口、Escape 关闭和 token 安全的 `aria-describedby` 管理，并将 Element UI 私有能力收口到版本适配层。
- Tooltip 模式默认增加 100ms 打开延迟，减少鼠标快速扫过字段时的闪烁，同时允许通过 `tooltipProps.openDelay` 覆盖。
- 新增独立 Hint 多场景 Demo，并将专题文档收敛为 `/features/hint`：覆盖作用范围、全局格式化、关闭、title/Tooltip、键盘 ARIA 和 Slot 自定义边界。
- 新增可直接复制的常见操作列文档，覆盖末尾新增、当前行后插入、复制、删除、稳定行标识和校验清理；行列操作 Demo 同步改用 `cellSlot` 并增加后插按钮。
- 安装文档仅保留 FormTable 的安装命令，并单独说明项目需要预先安装、注册及满足的 Vue 和 Element UI peer dependency 版本，以及低版本升级建议和 Vue 3 暂不支持的兼容边界；经版本矩阵验证后，最低版本调整为 Vue `2.7.1` 和 Element UI `2.4.9`，最佳建议版本明确为 Vue 2 生态最终版本 Vue `2.7.16` + Element UI `2.15.14`。
- 新增与 `children` 互斥的列级 `cellSlot`，用于操作列和纯展示组合单元格；不需要虚拟 `fieldKey`，也不创建 Row/Item 表单包装节点，高级、议程和费用明细示例已同步迁移。
- 外层提示 API 收敛为语义内容与表级策略两层：默认表头、表头 Slot 与字段继续分别使用 `headerHint/hint`，根级 `hintOptions` 统一选择原生 title 或表级单实例 Tooltip；各层 props 中的 title 继续按目标节点透传。
- 默认表头和表头 Slot 统一由 `.form-table-column-header` 包装并应用 `headerProps`；`headerHint` 仅在目标范围包含表头时启用，Slot scope 不再重复暴露已经应用的表头属性。
- 优化动态 Column 渲染身份：唯一 `column.key` 在增删、显隐和同顺序配置替换时保持稳定，仅在已有列相对顺序变化时整体换代以同步 Element UI 列顺序。
- 补充动态行列优化说明，明确 `rowKey`、`column.key`、`item.key` 的职责，以及受控数据立即回写、后端保存可延迟的边界。
- 动态上下文改为按属性惰性建立响应依赖，单字段更新不再让其他行中仅依赖当前行的配置重新求值；同步连续更新同时复用 `rowKey` 索引。
- 字段路径规范化增加 512 条有界缓存，并将列身份与受控更新逻辑从根组件拆分为独立内部模块。
- 演示站的组件配置、当前数据、调试输出和补充说明统一支持折叠，长内容默认收起，操作产生结果时可自动展开对应面板。

### Fixed

- 修复单实例 Tooltip 在相邻字段间快速切换时，旧浮层拦截鼠标并遗留延迟关闭，导致新目标提示闪现后消失的问题；内部非交互浮层不再接收鼠标事件，已显示的 Tooltip 会直接重定向到新目标。
- 移除不符合字段默认 v-model 协议的内置 `upload` 类型；上传统一通过 `type: 'component'` 接入业务组件，或通过 `type: 'slot'` 直接组合 `el-upload`。
- 修复 Tooltip 模式下输入框已聚焦时，鼠标移出字段后仍因焦点兜底导致提示常驻的问题；纯键盘焦点访问保持可用。
- 内置字段类型只保留 Element UI 默认提供的组件映射；移除非 Element UI 内置的 `tree-select`，此类组件统一通过 `type: 'component'` 接入。
- 移除重复的 `tag-input` 快捷别名；可创建多标签选择统一使用 `type: 'select'` 并通过 `component.props` 配置。

## 0.1.0 - 2026-07-04

### Changed

- 仓库调整为 npm 包、playground、文档说明共存的 pnpm workspace。
- `FormTable` 源码迁移到 `packages/form-table/src`，调试页面迁移到 `playground/src`。
- playground 首页改为示例导航，移除 Vue 默认脚手架页面和无关组件。
- `docs` 目录拆分为 guide、api、examples、migration，为后续文档站化做准备。
- 从完整长文档中拆出配置 API、事件与 Ref API 文档页。
- npm 包名调整为作用域包 `@itagan/form-table`。

### Improved

- npm 包补充 `exports`、`types`、`peerDependencies`、`sideEffects`、`publishConfig` 和仓库元信息。
- 增加公开类型入口和发布前检查说明。
- 增加 GitHub Actions，在 `master` push 和 PR 时自动运行 `pnpm release:check`。
- 增加组件行为测试，覆盖 input、slot `setValue`、自定义组件 `v-model` 和字段变更事件。
- 打磨自定义组件诊断页，支持组件直连和 FormTable 注册后的行为对照。

### Fixed

- 修复删除动态插槽行时 Element UI `label-width="auto"` 清理异常。
- 修复 `rules`、`formData`、`customComponents` 未传入时的必填 prop 警告。

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
