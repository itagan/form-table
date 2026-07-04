# FormTable Workspace

`FormTable` 是一个基于 `Vue 2.7 + Element UI + TypeScript` 的表格表单组件。仓库已经调整为 npm 包、调试页面和文档说明共存的单体仓库。

## 仓库结构

```text
packages/
  form-table/        # 可发布到 npm 的组件包
playground/          # 本地调试和示例应用
docs/                # 仓库级文档入口
```

核心入口：

- 组件包源码：`packages/form-table/src`
- npm 包入口：`packages/form-table/src/index.ts`
- 调试应用：`playground/src`
- 完整能力文档：`CURRENT_FORMTABLE_DOC.md`

## 常用命令

```bash
pnpm install
pnpm dev
pnpm type-check
pnpm test
pnpm build
pnpm release:check
```

命令说明：

- `pnpm dev`：启动 `playground`，用于本地调试组件。
- `pnpm type-check`：检查组件包和 playground。
- `pnpm test`：运行组件包核心逻辑单测。
- `pnpm build`：先构建 npm 包，再构建 playground。
- `pnpm release:check`：执行测试、类型检查、构建和 npm 打包预检。
- `pnpm --filter @itagan/form-table build`：只构建可发布 npm 包。

## npm 包使用

```bash
pnpm add @itagan/form-table
```

```ts
import 'element-ui/lib/theme-chalk/index.css'
import '@itagan/form-table/style.css'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'
```

使用方需要同时安装并注册 peer dependencies：

- `vue@^2.7.7`
- `element-ui@^2.15.14`

## 调试页面

本地启动后主要路由：

| 路由 | 用途 |
| ------ | ------ |
| `/form-table` | 基础编辑场景，验证最小 columns、rules 和字段同步。 |
| `/form-table-advanced` | 综合示例，覆盖插槽、自定义组件、行操作、联动和事件归档。 |
| `/dynamic-slot-test` | 动态插槽专项复现页，适合验证删除、显隐和 slot 上下文。 |
| `/debug` | 自定义组件诊断台，对比组件直连和 FormTable 注册后的 v-model / change / update:tableData 行为。 |
| `/form-table-docs` | playground 内置能力文档页，快速查 props、事件、ref 和配置约定。 |

`playground` 通过 workspace alias 直接引用 `packages/form-table/src/index.ts`，开发时无需先构建组件包。

## 测试覆盖

`pnpm test` 会运行组件包的 Vitest 测试，当前覆盖：

- 纯工具逻辑：路径读写、规则匹配、schema 归一化、行操作、字段联动和校验路径。
- 组件行为：基础 input 编辑、字段 slot 的 `setValue`、自定义组件 `v-model` 注入，以及对应的 `update:tableData` / `field-change` 事件。

## 文档

- [完整能力文档](./CURRENT_FORMTABLE_DOC.md)
- [更新记录](./CHANGELOG.md)
- [组件包说明](./packages/form-table/README.md)
- [文档站准备目录](./docs/README.md)

## 发布前检查

```bash
pnpm release:check
```
