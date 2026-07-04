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
