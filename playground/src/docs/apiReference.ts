export interface ApiEntry {
  path: string
  type: string
  defaultValue: string
  target: string
  description: string
  context?: string
}

export interface ApiGroup {
  id: string
  title: string
  description: string
  entries: ApiEntry[]
}

export const apiGroups: ApiGroup[] = [
  {
    id: 'form-table',
    title: 'FormTable',
    description: '组件入口、受控数据和 Element UI 根级透传。',
    entries: [
      { path: 'tableData', type: 'TableRow[]', defaultValue: '必填', target: '根 v-model / el-table.data', description: 'v-model 对应 prop，通过 update:tableData 回写。' },
      { path: 'columns', type: 'ColumnConfig[]', defaultValue: '必填', target: '布局与渲染配置', description: 'Column → Item 配置树。' },
      { path: 'rowKey', type: 'string | ((row) => unknown)', defaultValue: '—', target: 'FormTable / el-table', description: '稳定行身份；异步更新期间用于重新定位原行。' },
      { path: 'formProps', type: 'Record<string, unknown>', defaultValue: '{}', target: 'el-form', description: '透传 Element Form 属性。' },
      { path: 'tableProps', type: 'Record<string, unknown>', defaultValue: '{}', target: 'el-table', description: '透传 Element Table 属性，不包含 rowKey。' },
      { path: 'hintOptions', type: 'FormTableHintOptions', defaultValue: "{ mode: 'title', targets: 'field' }", target: '字段 / 表头 Hint', description: '整表选择关闭、原生 title 或单实例 Tooltip。' },
      { path: 'hintOptions.targets', type: "'field' | 'header' | 'all'", defaultValue: "'field'", target: 'Hint 作用范围', description: '排除的目标不会求值或生成标记。' },
      { path: 'hintOptions.field', type: 'boolean | FormTableFieldHintFormatter', defaultValue: 'false', target: '未声明或空 hint 的字段', description: 'false/未配置关闭；true 默认字符串化；函数统一格式化。', context: 'FieldContext' },
      { path: 'hintOptions.tooltipProps', type: 'Record<string, unknown>', defaultValue: '{}', target: '共享 el-tooltip', description: "仅 mode: 'tooltip' 生效；整表目标共享同一实例和属性。" },
      { path: 'loading', type: 'boolean', defaultValue: 'false', target: 'el-table v-loading', description: '表格加载状态。' }
    ]
  },
  {
    id: 'column',
    title: 'columns[] · ColumnConfig',
    description: '表格列。展示型整格内容使用 cellSlot，字段表单继续配置 formItems。',
    entries: [
      { path: 'columns[].key', type: 'string', defaultValue: '—', target: '列渲染身份', description: '动态增删、替换列时建议使用稳定唯一值。' },
      { path: 'columns[].label', type: 'string', defaultValue: "''", target: 'el-table-column.label', description: '默认表头文本；解析后的 props.label 可覆盖。' },
      { path: 'columns[].props', type: 'Object | (context) => Object', defaultValue: '{}', target: 'el-table-column', description: '宽度、对齐、fixed、type 等原生列属性；单独使用时为 NativeColumnConfig。', context: 'ColumnContext' },
      { path: 'columns[].headerProps', type: 'Object | (context) => Object', defaultValue: '{}', target: '默认/Slot 表头包装节点', description: 'title、class、style、aria-*；renderHeader 接管时不自动应用。', context: 'ColumnContext' },
      { path: 'columns[].headerHint', type: 'FormTableHintValue | (context) => FormTableHintValue', defaultValue: '—', target: '默认/Slot 表头包装节点', description: "动态字符串或 false；仅 targets: 'header'/'all' 时求值。", context: 'ColumnContext' },
      { path: 'columns[].headerSlot', type: 'string', defaultValue: '—', target: '表头 scoped Slot', description: '复杂表头、图标和交互内容。' },
      { path: 'columns[].visible', type: 'boolean | (context) => boolean', defaultValue: 'true', target: '列显隐', description: '控制当前列是否渲染。', context: 'ColumnContext' },
      { path: 'columns[].cellSlot', type: 'string', defaultValue: '—', target: '整格 scoped Slot', description: '直接渲染当前单元格，与 formItems 互斥且不要求 fieldKey。' },
      { path: 'columns[].rowProps', type: 'Object | (context) => Object', defaultValue: "{ type: 'flex' }", target: '唯一 el-row', description: 'gutter、justify、align、class、style 等；显式 type 可覆盖默认值。', context: 'RowContext' },
      { path: 'columns[].formItems', type: 'FormItemConfig[]', defaultValue: '[]', target: '单元格字段布局', description: '每个 Item 对应一个 el-col，按 24 栅格自然换行。' }
    ]
  },
  {
    id: 'row-item',
    title: 'columns[].formItems[] · FormItemConfig',
    description: '单元格内部的栅格布局、字段定位和校验。',
    entries: [
      { path: 'columns[].formItems[].key', type: 'string', defaultValue: '—', target: '字段渲染身份', description: '动态字段或重复 fieldKey 时建议配置。' },
      { path: 'columns[].formItems[].fieldKey', type: 'string', defaultValue: '必填', target: 'row 数据路径', description: '支持 profile.city、items[0].name 等嵌套路径。' },
      { path: 'columns[].formItems[].binding.map', type: 'FieldBindingMapEntry[]', defaultValue: '—', target: '复合字段值', description: '按 fieldPath/valuePath 双向映射对象或数组；fallbackValue 处理组件值路径缺失。' },
      { path: 'columns[].formItems[].meta', type: 'FormTableRecord', defaultValue: '—', target: '字段业务元数据', description: '静态扩展点；通过 itemConfig.meta 读取，不解析或自动透传。' },
      { path: 'columns[].formItems[].type', type: 'BuiltinType | component | slot', defaultValue: '必填', target: '字段渲染策略', description: '内置别名、直接组件或字段 Slot。' },
      { path: 'columns[].formItems[].visible', type: 'boolean | (context) => boolean', defaultValue: 'true', target: '字段显隐', description: '按字段上下文控制渲染。', context: 'ItemContext' },
      { path: 'columns[].formItems[].colProps', type: 'Object | (context) => Object', defaultValue: '{ span: 24 }', target: 'el-col', description: 'span、offset 等栅格属性。', context: 'ItemContext' },
      { path: 'columns[].formItems[].formItemProps', type: 'Object | (context) => Object', defaultValue: '{}', target: 'el-form-item', description: 'label、rules 等；校验 prop 自动生成。', context: 'ItemContext' },
      { path: 'columns[].formItems[].labelSlot', type: 'string', defaultValue: '—', target: 'el-form-item label Slot', description: '引用 FormTable 具名 Slot；未提供对应 Slot 时保留原生 label。', context: 'FormTableFormItemSlotContext' },
      { path: 'columns[].formItems[].errorSlot', type: 'string', defaultValue: '—', target: 'el-form-item error Slot', description: '引用 FormTable 具名 Slot；仅在校验错误展示时挂载。', context: 'FormTableFormItemErrorSlotContext' },
      { path: 'columns[].formItems[].hint', type: 'FormTableHintValue | (context) => FormTableHintValue', defaultValue: '继承 field', target: 'el-form-item / 字段配置', description: '空值继承、false 关闭、非空字符串覆盖。', context: 'ItemContext' },
      { path: 'columns[].formItems[].hintTrigger', type: "'item' | 'content'", defaultValue: "'item'", target: '字段 Hint 触发区域', description: 'content 使用唯一可见内容根节点；无法唯一定位时回退并在开发环境警告。' },
      { path: 'columns[].formItems[].component', type: 'ComponentConfig', defaultValue: '{}', target: '实际字段组件', description: '组件、绑定协议、属性、事件和选项。' }
    ]
  },
  {
    id: 'component',
    title: '…formItems[].component · ComponentConfig',
    description: '以下 … 代表 columns[].formItems[]，页面展示仍保留完整可复制路径。',
    entries: [
      { path: 'columns[].formItems[].component.is', type: 'Component | string', defaultValue: '按 type', target: '字段组件', description: '对应 Vue 动态组件 is；推荐组件对象或全局注册名，原生标签属于低层能力。' },
      { path: 'columns[].formItems[].component.resolveComponent', type: '(context) => Component | string', defaultValue: '—', target: '动态字段组件', description: '同步选择与 is 相同类型的目标，undefined 时回退 is。', context: 'ItemContext' },
      { path: 'columns[].formItems[].component.slot', type: 'string', defaultValue: '—', target: '字段 Slot', description: '仅 slot 模式；引用父 FormTable 的静态具名 Slot。' },
      { path: 'columns[].formItems[].component.model', type: 'false | ModelConfig', defaultValue: '省略', target: '值绑定协议', description: '省略时按 Vue 2 组件 model 选项绑定；也可自定义 prop/event 或关闭自动绑定。' },
      { path: 'columns[].formItems[].component.props', type: 'Object | (context) => Object', defaultValue: '{}', target: '字段组件', description: '按当前字段上下文动态生成组件属性；Input、DatePicker 的具体模式也通过 type Prop 配置。', context: 'ItemContext' },
      { path: 'columns[].formItems[].component.listeners', type: 'Record<string, Function>', defaultValue: '{}', target: '字段组件事件', description: '首参为 ActionContext，之后保持组件原始参数。', context: 'ActionContext + event args' },
      { path: 'columns[].formItems[].component.options', type: 'Option[] | (context) => Option[]', defaultValue: '[]', target: '选项型组件', description: 'select、radio、checkbox 等选项。', context: 'ItemContext' },
      { path: 'columns[].formItems[].component.optionProps', type: 'Object | (context) => Object', defaultValue: '—', target: '选项字段映射', description: '自定义 label、value、disabled、key 字段。', context: 'ItemContext' }
    ]
  }
]

