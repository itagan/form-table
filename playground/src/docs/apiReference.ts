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
      { path: 'tableData', type: 'TableRow[]', defaultValue: '必填', target: 'el-table.data / el-form.model', description: '受控数据源，通过 update:tableData 回写。' },
      { path: 'columns', type: 'ColumnConfig[]', defaultValue: '必填', target: '布局与渲染配置', description: 'Column → Row → Item 配置树。' },
      { path: 'formProps', type: 'Record<string, unknown>', defaultValue: '{}', target: 'el-form', description: '透传 Element Form 属性。' },
      { path: 'tableProps', type: 'Record<string, unknown>', defaultValue: '{}', target: 'el-table', description: '透传 Element Table 属性；异步更新建议配置 rowKey。' },
      { path: 'loading', type: 'boolean', defaultValue: 'false', target: 'el-table v-loading', description: '表格加载状态。' }
    ]
  },
  {
    id: 'column',
    title: 'columns[] · ColumnConfig',
    description: '表格列。展示型整格内容使用 cellSlot，字段表单继续配置 children。',
    entries: [
      { path: 'columns[].key', type: 'string', defaultValue: '—', target: '列渲染身份', description: '动态增删、替换列时建议使用稳定唯一值。' },
      { path: 'columns[].label', type: 'string', defaultValue: "''", target: 'el-table-column.label', description: '默认表头文本。' },
      { path: 'columns[].props', type: 'Object | (context) => Object', defaultValue: '{}', target: 'el-table-column', description: '宽度、对齐、fixed、type 等原生列属性。', context: 'ColumnContext' },
      { path: 'columns[].headerProps', type: 'Object | (context) => Object', defaultValue: '{}', target: '默认表头文本节点', description: 'title、class、style、aria-*；headerSlot 不自动应用。', context: 'ColumnContext' },
      { path: 'columns[].headerHint', type: 'string | (context) => string', defaultValue: '—', target: '默认表头 title', description: '原生提示文本；空字符串不显示。', context: 'ColumnContext' },
      { path: 'columns[].headerSlot', type: 'string', defaultValue: '—', target: '表头 scoped Slot', description: '复杂表头、图标和交互内容。' },
      { path: 'columns[].visible', type: 'boolean | (context) => boolean', defaultValue: 'true', target: '列显隐', description: '控制当前列是否渲染。', context: 'ColumnContext' },
      { path: 'columns[].cellSlot', type: 'string', defaultValue: '—', target: '整格 scoped Slot', description: '直接渲染当前单元格，与 children 互斥且不要求 fieldKey。' },
      { path: 'columns[].children', type: 'RowConfig[]', defaultValue: '[]', target: '单元格字段布局', description: '进入 Row → Item 字段渲染链路。' }
    ]
  },
  {
    id: 'row-item',
    title: 'columns[].children[] · RowConfig / FormItemConfig',
    description: '单元格内部的栅格布局、字段定位和校验。',
    entries: [
      { path: 'columns[].children[].key', type: 'string', defaultValue: '—', target: '行布局身份', description: '动态 Row 布局建议配置。' },
      { path: 'columns[].children[].props', type: 'Object | (context) => Object', defaultValue: '{}', target: 'el-row', description: 'gutter、justify、align 等。', context: 'RowContext' },
      { path: 'columns[].children[].visible', type: 'boolean | (context) => boolean', defaultValue: 'true', target: 'Row 显隐', description: '按当前业务行控制布局。', context: 'RowContext' },
      { path: 'columns[].children[].children', type: 'FormItemConfig[]', defaultValue: '[]', target: '字段列表', description: '当前栅格行中的字段配置。' },
      { path: 'columns[].children[].children[].key', type: 'string', defaultValue: '—', target: '字段渲染身份', description: '动态字段或重复 fieldKey 时建议配置。' },
      { path: 'columns[].children[].children[].fieldKey', type: 'string', defaultValue: '必填', target: 'row 数据路径', description: '支持 profile.city、items[0].name 等嵌套路径。' },
      { path: 'columns[].children[].children[].type', type: 'BuiltinType | component | slot', defaultValue: '必填', target: '字段渲染策略', description: '内置别名、直接组件或字段 Slot。' },
      { path: 'columns[].children[].children[].visible', type: 'boolean | (context) => boolean', defaultValue: 'true', target: '字段显隐', description: '按字段上下文控制渲染。', context: 'ItemContext' },
      { path: 'columns[].children[].children[].colProps', type: 'Object | (context) => Object', defaultValue: '{}', target: 'el-col', description: 'span、offset 等栅格属性。', context: 'ItemContext' },
      { path: 'columns[].children[].children[].formItemProps', type: 'Object | (context) => Object', defaultValue: '{}', target: 'el-form-item', description: 'label、rules 等；校验 prop 自动生成。', context: 'ItemContext' },
      { path: 'columns[].children[].children[].hint', type: 'string | (context) => string', defaultValue: '—', target: 'el-form-item title', description: '字段外层原生 title；空字符串不显示。', context: 'ItemContext' },
      { path: 'columns[].children[].children[].component', type: 'ComponentConfig', defaultValue: '{}', target: '实际字段组件', description: '组件、绑定协议、属性、事件和选项。' }
    ]
  },
  {
    id: 'component',
    title: '…children[].component · ComponentConfig',
    description: '以下 … 代表 columns[].children[].children[]，页面展示仍保留完整可复制路径。',
    entries: [
      { path: 'columns[].children[].children[].component.renderer', type: 'Component | string', defaultValue: '按 type', target: '字段组件 / Slot 名', description: 'component 模式为组件，slot 模式为具名 Slot。' },
      { path: 'columns[].children[].children[].component.resolveRenderer', type: '(context) => Component | string', defaultValue: '—', target: '动态字段组件', description: '仅 component 模式，undefined 时回退 renderer。', context: 'ItemContext' },
      { path: 'columns[].children[].children[].component.model', type: 'true | false | ModelConfig', defaultValue: 'true', target: '值绑定协议', description: '默认 v-model、自定义 prop/event，或关闭自动绑定。' },
      { path: 'columns[].children[].children[].component.props', type: 'Object | (context) => Object', defaultValue: '{}', target: '字段组件', description: '直接透传给实际组件。', context: 'ItemContext' },
      { path: 'columns[].children[].children[].component.listeners', type: 'Record<string, Function>', defaultValue: '{}', target: '字段组件事件', description: '首参为 ActionContext，之后保持组件原始参数。', context: 'ActionContext + event args' },
      { path: 'columns[].children[].children[].component.options', type: 'Option[] | (context) => Option[]', defaultValue: '[]', target: '选项型组件', description: 'select、radio、checkbox 等选项。', context: 'ItemContext' },
      { path: 'columns[].children[].children[].component.optionProps', type: 'Object | (context) => Object', defaultValue: '—', target: '选项字段映射', description: '自定义 label、value、disabled、key 字段。', context: 'ItemContext' }
    ]
  }
]

