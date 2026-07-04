# npm 包迁移与发布准备

仓库采用“组件包 + playground + 独立 docs”的单体仓库结构：

```text
packages/form-table   # npm 包源码和构建配置
playground            # 本地调试应用
docs                  # VitePress 文档站，独立 pnpm lockfile
```

根 workspace 保持 Vue2 依赖边界；`docs` 使用 VitePress/Vue3，并通过 `--ignore-workspace` 独立安装，避免污染组件包测试和构建。

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

- `pnpm test`
- `pnpm type-check`
- `pnpm build`
- `pnpm docs:build`
- `cd packages/form-table && npm pack --dry-run`

其中 `docs:build` 会先执行 `docs:install`，确保换机器后也能构建文档。

## 发布包内容

`packages/form-table/package.json` 通过 `files` 字段控制发布内容，目前只包含：

- `dist`
- `README.md`

实际打包内容以 `npm pack --dry-run` 输出为准。

当前期望 tarball 至少包含：

- `dist/formtable.es.js`
- `dist/formtable.umd.cjs`
- `dist/style.css`
- `dist/types/public-types.d.ts`
- `README.md`
- `package.json`

不应包含：

- `src`
- `playground`
- `docs`
- `__tests__`
- `vite.config.ts`

## 首次发布 Checklist

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

3. 确认 dry-run 输出：

```bash
cd packages/form-table
npm pack --dry-run
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

## 后续版本流程

1. 在变更说明中记录本次修改。
2. 更新 `packages/form-table/package.json` 的 `version`。
3. 执行 `pnpm release:check`。
4. 合并到 `master` 并推送远端。
5. 在 `packages/form-table` 执行 `npm publish --access public`。
6. 发布后用安装命令验证：

```bash
pnpm add @itagan/form-table
```

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
