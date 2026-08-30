import type {
  BuiltinFormItemType,
  FormTableHintMode,
  FormTableHintTargets,
  FormTableHintTrigger,
  FormTableHintValue
} from '../index'

type PublicRuntimeEntry = typeof import('../index')
// @ts-expect-error 严格字段路径助手已从轻量公共入口移除。
type RemovedFieldHelper = PublicRuntimeEntry['createFormTableField']
void (null as unknown as RemovedFieldHelper)
// @ts-expect-error 布局 Row 已收平，不再导出 RowConfig。
type RemovedRowConfig = import('../index').RowConfig
void (null as unknown as RemovedRowConfig)
// @ts-expect-error 字段联合的内部分支类型不再从包入口导出。
type RemovedBuiltinFormItemConfig = import('../index').BuiltinFormItemConfig
// @ts-expect-error 字段联合的内部分支类型不再从包入口导出。
type RemovedComponentFormItemConfig = import('../index').ComponentFormItemConfig
// @ts-expect-error 字段联合的内部分支类型不再从包入口导出。
type RemovedSlotFormItemConfig = import('../index').SlotFormItemConfig
// @ts-expect-error 内部渲染联合不再作为独立公共类型。
type RemovedFormItemType = import('../index').FormItemType
// @ts-expect-error Slot 解析结果通过 FormTableSlotContext 获取，不单独导出。
type RemovedResolvedComponentConfig = import('../index').ResolvedComponentConfig
// @ts-expect-error 字段默认 Hint 通过 FormTableHintOptions['field'] 表达。
type RemovedDefaultFieldHint = import('../index').FormTableDefaultFieldHint
// @ts-expect-error 纯内部表级上下文不再从包入口导出。
type RemovedTableContext = import('../index').FormTableTableContext
// @ts-expect-error 原生 Element 列类型已统一命名为 NativeColumnConfig。
type RemovedPlainColumnConfig = import('../index').PlainColumnConfig
void (null as unknown as RemovedBuiltinFormItemConfig)
void (null as unknown as RemovedComponentFormItemConfig)
void (null as unknown as RemovedSlotFormItemConfig)
void (null as unknown as RemovedFormItemType)
void (null as unknown as RemovedResolvedComponentConfig)
void (null as unknown as RemovedDefaultFieldHint)
void (null as unknown as RemovedTableContext)
void (null as unknown as RemovedPlainColumnConfig)

// Element UI 未默认提供 Tree Select，不允许作为 FormTable 内置类型使用。
// @ts-expect-error tree-select 应通过 type: 'component' 显式接入
const unsupportedBuiltinType: BuiltinFormItemType = 'tree-select'
void unsupportedBuiltinType

// tag-input 是 el-select 的参数组合，不作为独立内置类型维护。
// @ts-expect-error 应使用 type: 'select' 配合 multiple/filterable/allowCreate
const redundantBuiltinAlias: BuiltinFormItemType = 'tag-input'
void redundantBuiltinAlias

// Input 和 DatePicker 的具体模式通过 component.props.type 表达。
// @ts-expect-error textarea 不再是独立内置类型
const removedTextareaAlias: BuiltinFormItemType = 'textarea'
// @ts-expect-error datetime 不再是独立内置类型
const removedDatetimeAlias: BuiltinFormItemType = 'datetime'
void removedTextareaAlias
void removedDatetimeAlias

// el-upload 依赖 file-list、生命周期回调和触发内容，不使用字段默认 v-model 协议。
// @ts-expect-error upload 应通过 type: 'component' 或 type: 'slot' 显式接入
const unsupportedUploadBuiltin: BuiltinFormItemType = 'upload'
void unsupportedUploadBuiltin

const disabledFieldHint: FormTableHintValue = false
void disabledFieldHint
const disabledHintMode: FormTableHintMode = false
const contentHintTrigger: FormTableHintTrigger = 'content'
const fieldHintTargets: FormTableHintTargets = 'field'
void contentHintTrigger
// @ts-expect-error Hint 不再接受配置对象。
const invalidObjectHint: FormTableHintValue = { content: '自动展示' }
void [disabledHintMode, fieldHintTargets, invalidObjectHint]
