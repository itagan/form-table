# 样式加载与覆盖契约

FormTable 的 JavaScript 和样式保持独立。应用需要在入口显式加载 Element UI 主题与 FormTable 布局样式：

```ts
import 'element-ui/lib/theme-chalk/index.css'
import '@itagan/form-table/style.css'
import './form-table-overrides.css'
```

整个应用只需引入一次。顺序固定为 Element UI → FormTable → 业务覆盖，避免依赖打包工具隐式调整 CSS 副作用。

## 当前包含的样式

`style.css` 只修正 FormTable 自身布局，不包含 Element UI 主题、颜色、字体或全局 reset：

| 稳定类名 | 当前规则 | 作用 |
| --- | --- | --- |
| `.form-table-field-layout` | `flex-wrap: wrap` | 同一单元格存在多个字段时允许 Element Row 换行 |
| `.form-table-container .form-table-form-item` | `margin-bottom: 0` | 去除 Element FormItem 默认底部间距，避免表格行被额外撑高；两级稳定类用于覆盖 Element UI 的尺寸规则 |

这两个类名直接标记对应组件节点，不使用 Vue scoped 生成的 `data-v-*` 选择器，也不会匹配 FormTable 之外的普通 `.el-form-item`。

## 覆盖方式

全局覆盖样式放在 FormTable 样式之后：

```css
.form-table-field-layout {
  flex-wrap: nowrap;
}

.form-table-container .form-table-form-item {
  margin-bottom: 8px;
}
```

单个列或字段优先通过现有配置覆盖，内联 style 的优先级高于默认类规则：

```ts
{
  rowProps: {
    class: 'compact-field-layout',
    style: { flexWrap: 'nowrap' }
  },
  formItems: [{
    fieldKey: 'name',
    type: 'input',
    formItemProps: {
      class: 'compact-form-item',
      style: { marginBottom: '8px' }
    }
  }]
}
```

调用方的 class 会与 FormTable 稳定类名合并，不会替换内部标记。

## 构建与运行时边界

- 独立源码 CSS 由库构建提取为 `dist/style.css`，并通过 `@itagan/form-table/style.css` 导出。
- ESM、CommonJS/UMD 入口都不隐式引用 CSS，也不在运行时插入 `<style>`；Node 和 SSR 可以继续直接加载 JavaScript 入口。
- UMD 或 CDN 场景使用单独的 `<link>` 加载 `style.css`；SSR 页面也由客户端样式入口或服务端模板负责加载。
- 嵌套 FormTable 的每个字段布局和 FormItem 都携带自己的稳定类名；后代选择器仍要求目标节点具有 `.form-table-form-item`，不会命中容器内未注册的普通 FormItem。

## 后续样式归属

后续新增样式仍集中在组件包的独立 CSS 源码，并遵循以下边界：

- 只使用 `form-table-` 命名空间，不修改无命名空间的 Element UI 或原生元素。
- 组件结构和状态样式可以进入包内；业务主题、品牌颜色、页面间距和全局 reset 留给应用。
- 优先使用稳定类名和低特异性规则；只有必须覆盖 Element UI 结构规则时才增加选择器层级，并补充覆盖示例。
- Tooltip 等传送到根容器之外的节点使用已有专属类名，不依赖 `.form-table-container` 后代关系。

这一边界让样式文件可以随组件能力增长，同时保留加载顺序、SSR 行为和业务覆盖的可预测性。

## 迁移验证对比

独立 CSS 方案保持规则值不变，只替换选择器来源和覆盖契约：

| 对比项 | `1.2.0` scoped 产物 | 独立 CSS 方案 |
| --- | --- | --- |
| 字段布局 | `.form-table-container[data-v-*] .form-table-field-layout` | `.form-table-field-layout` |
| FormItem 间距 | `.form-table-container[data-v-*] .el-table__cell .el-form-item` | `.form-table-container .form-table-form-item` |
| 选择器特异性 | 分别为 `(0,3,0)`、`(0,4,0)` | 分别为 `(0,1,0)`、`(0,2,0)` |
| 压缩后 CSS | 约 `0.16 KiB` | 约 `0.10 KiB` |
| JS 入口 CSS 依赖 | 无 | 无 |

在推荐加载顺序下视觉结果等价。FormItem 使用两个稳定类，是因为 Element UI 的 small/mini 间距规则本身具有两级类特异性；若仅使用一个类，即使加载顺序正确也无法覆盖该规则。整体特异性仍低于原 scoped 产物，业务样式在 FormTable CSS 之后使用相同选择器即可覆盖，因此加载顺序属于公开使用约定。
