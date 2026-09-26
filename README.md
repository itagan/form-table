# FormTable Workspace

`FormTable` 是一个基于 `Vue 2.7 + Element UI + TypeScript` 的表格表单组件。本页只说明仓库开发；组件行为与 API 统一以 [VitePress 文档](./docs/index.md)为准。

[![npm version](https://img.shields.io/npm/v/%40itagan%2Fform-table.svg)](https://www.npmjs.com/package/@itagan/form-table)

组件已作为公开包 [`@itagan/form-table`](https://www.npmjs.com/package/@itagan/form-table) 发布到 npm Registry；业务项目可直接安装，不需要从本仓库复制源码或配置 workspace alias。

## 源码仓库

- GitHub 主仓库：<https://github.com/itagan/form-table>
- Gitee 国内镜像：<https://gitee.com/itagan/form-table>

两个仓库同步维护；GitHub 用于源码发布和公共协作，Gitee 为国内访问提供镜像。

## 仓库结构

```text
packages/
  form-table/        # 已发布到 npm 的组件包
playground/          # Vue 2.7 调试和示例应用
docs/                # Vue 3 / VitePress 文档站与统一站点产物
skills/form-table/    # 供组件使用者单独安装的 Agent Skill
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
pnpm site:build:github
pnpm site:check:github
pnpm site:preview
pnpm lint
pnpm type-check
pnpm test
pnpm test:coverage
pnpm test:e2e
pnpm test:e2e:ui
pnpm build
pnpm compat:check
pnpm pack:check
pnpm release:check
```

命令说明：

- `pnpm dev`：启动 `playground`，用于本地调试组件。
- `pnpm site:dev`：同时启动 Playground 与文档站，保持两个 Vue 运行时隔离。
- `pnpm site:build`：构建单个可部署目录，文档位于 `/`，Playground 位于 `/playground/`。
- `pnpm site:build:github`：按 GitHub Pages 的 `/form-table/` 子路径构建文档和 Playground。
- `pnpm site:check:github`：校验 GitHub Pages 构建的资源和页面路径。
- `pnpm site:preview`：预览 `pnpm site:build` 生成的统一站点。
- `pnpm lint`：检查组件包和 playground 的 TypeScript/Vue 代码规范。
- `pnpm type-check`：检查组件包和 playground。
- `pnpm test`：运行组件包核心逻辑单测。
- `pnpm test:coverage`：运行组件测试并校验覆盖率阈值。
- `pnpm test:e2e`：构建 npm 包与 E2E Playground，并在真实 Chromium 中验证关键交互。
- `pnpm test:e2e:ui`：使用 Playwright UI 调试真实浏览器测试。
- `pnpm build`：先构建 npm 包，再构建 playground。
- `pnpm compat:check`：使用最低 peer dependency 组合验证构建后的包入口。
- `pnpm pack:check`：检查 npm tarball 内容、声明文件和 ESM/CommonJS 导出。
- `pnpm release:meta-check`：检查包版本、Changelog 和 Git 版本 Tag 是否一致。
- `pnpm release:check`：执行发布元数据、Lint、覆盖率测试、类型检查、构建、文档和 npm 打包预检。
- `pnpm --filter @itagan/form-table build`：只构建可发布 npm 包。

## npm 包使用

安装、兼容范围和最小示例统一见[组件包说明](./packages/form-table/README.md)与[快速开始](./docs/guide/quick-start.md)；属性和行为以 [API 总览](./docs/api/configuration.md)为准。

## AI 开发辅助

面向业务项目的 [FormTable Skill](./skills/form-table/SKILL.md) 以本仓库为维护来源，帮助 Agent 按真实 API 选择字段配置、渲染方式和数据更新入口。它独立于 npm 包分发；使用方式见[组件包说明](./packages/form-table/README.md#ai-开发辅助)。

## 调试页面

完整路由和用途统一维护在[示例索引](./docs/examples/index.md)。本地运行 `pnpm site:dev` 可同时启动 Playground 和 VitePress 文档站。

`playground` 日常开发通过 workspace alias 直接引用 `packages/form-table/src/index.ts`，无需先构建组件包；E2E 构建则显式引用 `dist` 的 ESM 与 CSS，验证发布产物接入。

文档和示例保留独立源码目录，避免 Vue 2.7 与 VitePress 的 Vue 3 依赖混用；发布时由 `pnpm site:build` 合并为 `docs/.vitepress/dist`，只需部署一个静态目录和一个域名。

## 文档

- [VitePress 文档总站](./docs/index.md)
- [开发任务导航](./docs/guide/development-workflows.md)
- [API 总览](./docs/api/configuration.md)
- [更新记录](./CHANGELOG.md)
- [维护与发布](./docs/migration/npm-package.md)

## 发布前检查

```bash
pnpm release:check
```
