# GitHub Pages 部署

仓库使用 GitHub Actions 将 VitePress 文档和 Vue 2 Playground 合并部署到：

- 文档：`https://itagan.github.io/form-table/`
- Playground：`https://itagan.github.io/form-table/playground/`

## 部署流程

`.github/workflows/deploy-pages.yml` 在 `master` 更新时自动执行：

1. 使用锁文件安装 workspace 与文档依赖。
2. 执行 `pnpm site:build:github`，按 `/form-table/` 子路径构建统一站点。
3. 执行 `pnpm site:check:github`，检查文档、资源、Playground 及全部示例直达路由。
4. 将 `docs/.vitepress/dist` 上传为 GitHub Pages artifact。
5. 通过 `github-pages` environment 发布站点。

也可以在 GitHub 仓库的 **Actions → Deploy GitHub Pages → Run workflow** 手动重新部署。

## 首次启用

仓库管理员需要在 GitHub 打开 **Settings → Pages**，将 **Build and deployment → Source** 设置为 **GitHub Actions**。完成后，推送到 `master` 或手动运行 workflow 即可发布。

## 本地验证

```bash
pnpm install --frozen-lockfile
pnpm site:build:github
pnpm site:check:github
```

构建产物位于 `docs/.vitepress/dist`。普通的 `pnpm site:build` 仍使用根路径 `/`，供本地预览或未来部署到独立域名。

## 路径约定

GitHub 项目站点位于仓库子路径 `/form-table/`，因此文档资源使用 `/form-table/assets/`，Playground 资源使用 `/form-table/playground/assets/`。构建时通过 `VITE_SITE_BASE` 同时传递给 VitePress、Vite 和站点检查脚本，避免三处路径配置漂移。

如果以后绑定独立域名，应将部署构建切回根路径，并同步更新本文中的公开地址。