export const contextRows = [
  { location: 'columns[].visible / props / headerProps / headerHint', context: 'ColumnContext', fields: 'tableData, columnConfig' },
  { location: 'columns[].headerSlot', context: 'HeaderSlotContext', fields: 'tableData, columnConfig, columnIndex, label, header' },
  { location: 'columns[].cellSlot', context: 'FormTableCellSlotContext', fields: 'row, index, columnConfig, updateRow' },
  { location: 'columns[].children[].visible / props', context: 'RowContext', fields: 'ColumnContext + row, index, rowConfig' },
  { location: '…children[].visible / colProps / formItemProps / hint', context: 'ItemContext', fields: 'RowContext + fieldKey, value, itemConfig' },
  { location: '…component.props / options / optionProps / resolveRenderer', context: 'ItemContext', fields: 'ItemContext' },
  { location: '…component.listeners[event]', context: 'ActionContext', fields: 'ItemContext + setValue, updateRow；后接原始事件参数' },
  { location: 'type: slot 字段 Slot', context: 'FormTableSlotContext', fields: 'ActionContext + propPath, component' }
]

export const renderModes = [
  { mode: '内置 type', config: "type: 'input' / 'select' / …", fieldKey: '需要', validation: '支持', scope: '—', usage: '常规表单字段' },
  { mode: 'component', config: "type: 'component' + component.renderer", fieldKey: '需要', validation: '支持', scope: 'ItemContext', usage: '自定义字段组件' },
  { mode: '字段 Slot', config: "type: 'slot' + component.renderer", fieldKey: '需要', validation: '支持', scope: 'FormTableSlotContext', usage: '字段交互与完全自定义模板' },
  { mode: 'cellSlot', config: 'columns[].cellSlot', fieldKey: '不需要', validation: '不提供', scope: 'FormTableCellSlotContext', usage: '组合展示、状态、派生值、操作列' },
  { mode: 'headerSlot', config: 'columns[].headerSlot', fieldKey: '不需要', validation: '不涉及', scope: 'HeaderSlotContext', usage: '图标、提示和交互表头' }
]

