# FormTable v1.0.0 发布说明

## 版本概述

`v1.0.0` 是当前仓库整理后的首个稳定版本。

这个版本完成了从“旧实现与实验文档混杂”到“只保留新版实现、文档统一、示例可验证”的收敛。

## 本版本包含

- 只保留新版 `FormTable` 组件实现
- 统一组件入口为 `src/components/FormTable/index.vue`
- 统一详细文档为 `CURRENT_FORMTABLE_DOC.md`
- 提供基础示例、高级示例、调试示例
- 支持统一归档事件 `@event`
- 支持通过 `bind` 透传非常见组件属性
- 支持插槽扩展和自定义组件扩展

## 主要改进

### 1. 清理旧内容

- 删除旧版本组件文件
- 删除历史迁移、兼容性、优化过程文档
- 清理旧命名和旧事件写法

### 2. 收紧实现

- 简化主组件数据流
- 收紧类型定义，只保留当前真实支持的结构
- 简化 `ComponentWrapper` 行为
- 精简 `attrs` 白名单

### 3. 统一文档

- `README.md` 作为项目首页
- `CURRENT_FORMTABLE_DOC.md` 作为唯一详细文档
- `USAGE.md`、`SLOT_USAGE.md`、组件目录 README 调整为入口页
- 新增 `CHANGELOG.md`

### 4. 示例完善

- 基础示例覆盖常规表格表单使用
- 高级示例覆盖 `bind`、`event`、自定义组件、插槽
- 调试示例覆盖自定义组件接入

## 适用场景

- 后台编辑表格
- 批量录入
- 表格内嵌表单
- 配置化字段渲染

## 推荐入口

- 项目首页：`README.md`
- 当前文档：`CURRENT_FORMTABLE_DOC.md`
- 更新记录：`CHANGELOG.md`
- 高级示例：`src/views/FormTableAdvancedView.vue`

## 仓库简介文案

可直接用于 Gitee 仓库简介：

`基于 Vue 2.7 + Element UI + TypeScript 的表格表单组件，支持配置驱动渲染、统一校验、动态增删行、插槽扩展、自定义组件和 bind 透传。`
