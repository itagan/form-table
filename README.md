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
pnpm build
```

命令说明：

- `pnpm dev`：启动 `playground`，用于本地调试组件。
- `pnpm type-check`：检查组件包和 playground。
- `pnpm build`：先构建 npm 包，再构建 playground。
- `pnpm --filter formtable build`：只构建可发布 npm 包。

## npm 包使用

```bash
pnpm add formtable
```

```ts
import FormTable from 'formtable'
import type { ColumnConfig, TableRow } from 'formtable'
```

使用方需要同时安装并注册 peer dependencies：

- `vue@^2.7.7`
- `element-ui@^2.15.14`

## 调试页面

本地启动后主要路由：

- `/form-table`
- `/form-table-advanced`
- `/dynamic-slot-test`
- `/debug`

`playground` 通过 workspace alias 直接引用 `packages/form-table/src/index.ts`，开发时无需先构建组件包。

## 文档

- [完整能力文档](./CURRENT_FORMTABLE_DOC.md)
- [更新记录](./CHANGELOG.md)
- [组件包说明](./packages/form-table/README.md)
