---
name: release
description: 为 FormTable 推送代码、部署文档站，或在满足条件时准备并验证 npm 新版本。用户要求推送、部署、发布、发版、升级版本或同步 GitHub/Gitee/npm 时使用。
---

先根据变更范围和用户授权选择模式，不要把代码推送、站点部署、Git Tag、平台“发行版”和 npm 包混为同一个状态。

## 代码与文档站部署

仅修改文档、Playground、示例、测试或仓库工程配置，或者用户只要求“推送”“部署”时：

1. 不升级 `packages/form-table/package.json` 版本，不创建版本 Tag 或平台发行版，不发布 npm。
2. 文档与示例变更可记录在 `CHANGELOG.md` 的 `Unreleased`，但不得据此生成新版本。
3. 运行与改动相称的检查；部署前至少确保文档、Playground 与站点构建检查通过。
4. 将最终 `master` 同步到 GitHub `origin` 与 Gitee `gitee`，由 GitHub Pages 工作流部署站点。
5. 验证两个远端 `master`、GitHub Pages 部署和线上页面；本地工作区保持干净。

## npm 版本发布

只有同时满足以下条件时才进入完整 npm 版本发布：

- 发布包的组件源码、公开 API、样式或构建产物确有需要交付给 npm 用户的变化；
- 用户明确要求发布 npm、新版本或执行完整发版。

仅有文档或 Playground 示例调整时，即使用户说“推送并部署”，也不得推断为 npm 发布授权。发布包源码发生变化但用户只要求推送或部署时，同样不自动升级版本或发布 npm，应先完成代码与站点部署；是否发 npm 由用户另行明确。

进入 npm 版本发布后，完成一次可验证的双平台版本发布：

1. 检查 `git status`、`git diff`、当前分支、`origin`、`gitee` 和已有 Tag，保留用户变更。读取 npm 官方 Registry 的已发布版本，避免版本冲突。
2. 根据改动选择语义化版本，同步 `packages/form-table/package.json` 与 `CHANGELOG.md`。将变更按职责拆成清晰提交；如从任务分支发布，按仓库规则合并到 `master`。
3. 创建 `v<version>` Tag 前运行 `pnpm release:check`；检查失败时不得发布。
4. 将 `master` 和当前版本 Tag 同步到 GitHub `origin` 与 Gitee `gitee`。若 Gitee 落后多个版本，同步所有缺失 Tag，不覆盖已有的独立历史。
5. 显式使用 `https://registry.npmjs.org` 发布 `@itagan/form-table`，不向 npm 镜像源发布。
6. 在 Gitee 为每个缺失版本创建对应“发行版”，Tag 指向同版本 Git Tag，内容来自该版本 Changelog。补发多个版本时按版本顺序创建，使最新版成为 Gitee 最新发行版。
7. 发布后分别验证：GitHub/Gitee 的 `master` 与 Tag 指向预期提交，npm `latest` 与完整性信息正确，Gitee 最新发行版标签正确，GitHub Release Check 成功，本地工作区干净。

发布前检查各平台现有状态，避免重复 npm 发布或重复创建发行版。如果需要用户登录、OTP、验证码或平台解除访问限制，保留已完成状态并请用户接管；未验证的平台不得报告为已完成。
