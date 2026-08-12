# 示例索引

本地开发推荐在项目根目录用一条命令同时启动调试台和文档站：

```bash
pnpm site:dev
```

命令会同时启动以下两个固定端口的站点：

- Playground 调试台：主机 `localhost`，端口 `5173`
- VitePress 文档总站：主机 `localhost`，端口 `5174`

需要单独调试某个站点时，也可以分别启动：

```bash
pnpm dev
pnpm docs:dev
```

源码层仍保留两个应用，以隔离 Playground 的 Vue 2.7 和 VitePress 的 Vue 3 运行时；生产构建会合并为一个站点：

```bash
pnpm site:build
pnpm site:preview
```

统一产物位于 `docs/.vitepress/dist`：文档使用 `/`，以下所有 Demo 使用 `/playground/`。部署时只需发布这个目录，不需要分别启动两个服务。

文档顶部的 **Playground** 可进入调试台；调试台右上角的 **← 返回文档总站** 可返回当前文档站。然后通过以下入口打开调试台或具体的可运行 Demo：

| Demo 页面 | 本地路由 | 内容 |
| --- | --- | --- |
| [表格内表单组件调试台 ↗](http://localhost:5173/) | `/` | 调试台首页，集中提供全部可运行 Demo、API 速查和文档总站入口 |
| [基础编辑 ↗](http://localhost:5173/form-table) | `/form-table` | 基础 children、type、校验与父级行操作 |
| [Hint 多场景 ↗](http://localhost:5173/hint-scenarios) | `/hint-scenarios` | title、单实例 Tooltip、动态 Hint、Slot、自定义组件与接管边界 |
| [高级示例 ↗](http://localhost:5173/form-table-advanced) | `/form-table-advanced` | 原生选择/序号列、多行栅格、component.renderer、slot、动态 options、嵌套路径 |
| [`cellSlot` 列级单元格 ↗](http://localhost:5173/cell-slot) | `/cell-slot` | 组合展示、派生值、updateRow、异步 rowKey、字段 Slot 对照和 scope 检视 |
| [远程 Schema ↗](http://localhost:5173/remote-schema) | `/remote-schema` | 远程纯 JSON 配置与页面本地组件、事件增强 |
| [企业复杂组件接入 ↗](http://localhost:5173/enterprise-components) | `/enterprise-components` | 企业全局组件、局部业务组件、自定义绑定协议与复杂事件联动 |
| [动态插槽 ↗](http://localhost:5173/dynamic-slot-test) | `/dynamic-slot-test` | 动态显隐和 slot 更新助手 |
| [行列操作与异步提交 ↗](http://localhost:5173/row-column-operations) | `/row-column-operations` | 行增删复制移动、动态列和业务处理后异步提交 |
| [单元格合并 ↗](http://localhost:5173/cell-merge) | `/cell-merge` | 分组纵向合并、汇总行横向合并、稳定列定位和表头隐藏 |
| [多需求费用明细 ↗](http://localhost:5173/heterogeneous-demands) | `/heterogeneous-demands` | 公共表头下按需求类型加载独立组件、处理差异字段并归一化提交 |
| [多日议程编排 ↗](http://localhost:5173/itinerary-simple) | `/itinerary-simple` | 日期与主题纵向合并、SortableJS 组内拖拽、行操作与分组提交 |
| [组件调试 ↗](http://localhost:5173/debug) | `/debug` | 自定义组件事件和原生 Ref |
| [FormTable 精简 API ↗](http://localhost:5173/form-table-docs) | `/form-table-docs` | 精简 API 速查 |
| [大数据量性能实验 ↗](http://localhost:5173/performance) | `/performance` | 可调行列规模、三类渲染场景、更新耗时、DOM 和动态回调计数 |

Playground 直接引用包源码，修改组件后无需先构建 npm 包。示例名称、路由和页面入口统一维护在 `playground/examples.json`；Vue Router、调试台首页和生产静态直达页都读取这份清单。

操作列、末尾新增、当前行后插入、复制和删除的入门代码参考[常见操作列与行增删](../features/common-row-actions.md)；确认、移动和异步提交等进阶模式参考[行列操作与异步提交](../features/row-column-operations.md)。

公司内部存在大量全局组件、局部业务组件和非标准绑定协议时，参考[企业内部复杂组件接入示例](./enterprise-components.md)。

需要处理纵向分组、横向汇总、共享字段同步和提交归一化时，参考[单元格合并业务处理示例](./cell-merge.md)。

需要把不同字段、不同业务组件的旧 DOM 表格迁移到 Vue 时，参考[多需求费用明细场景](./heterogeneous-demands.md)。

需要一个容易复制的“分组字段 + 明细行”入门实现时，参考[多日议程编排](./itinerary-simple.md)。