export const contextRows = [
  { location: 'columns[].visible / props / headerProps / headerHint', context: 'ColumnContext', fields: 'tableData, columnConfig' },
  { location: 'columns[].headerSlot', context: 'HeaderSlotContext', fields: 'tableData, columnConfig, columnIndex, label' },
  { location: 'columns[].cellSlot', context: 'FormTableCellSlotContext', fields: 'row, index, columnConfig, updateRow' },
  { location: 'columns[].rowProps', context: 'RowContext', fields: 'ColumnContext + row, index' },
  { location: '…formItems[].visible / colProps / formItemProps / hint', context: 'ItemContext', fields: 'RowContext + fieldKey, value, itemConfig' },
  { location: '…component.props / options / optionProps / resolveComponent', context: 'ItemContext', fields: 'RowContext + fieldKey, value, itemConfig' },
  { location: '…component.listeners[event]', context: 'ActionContext', fields: 'ItemContext + setValue, bindingValue, setBindingValue, updateRow；后接原始事件参数' },
  { location: '…formItems[].labelSlot', context: 'FormTableFormItemSlotContext', fields: 'ActionContext + propPath' },
  { location: '…formItems[].errorSlot', context: 'FormTableFormItemErrorSlotContext', fields: 'ActionContext + propPath, error' },
  { location: 'type: slot 字段 Slot', context: 'FormTableSlotContext', fields: 'ActionContext + propPath, component' }
]

