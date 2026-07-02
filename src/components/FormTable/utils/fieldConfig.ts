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

function resolveRecord(
  value: DynamicValue<Record<string, any>> | undefined,
  context: FormTableRuntimeContext
) {
  return resolveDynamicValue(value, context) || {}
}

export function resolveFormItemVisible(
  item: FormItemConfig,
  context: FormTableRuntimeContext
) {
  return resolveVisible(item.behavior?.visible, context)
}

export function getFormItemColSpan(item: FormItemConfig) {
  return item.layout?.span ?? 24
}

export function resolveFormItemColProps(
  item: FormItemConfig,
  context: FormTableRuntimeContext
) {
  const colProps = resolveRecord(item.layout?.colProps, context)
  return Object.keys(colProps).length > 0 ? colProps : undefined
}

export function resolveFormItemBind(
  item: FormItemConfig,
  context: FormTableRuntimeContext
) {
  return resolveRecord(item.component?.bind, context)
}

export function resolveFormItemOptions(
  item: FormItemConfig,
  context: FormTableRuntimeContext
): FormItemOption[] | undefined {
  return resolveDynamicValue(item.component?.options, context)
}

export function resolveFormItemOptionProps(
  item: FormItemConfig,
  context: FormTableRuntimeContext
): OptionPropsConfig | undefined {
  const optionProps = resolveRecord(item.component?.optionProps, context)
  return Object.keys(optionProps).length > 0 ? optionProps : undefined
}

export function getFormItemListeners(
  item: FormItemConfig
): Record<string, FormTableFieldListener> {
  return item.component?.listeners || {}
}

export function getFormItemOnValueChange(
  item: FormItemConfig
): FormTableFieldChangeHandler | undefined {
  return item.behavior?.onValueChange
}

export function resolveFormItemDefaultValue(
  item: FormItemConfig,
  context: FormTableRuntimeContext
) {
  return resolveDynamicValue(item.behavior?.defaultValue, context)
}

export function getFormItemCustomComponent(item: FormItemConfig) {
  return item.component?.customComponent
}

export function getFormItemSlotName(item: FormItemConfig) {
  return item.component?.slotName
}

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

export function resolveFormItemTooltipProps(
  item: FormItemConfig,
  context: FormTableRuntimeContext
) {
  const displayTooltip = item.display?.tooltip
  const groupedProps = typeof displayTooltip === 'object' ? displayTooltip.props : undefined

  return resolveRecord(groupedProps, context)
}

export function getFormItemFormatter(item: FormItemConfig) {
  return item.display?.formatter
}

export function getFormItemEmptyText(item: FormItemConfig) {
  return item.display?.emptyText
}
