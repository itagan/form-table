# npm 包迁移与发布准备

仓库已经调整为 pnpm workspace：

```text
packages/form-table   # npm 包源码和构建配置
playground            # 本地调试应用
docs                  # 文档站准备目录
```

## 发布前检查

```bash
pnpm release:check
```

这条命令会依次执行：

- `pnpm test`
- `pnpm type-check`
- `pnpm build`
- `cd packages/form-table && npm pack --dry-run`

## 发布包内容

`packages/form-table/package.json` 通过 `files` 字段控制发布内容，目前只包含：

- `dist`
- `README.md`

实际打包内容以 `npm pack --dry-run` 输出为准。

## 首次发布步骤

1. 确认 npm 包名和版本：

```bash
node -p "require('./packages/form-table/package.json').name"
node -p "require('./packages/form-table/package.json').version"
```

2. 执行完整预检：

```bash
pnpm release:check
```

3. 登录 npm：

```bash
npm login
```

4. 发布作用域包：

```bash
cd packages/form-table
npm publish --access public
```

`packages/form-table/package.json` 已配置 `publishConfig.access = "public"`，命令中仍显式带上 `--access public`，避免首次发布 scoped package 时误发布失败。

## 后续版本流程

1. 在 `CHANGELOG.md` 的 `Unreleased` 记录变更。
2. 更新 `packages/form-table/package.json` 的 `version`。
3. 执行 `pnpm release:check`。
4. 将 `Unreleased` 内容整理到对应版本号和日期。
5. 合并到 `master` 后再执行 `npm publish --access public`。
