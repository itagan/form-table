# FormTable Docs

这个目录用于承载后续文档站内容。当前先保持 Markdown 结构，不引入 VitePress 依赖。

## 导航

- [快速开始](./guide/quick-start.md)
- [API 类型边界](./api/types.md)
- [示例索引](./examples/README.md)
- [迁移与发布准备](./migration/npm-package.md)

## 现有资料

- 完整能力文档：`../CURRENT_FORMTABLE_DOC.md`
- npm 包说明：`../packages/form-table/README.md`
- 调试示例：`../playground/src/views`

## 发布前检查

```bash
pnpm release:check
```

后续接入 VitePress 时，可以把当前目录作为文档根目录，并逐步把 `CURRENT_FORMTABLE_DOC.md` 中的长文拆到 `guide`、`api` 和 `examples` 下。
