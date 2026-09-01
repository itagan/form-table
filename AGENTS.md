# Repository Development Workflow

对本仓库执行功能开发或缺陷修复时，默认遵循以下流程，无需用户重复说明：

1. 修改前检查 `git status`、`git diff` 和当前分支，保留所有用户已有变更。
2. 从本地 `master` 创建独立任务分支：功能分支使用 `codex/feature-<name>`，修复分支使用 `codex/fix-<name>`。如果已经位于当前任务对应的分支，继续使用该分支。
3. 实现保持任务范围内的最小改动，不混入无关格式化或重构。
4. 完成后检查 diff，运行相关测试，并在合并前运行 `pnpm release:check`。
5. 将变更按职责拆成清晰的原子提交，确保工作区干净后切回 `master`，使用 `git merge --no-ff` 合并。
6. 默认保留本地功能或修复分支，不删除；默认不推送远端。
7. 若存在来源不明的未提交变更、无法安全切换分支或非本任务合并冲突，停止并向用户说明，不擅自 stash、覆盖或删除。

只读分析、代码审查和问题诊断不触发分支、提交或合并。用户明确指定其他分支、提交、合并或推送方式时，以用户指令为准。

用户调用 `$develop` 或要求“开发模式”“标准开发流程”时，读取并执行 `.agents/skills/develop/SKILL.md`。

用户要求“发布”“发版”“推送一版”“升级版本”或同步 GitHub/Gitee/npm 时，读取并执行 `.agents/skills/release/SKILL.md`，不得遗漏 Gitee 代码、Tag 与“发行版”同步。
