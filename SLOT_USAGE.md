# FormTable Slot 说明

当前插槽用法统一维护在：

- [CURRENT_FORMTABLE_DOC.md](./CURRENT_FORMTABLE_DOC.md)

重点看这两个部分：

- `slot` 用法
- 插槽参数 `row / index`

推荐直接参考示例：

- `src/views/FormTableAdvancedView.vue`
- `src/views/DynamicSlotTestView.vue`

当前实现约定很简单：

1. 在列配置里写 `type: 'slot'`
2. 同时提供 `slotName`
3. 在父组件中用同名具名插槽实现内容

插槽参数：

- `row`
- `index`
