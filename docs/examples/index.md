# 示例索引

运行 `pnpm dev` 后访问：

| 路由 | 内容 |
| --- | --- |
| `/form-table` | 基础 children、type、校验与父级行操作 |
| `/form-table-advanced` | 多行栅格、component.renderer、slot、动态 options、嵌套路径 |
| `/remote-schema` | 远程纯 JSON 配置与页面本地组件、事件增强 |
| `/enterprise-components` | 企业全局组件、局部业务组件、自定义绑定协议与复杂事件联动 |
| `/dynamic-slot-test` | 动态显隐和 slot 更新助手 |
| `/row-column-operations` | 行增删复制移动、动态列和业务处理后延迟提交 |
| `/cell-merge` | 分组纵向合并、汇总行横向合并、稳定列定位和表头隐藏 |
| `/debug` | 自定义组件事件和原生 Ref |
| `/form-table-docs` | 精简 API 速查 |

Playground 直接引用包源码，修改组件后无需先构建 npm 包。

常见行列操作和延迟提交的完整代码模式参考[行、列与延迟提交](../guide/row-column-operations.md)。

公司内部存在大量全局组件、局部业务组件和非标准绑定协议时，参考[企业内部复杂组件接入示例](./enterprise-components.md)。

需要处理纵向分组、横向汇总、共享字段同步和提交归一化时，参考[单元格合并业务处理示例](./cell-merge.md)。