export const renderModes = [
  { mode: '内置 type', config: "type: 'input' / 'select' / …", fieldKey: '需要', validation: '支持', scope: '—', usage: '常规表单字段' },
  { mode: 'component', config: "type: 'component' + component.is", fieldKey: '需要', validation: '支持', scope: 'ItemContext', usage: '自定义字段组件' },
  { mode: '字段 Slot', config: "type: 'slot' + component.slot", fieldKey: '需要', validation: '支持', scope: 'FormTableSlotContext', usage: '字段交互与完全自定义模板' },
  { mode: 'cellSlot', config: 'columns[].cellSlot', fieldKey: '不需要', validation: '不提供', scope: 'FormTableCellSlotContext', usage: '组合展示、状态、派生值、操作列' },
  { mode: 'headerSlot', config: 'columns[].headerSlot', fieldKey: '不需要', validation: '不涉及', scope: 'HeaderSlotContext', usage: '图标、提示和交互表头' }
]

export const eventRows = [
  { name: 'update:tableData', payload: 'TableRow[]', description: '受控数据的新数组，应立即回写。' },
  { name: 'field-change', payload: '{ row, index, fieldKey, value, previousValue }', description: '每个实际字段变化触发一次。' },
  { name: 'form-validate', payload: '(propPath, valid, message)', description: '转发 el-form 的逐字段校验结果，propPath 为完整动态路径。' },
  { name: 'Table 原生事件', payload: '保持 Element UI 原始参数', description: 'sort/filter/header/cell/select/current/row/expand 等常用事件直接透传并提供公开类型。' }
]

