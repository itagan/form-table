---
name: release
description: 为 FormTable 准备、发布和验证新版本。用户要求发布、发版、推送一版、升级版本或同步 GitHub/Gitee/npm 时使用。
---

完成一次可验证的双平台版本发布，不要把 Git Tag 、平台“发行版”和 npm 包混为同一个状态。

1. 检查 `git status`、`git diff`、当前分支、`origin`、`gitee` 和已有 Tag，保留用户变更。读取 npm 官方 Registry 的已发布版本，避免版本冲突。
2. 根据改动选择语义化版本，同步 `packages/form-table/package.json` 与 `CHANGELOG.md`。将变更按职责拆成清晰提交；如从任务分支发布，按仓库规则合并到 `master`。
3. 创建 `v<version>` Tag 前运行 `pnpm release:check`；检查失败时不得发布。
4. 将 `master` 和当前版本 Tag 同步到 GitHub `origin` 与 Gitee `gitee`。若 Gitee 落后多个版本，同步所有缺失 Tag，不覆盖已有的独立历史。
5. 显式使用 `https://registry.npmjs.org` 发布 `@itagan/form-table`，不向 npm 镜像源发布。
6. 在 Gitee 为每个缺失版本创建对应“发行版”，Tag 指向同版本 Git Tag，内容来自该版本 Changelog。补发多个版本时按版本顺序创建，使最新版成为 Gitee 最新发行版。
7. 发布后分别验证：GitHub/Gitee 的 `master` 与 Tag 指向预期提交，npm `latest` 与完整性信息正确，Gitee 最新发行版标签正确，GitHub Release Check 成功，本地工作区干净。

发布前检查各平台现有状态，避免重复 npm 发布或重复创建发行版。如果需要用户登录、OTP、验证码或平台解除访问限制，保留已完成状态并请用户接管；未验证的平台不得报告为已完成。
