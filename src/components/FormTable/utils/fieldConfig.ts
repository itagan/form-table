import type {
  DynamicValue,
  FormItemConfig,
  FormItemOption,
  FormTableFieldChangeHandler,
  FormTableFieldListener,
  FormTableRuntimeContext,
  OptionPropsConfig
} from '../types'
import { resolveDynamicValue, resolveVisible } from './dynamic'

/**
 * 解析对象型动态配置。
 *
 * 未配置时统一返回空对象，调用方可以直接展开或判断 key 数量。
 */
function resolveRecord(
  value: DynamicValue<Record<string, any>> | undefined,
  context: FormTableRuntimeContext
) {
  return resolveDynamicValue(value, context) || {}
}

/**
 * 解析字段显隐。
 */
export function resolveFormItemVisible(
  item: FormItemConfig,
  context: FormTableRuntimeContext
) {
  return resolveVisible(item.behavior?.visible, context)
}

/**
 * 获取字段列宽，默认占满当前 el-row。
 */
export function getFormItemColSpan(item: FormItemConfig) {
  return item.layout?.span ?? 24
}

/**
 * 解析 el-col 透传属性。
 */
export function resolveFormItemColProps(
  item: FormItemConfig,
  context: FormTableRuntimeContext
) {
  const colProps = resolveRecord(item.layout?.colProps, context)
  return Object.keys(colProps).length > 0 ? colProps : undefined
}

/**
 * 解析底层字段组件的透传属性。
 */
export function resolveFormItemBind(
  item: FormItemConfig,
  context: FormTableRuntimeContext
) {
  return resolveRecord(item.component?.bind, context)
}

/**
 * 解析选项列表。
 */
export function resolveFormItemOptions(
  item: FormItemConfig,
  context: FormTableRuntimeContext
): FormItemOption[] | undefined {
  return resolveDynamicValue(item.component?.options, context)
}

/**
 * 解析选项字段映射。
 */
export function resolveFormItemOptionProps(
  item: FormItemConfig,
  context: FormTableRuntimeContext
): OptionPropsConfig | undefined {
  const optionProps = resolveRecord(item.component?.optionProps, context)
  return Object.keys(optionProps).length > 0 ? optionProps : undefined
}

/**
 * 获取底层组件事件监听配置。
 */
export function getFormItemListeners(
  item: FormItemConfig
): Record<string, FormTableFieldListener> {
  return item.component?.listeners || {}
}

/**
 * 获取字段值变化后的联动处理函数。
 */
export function getFormItemOnValueChange(
  item: FormItemConfig
): FormTableFieldChangeHandler | undefined {
  return item.behavior?.onValueChange
}

/**
 * 解析字段默认值。
 */
export function resolveFormItemDefaultValue(
  item: FormItemConfig,
  context: FormTableRuntimeContext
) {
  return resolveDynamicValue(item.behavior?.defaultValue, context)
}

/**
 * 获取自定义组件注册名。
 */
export function getFormItemCustomComponent(item: FormItemConfig) {
  return item.component?.customComponent
}

/**
 * 获取具名插槽名称。
 */
export function getFormItemSlotName(item: FormItemConfig) {
  return item.component?.slotName
}

/**
 * 判断字段是否启用 tooltip 展示。
 */
export function isFormItemTooltipEnabled(item: FormItemConfig) {
  const tooltip = item.display?.tooltip

  if (typeof tooltip === 'boolean') {
    return tooltip
  }

  if (tooltip && typeof tooltip === 'object' && tooltip.enabled !== undefined) {
    return tooltip.enabled
  }

  return false
}

/**
 * 解析 tooltip 透传属性。
 */
export function resolveFormItemTooltipProps(
  item: FormItemConfig,
  context: FormTableRuntimeContext
) {
  const displayTooltip = item.display?.tooltip
  const groupedProps = typeof displayTooltip === 'object' ? displayTooltip.props : undefined

  return resolveRecord(groupedProps, context)
}

/**
 * 获取文本展示格式化函数。
 */
export function getFormItemFormatter(item: FormItemConfig) {
  return item.display?.formatter
}

/**
 * 获取空值展示文案。
 */
export function getFormItemEmptyText(item: FormItemConfig) {
  return item.display?.emptyText
}