export const refRows = [
  { name: 'validate()', result: 'Promise<boolean>', description: '执行完整表单校验。' },
  { name: 'clearValidate()', result: 'void', description: '清除校验状态。' },
  { name: 'getFormRef()', result: 'ElForm | undefined', description: '获取原生 Form Ref。' },
  { name: 'getTableRef()', result: 'ElTable | undefined', description: '获取原生 Table Ref。' }
]

export const featureCards = [
  { title: '性能与大数据量', path: '/performance', description: '可调场景测量渲染、输入、updateRow、动态列和 DOM 规模。', tags: ['performance', 'large data', 'benchmark'] },
  { title: '数据更新与受控回写', path: '/cell-slot', description: '自动 model、setValue、updateRow、字段事件和异步更新。', tags: ['tableData', 'setValue', 'field-change'] },
  { title: '复合字段映射', path: '/composite-binding', description: 'binding.map 对对象、数组和字段 Slot 的多字段原子写回。', tags: ['binding.map', 'bindingValue', 'setBindingValue'] },
  { title: '校验、清理与重置', path: '/form-table', description: '字段 rules、整表校验、清理状态和受控数据重置。', tags: ['rules', 'validate', 'clearValidate'] },
  { title: '动态显隐与配置', path: '/dynamic-slot-test', description: 'Column、Row、Item visible 与动态组件属性。', tags: ['visible', 'dynamic props'] },
  { title: '稳定身份与异步安全', path: '/row-column-operations', description: 'rowKey 与 Column、Row、Item key 的不同职责。', tags: ['rowKey', 'key', 'async'] },
  { title: 'Hint 提示体系', path: '/hint-scenarios', description: '作用范围、字段覆盖、关闭、原生 title 与按需单实例 Tooltip。', tags: ['hint', 'headerHint', 'hintOptions', 'tooltip'] },
  { title: '自定义表头', path: '/hint-scenarios', description: '表头文本、图标与 FormTable 自动 Hint 包装。', tags: ['headerSlot', 'headerHint'] },
  { title: 'cellSlot 列级单元格', path: '/cell-slot', description: '组合展示、状态、派生值、操作列，以及与字段 Slot 的边界。', tags: ['cellSlot', 'updateRow', 'rowKey'] },
  { title: '企业复杂组件接入', path: '/enterprise-components', description: '自定义 model、动态组件和复杂事件联动。', tags: ['component', 'model', 'listeners'] },
  { title: '行列操作', path: '/row-column-operations', description: '动态列、行增删复制移动和延迟提交。', tags: ['columns', 'controlled data'] },
  { title: '单元格合并', path: '/cell-merge', description: 'spanMethod、稳定列定位和汇总行。', tags: ['spanMethod', 'rowspan'] },
  { title: '远程 Schema', path: '/remote-schema', description: '远程 JSON 与页面本地组件、事件增强。', tags: ['JSON', 'local enhance'] }
]
