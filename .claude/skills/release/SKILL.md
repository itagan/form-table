---
name: release
description: 提交当前变更并合并到主分支
disable-model-invocation: true
---

请帮我完成一次版本发布流程：

1. 查看当前所有未提交的变更（git status、git diff）
2. 根据变更的实际内容，合理拆分为多个 commit 分别提交（如有必要）
3. 将当前分支合并到主分支（master）

注意事项：
- commit message 要清晰描述变更内容
- 合并前确保所有变更已提交
- 如果当前已在主分支上，直接提交即可，无需合并
