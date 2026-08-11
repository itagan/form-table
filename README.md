# FormTable Workspace

`FormTable` 是一个基于 `Vue 2.7 + Element UI + TypeScript` 的表格表单组件。仓库已经调整为 npm 包、调试页面和文档说明共存的单体仓库。

## 仓库结构

```text
packages/
  form-table/        # 可发布到 npm 的组件包
playground/          # Vue 2.7 调试和示例应用
docs/                # Vue 3 / VitePress 文档站与统一站点产物
```

核心入口：

- 组件包源码：`packages/form-table/src`
- npm 包入口：`packages/form-table/src/index.ts`
- 调试应用：`playground/src`
- 文档总站：[docs/index.md](./docs/index.md)

## 常用命令

```bash
pnpm install
pnpm dev
pnpm site:dev
pnpm site:build
pnpm site:preview
pnpm lint
pnpm type-check
pnpm test
pnpm test:coverage
pnpm build
pnpm release:check
```

命令说明：

- `pnpm dev`：启动 `playground`，用于本地调试组件。
- `pnpm site:dev`：同时启动 Playground 与文档站，保持两个 Vue 运行时隔离。
- `pnpm site:build`：构建单个可部署目录，文档位于 `/`，Playground 位于 `/playground/`。
- `pnpm site:preview`：预览 `pnpm site:build` 生成的统一站点。
- `pnpm lint`：检查组件包和 playground 的 TypeScript/Vue 代码规范。
- `pnpm type-check`：检查组件包和 playground。
- `pnpm test`：运行组件包核心逻辑单测。
- `pnpm test:coverage`：运行组件测试并校验覆盖率阈值。
- `pnpm build`：先构建 npm 包，再构建 playground。
- `pnpm release:check`：执行 Lint、覆盖率测试、类型检查、构建、文档和 npm 打包预检。
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

FormTable 将 Vue 和 Element UI 声明为 peer dependencies，不会重复安装或注册它们。支持范围、推荐版本与最小使用示例见[快速开始](./docs/guide/quick-start.md)。

## 调试页面

完整路由和用途统一维护在[示例索引](./docs/examples/index.md)。本地运行 `pnpm site:dev` 可同时启动 Playground 和 VitePress 文档站。

`playground` 通过 workspace alias 直接引用 `packages/form-table/src/index.ts`，开发时无需先构建组件包。

文档和示例保留独立源码目录，避免 Vue 2.7 与 VitePress 的 Vue 3 依赖混用；发布时由 `pnpm site:build` 合并为 `docs/.vitepress/dist`，只需部署一个静态目录和一个域名。

## 测试覆盖

`pnpm test` 会运行组件包的 Vitest 测试，当前覆盖：

- 纯工具逻辑：嵌套字段路径的不可变读写。
- 组件行为：渲染模式优先级、type、component、slot、动态配置、原生事件参数透传和不可变更新协议。

## 文档

- [完整能力文档](./CURRENT_FORMTABLE_DOC.md)
- [VitePress 文档总站](./docs/index.md)
- [功能专题](./docs/features/index.md)
- [示例索引](./docs/examples/index.md)
- [更新记录](./CHANGELOG.md)
- [组件包说明](./packages/form-table/README.md)
- [维护与发布](./docs/migration/npm-package.md)

## 发布前检查

```bash
pnpm release:check
```