export const eventRows = [
  { name: 'update:tableData', payload: 'TableRow[]', description: '受控数据的新数组，应立即回写。' },
  { name: 'field-change', payload: '{ row, index, fieldKey, value, previousValue }', description: '每个实际字段变化触发一次。' },
  { name: 'Element Table 原生事件', payload: '保持 Element UI 原始参数', description: 'row-click、selection-change、sort-change 等直接透传。' }
]

export const refRows = [
  { name: 'validate()', result: 'Promise<boolean>', description: '执行完整表单校验。' },
  { name: 'resetFields()', result: 'void', description: '保持 Element Form 原生重置语义。' },
  { name: 'clearValidate()', result: 'void', description: '清除校验状态。' },
  { name: 'getFormRef()', result: 'ElForm | undefined', description: '获取原生 Form Ref。' },
  { name: 'getTableRef()', result: 'ElTable | undefined', description: '获取原生 Table Ref。' }
]

export const featureCards = [
  { title: '数据更新与受控回写', path: '/cell-slot', description: '自动 model、setValue、updateRow、字段事件和异步更新。', tags: ['tableData', 'setValue', 'field-change'] },
  { title: '校验、清理与重置', path: '/form-table', description: '字段 rules、整表校验、清理状态和受控数据重置。', tags: ['rules', 'validate', 'clearValidate'] },
  { title: '动态显隐与配置', path: '/dynamic-slot-test', description: 'Column、Row、Item visible 与动态组件属性。', tags: ['visible', 'dynamic props'] },
  { title: '稳定身份与异步安全', path: '/row-column-operations', description: 'rowKey 与 Column、Row、Item key 的不同职责。', tags: ['rowKey', 'key', 'async'] },
  { title: '原生 title 提示', path: '/form-table', description: '字段内容提示、动态字符串和空值行为。', tags: ['hint', 'headerHint', 'title'] },
  { title: '自定义表头', path: '/form-table-advanced', description: '表头文本、图标、Tooltip 与解析后 header 上下文。', tags: ['headerSlot', 'header.props'] },
  { title: 'cellSlot 列级单元格', path: '/cell-slot', description: '组合展示、状态、派生值、操作列，以及与字段 Slot 的边界。', tags: ['cellSlot', 'updateRow', 'rowKey'] },
  { title: '企业复杂组件接入', path: '/enterprise-components', description: '自定义 model、动态组件和复杂事件联动。', tags: ['component', 'model', 'listeners'] },
  { title: '行列操作', path: '/row-column-operations', description: '动态列、行增删复制移动和延迟提交。', tags: ['columns', 'controlled data'] },
  { title: '单元格合并', path: '/cell-merge', description: 'spanMethod、稳定列定位和汇总行。', tags: ['spanMethod', 'rowspan'] },
  { title: '远程 Schema', path: '/remote-schema', description: '远程 JSON 与页面本地组件、事件增强。', tags: ['JSON', 'local enhance'] }
]
