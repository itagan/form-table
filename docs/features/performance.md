# 性能与大数据量

> 可运行实验：[打开 Performance Lab ↗](http://localhost:5173/performance)

本页只负责如何测量、记录和解释性能数据，以及说明当前复杂度边界。已经确认瓶颈、需要选择业务优化措施时，直接参阅[性能优化建议](./performance-optimization.md)。

FormTable 基于 Element UI Table 和 Form，不包含虚拟滚动。数据规模应按实际渲染单元估算，而不只看行数：

```text
渲染规模 ≈ 行数 × 每行 FormItem 数 × 字段组件复杂度
```

1000 行 `cellSlot` 文本与 1000 行 Input、Select、校验规则不是同一种负载。Performance Lab 用可调场景显示这类差异，不承诺所有机器上的固定毫秒数。

## 实验场景

| 场景 | 渲染路径 | 主要观察目标 |
| --- | --- | --- |
| `cellSlot` 纯展示 | `el-table-column → scoped Slot` | Element Table 行和文本 DOM 的基础成本 |
| 内置 Input 编辑 | 单 Flex Row → Item → `el-input` | `el-form-item`、输入组件和受控回写成本 |
| 动态配置编辑 | 编辑路径 + 动态回调 | `visible/props/formItemProps/component.props` 求值次数 |

页面可选择 50、100、300、500、1000 行，以及 2、4、6 个数据列。编辑场景额外提供一个 `cellSlot` 操作列，用于测量真实 `updateRow` 通道。

## 指标定义

| 指标 | 开始 | 结束 |
| --- | --- | --- |
| 首次渲染 | 替换 `rows/columns` 前 | `nextTick + requestAnimationFrame` 后 |
| 单字段输入 | 向首个真实 input 派发事件前 | 受控回写和浏览器绘制后 |
| `updateRow` | 首行多字段 patch 前 | 新数组回写和绘制后 |
| 新增 / 删除 | 父组件替换数组前 | 表格绘制后 |
| 末列显隐 | 修改 visible 依赖前 | Element Table 列更新后 |
| DOM 节点 | — | 当前 FormTable 实验容器全部后代节点 |
| Vue 实例 | — | 当前 FormTable 及其 Element UI 子树中的有状态组件实例 |

动态场景还累计 Column、Row、Item、Component 四层回调次数。计数用于发现一次局部编辑是否让大量无关动态配置重新求值。

## 使用方式

本地开发可以快速观察行为：

```bash
pnpm dev
```

需要记录可比较的性能基线时，应使用 production build：

```bash
pnpm build:playground
pnpm preview
```

然后在浏览器打开 `http://localhost:4173/performance`。

建议采用以下流程：

1. 记录浏览器版本、设备 CPU、内存和构建提交。
2. 关闭 DevTools 截图、Vue Devtools 等额外采样工具。
3. 每个场景先预热一次，再至少执行 5 次。
4. 记录中位数和最慢一次，不用单次结果下结论。
5. 只比较相同环境、相同场景和相同数据规模。
6. 出现明显退化时再使用浏览器 Performance/Memory 面板定位原因。

## 结果记录模板

| 提交 | 浏览器 / 设备 | 场景 | 行 × 列 | 首次渲染 | 单字段 | updateRow | DOM 节点 | Vue 实例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `commit` | Chrome / device | Input 编辑 | 300 × 4 | — | — | — | — | — |

Performance Lab 展示的是当前浏览器单次测量。仓库不会把某个开发者机器上的绝对毫秒数写成组件容量承诺。

## 自动化回归策略

Vitest + jsdom 不适合断言真实浏览器耗时，因此单元测试不使用类似下面的固定阈值：

```ts
expect(renderTime).toBeLessThan(100)
```

当前自动化测试使用 300 行真实字段组件验证大数组编辑的关键不变量：

- 只生成一个新的 `tableData` 数组。
- 只替换目标行对象。
- 相邻无关行继续保持原对象引用。
- 原始数组与目标行不被直接修改。

字段渲染结构测试还约束实际字段组件经 `el-form-item` 直接回到 `FormTableItem`，中间不再创建有状态适配器实例。这个断言比 jsdom 耗时稳定，可以防止后续重构无意恢复“每字段一个包装实例”。

动态上下文另有 300 行结构回归测试。单字段编辑后：

| 动态回调依赖 | 优化前新增调用 | 当前允许新增调用 |
| --- | ---: | ---: |
| 只读取当前 `row` | 300 | 1 |
| 显式读取 `tableData` | 300 | 300 |

上下文属性使用可枚举惰性 getter：只有回调实际读取 `tableData` 时才建立整表依赖。该测试约束回调影响范围，不把 jsdom 耗时作为浏览器性能结论。

后续若加入浏览器 CI，可在固定 runner 上执行多轮 production benchmark，以中位数相对基线退化比例报警；初期建议只生成报告，不立即设置严格阻断阈值。

## 当前复杂度边界

### DOM 与组件实例

编辑字段通常包含：

```text
FormTableRow → el-row → el-col → FormTableItem → el-form-item
                                      └→ FieldRenderer（函数式）→ 实际字段组件
```

`FieldRenderer` 负责 text、选项和 model 协议，但不会创建 Vue 实例。相较于有状态字段包装器，它按“可见字段数”减少适配器实例；不会减少 `FormTableItem`、`el-form-item` 或实际 Element 字段组件，也不会改变 DOM 结构。因此预期收益主要体现在大量编辑字段的挂载、销毁和内存开销，具体耗时仍应通过相同环境下的前后数据判断。

实例缩减量可以直接按当前渲染配置估算：

```text
减少的 Vue 实例 = 当前可见的非 slot FormItem 数
```

例如 100 行 × 4 个编辑字段会减少 400 个适配器实例；300 行 × 4 个字段会减少 1200 个。`slot` 字段原本就不经过该适配器，因此不计入。

固定表格高度只产生滚动区域，不会减少 Element UI 创建的行和组件。Performance Lab 同时展示 DOM 与 Vue 实例数：前者说明页面结构规模，后者更适合观察无 DOM 包装组件的成本。大量编辑字段的主要瓶颈通常首先来自 DOM、组件实例和校验监听，而不是数组路径工具。

### 不可变数据更新

单字段和 `updateRow` 更新会复制顶层 `tableData` 数组并替换目标行：

```text
数组复制：O(行数)
嵌套字段更新：O(字段路径深度)
```

这种方式保证受控数据和引用边界清晰，但高频输入叠加数千行时必须通过真实场景测量。

### 动态配置

`visible/props/options/formItemProps` 应保持同步、纯计算和低成本。不要在动态回调中请求接口、深拷贝整表、排序数据或创建新组件定义。Performance Lab 的回调计数可辅助判断一次操作影响的求值范围。

字段没有显式 Hint 且表级没有默认字段 Hint 时会直接跳过 Hint 内容解析。

## 使用建议

| 数据形态 | 建议 |
| --- | --- |
| 数十到数百行常规编辑 | 使用实验页按真实列数和组件类型验证 |
| 大量只读内容 | 优先 `cellSlot` 或普通展示表格，避免无意义的 FormItem |
| 数百行复杂编辑 | 分页、分组展开或只挂载当前编辑批次 |
| 数千行持续编辑 | 使用支持虚拟化的表格方案，不依赖固定高度替代虚拟滚动 |
| 昂贵动态 options | 在业务层预计算、缓存或按依赖拆分 |
| 大量校验规则 | 提交时分批校验，避免所有复杂 validator 同时运行 |

性能优化应先由实验数据定位瓶颈，再决定缓存、响应依赖拆分或虚拟化方案，避免为了理论上的大数据量增加常规场景复杂度。

可复制的批量更新、按需编辑、动态配置优化和虚拟滚动决策示例见[性能优化建议](./performance-optimization.md)。

## 相关 API

[FormTable Props](../api/form-table.md) · [Component 配置](../api/component.md)
