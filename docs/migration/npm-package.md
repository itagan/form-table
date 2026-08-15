# npm 包发布与维护

仓库采用“组件包 + playground + 独立 docs”的单体仓库结构：

```text
packages/form-table   # npm 包源码和构建配置
playground            # Vue 2.7 本地调试应用
docs                  # Vue 3 / VitePress 文档站，独立 pnpm lockfile
```

根 workspace 保持 Vue2 依赖边界；`docs` 使用 VitePress/Vue3，并通过 `--ignore-workspace` 独立安装，避免污染组件包测试和构建。

两个应用只在源码和开发运行时分开。`pnpm site:build` 会把它们合并到 `docs/.vitepress/dist`：文档位于 `/`，Playground 位于 `/playground/`，部署时只发布一个静态目录。

## 首次克隆

```bash
pnpm install
pnpm docs:install
pnpm release:check
```

`pnpm install` 安装根 workspace、组件包和 playground 依赖；`pnpm docs:install` 根据 `docs/pnpm-lock.yaml` 安装文档站依赖。

## 发布前检查

```bash
pnpm release:check
```

这条命令会依次执行：

- `pnpm lint`
- `pnpm test:coverage`
- `pnpm type-check`
- `pnpm build`
- `pnpm compat:check`
- `pnpm docs:check`
- `pnpm site:build`
- `pnpm site:check`
- `pnpm pack:check`

其中 `compat:check` 使用 Vue 2.7.1 + Element UI 2.4.9 从构建后的包入口完成类型和运行时验证；`pack:check` 会断言 tarball 文件清单、公开声明和 ESM/CommonJS 导出。`site:build` 会先执行 `docs:install`，再生成文档、Playground 和各示例路由的静态直达入口；`site:check` 会检查统一基址、全部示例路由和生产产物中的 localhost 残留。

## 文档站部署

```bash
pnpm site:build
pnpm site:check
pnpm site:preview
```

部署目标固定为 `docs/.vitepress/dist`。静态服务器需要正常支持目录索引；构建会为每个 Playground 路由生成对应的 `index.html`，直接访问 `/playground/form-table` 等地址不依赖特定部署平台的 rewrite 配置。

## 发布包内容

`packages/form-table/package.json` 通过 `files` 字段控制发布内容，目前只包含：

- `dist`
- `LICENSE`
- `README.md`

实际打包内容由 `pnpm pack:check` 读取 `npm pack --dry-run --json` 后自动断言。

当前期望 tarball 至少包含：

- `dist/formtable.es.js`
- `dist/formtable.umd.cjs`
- `dist/style.css`
- `dist/types/public-types.d.ts`
- `LICENSE`
- `README.md`
- `package.json`

不应包含：

- `src`
- `playground`
- `docs`
- `__tests__`
- `vite.config.ts`

## 发布 Checklist

1. 确认 npm 包名、版本和发布 registry：

```bash
node -p "require('./packages/form-table/package.json').name"
node -p "require('./packages/form-table/package.json').version"
npm config get registry
```

2. 执行完整预检：

```bash
pnpm release:check
```

3. 确认发布包清单和入口：

```bash
pnpm pack:check
```

4. 登录 npm：

```bash
npm login
```

5. 发布作用域包：

```bash
cd packages/form-table
npm publish --access public
```

`packages/form-table/package.json` 已配置 `publishConfig.access = "public"`，命令中仍显式带上 `--access public`，避免首次发布 scoped package 时误发布失败。

## 常见发布失败

| 现象 | 处理方式 |
| --- | --- |
| `403 Forbidden` | 确认 npm 账号有该 scope 权限，首次 scoped public 包发布时带 `--access public` |
| `You cannot publish over the previously published versions` | 提升 `packages/form-table/package.json` 的 `version` |
| tarball 缺少 `dist` | 先执行 `pnpm build`，或确认 `prepack` 是否正常触发 |
| 文档构建找不到 VitePress | 执行 `pnpm docs:install` |
| Vue 版本冲突 | 确认根 workspace 使用 Vue2，docs 使用 `--ignore-workspace` 独立运行 |

## 发布边界

本仓库只有 `packages/form-table` 会发布到 npm。`playground` 和 `docs` 都是仓库内开发资产，不进入 npm 包。

发布前修改包入口时，需要同步检查：

- `main`
- `module`
- `types`
- `exports`
- `files`
- `sideEffects`
