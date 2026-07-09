import type {
  ComponentBind,
  DynamicValue,
  FormItemConfig,
  FormItemOption,
  FormTableFieldChangeHandler,
  FormTableFieldListener,
  FormTableRuntimeContext,
  OptionPropsConfig,
  ValidationRule
} from '../types'
import { resolveDynamicValue, resolveVisible } from './dynamic'

interface CachedTopLevelBind {
  signature: string
  value: ComponentBind
}

interface CachedFormItemRules {
  signature: string
  value: ValidationRule[] | undefined
}

const topLevelBindCache = new WeakMap<FormItemConfig, CachedTopLevelBind>()
const formItemRulesCache = new WeakMap<FormItemConfig, CachedFormItemRules>()

/**
 * 解析对象型动态配置。
 *
 * 未配置时统一返回空对象，调用方可以直接展开或判断 key 数量。
 */
function resolveRecord(
  value: DynamicValue<ComponentBind> | undefined,
  context: FormTableRuntimeContext
) {
  return resolveDynamicValue(value, context) || {}
}

function getCachedTopLevelBind(item: FormItemConfig) {
  const signature = [
    item.placeholder,
    item.disabled,
    item.clearable,
    item.readonly
  ].join('|')
  const cachedBind = topLevelBindCache.get(item)

  if (cachedBind?.signature === signature) {
    return cachedBind.value
  }

  const topLevelBind: ComponentBind = {}

  if (item.placeholder !== undefined) {
    topLevelBind.placeholder = item.placeholder
  }

  if (item.disabled !== undefined) {
    topLevelBind.disabled = item.disabled
  }

  if (item.clearable !== undefined) {
    topLevelBind.clearable = item.clearable
  }

  if (item.readonly !== undefined) {
    topLevelBind.readonly = item.readonly
  }

  topLevelBindCache.set(item, {
    signature,
    value: topLevelBind
  })

  return topLevelBind
}

function getRulesSignature(item: FormItemConfig) {
  return [
    item.required,
    item.requiredMessage,
    item.label,
    item.key,
    item.type,
    item.trigger,
    item.rules,
    item.rules?.length
  ].join('|')
}

function hasKeys(value: ComponentBind) {
  return Object.keys(value).length > 0
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
  const topLevelBind = getCachedTopLevelBind(item)
  const componentBind = resolveRecord(item.component?.bind, context)

  if (!hasKeys(componentBind)) {
    return topLevelBind
  }

  return hasKeys(topLevelBind)
    ? {
        ...topLevelBind,
        ...componentBind
      }
    : componentBind
}

/**
 * 解析选项列表。
 */
export function resolveFormItemOptions(
  item: FormItemConfig,
  context: FormTableRuntimeContext
): FormItemOption[] | undefined {
  return resolveDynamicValue(item.component?.options ?? item.options, context)
}

/**
 * 解析选项字段映射。
 */
export function resolveFormItemOptionProps(
  item: FormItemConfig,
  context: FormTableRuntimeContext
): OptionPropsConfig | undefined {
  const optionProps = resolveRecord(item.component?.optionProps ?? item.optionProps, context)
  return Object.keys(optionProps).length > 0 ? optionProps : undefined
}

export function getFormItemRules(item: FormItemConfig): ValidationRule[] | undefined {
  const signature = getRulesSignature(item)
  const cachedRules = formItemRulesCache.get(item)

  if (cachedRules?.signature === signature) {
    return cachedRules.value
  }

  const rules: ValidationRule[] = []

  if (item.required) {
    rules.push({
      required: true,
      message: item.requiredMessage || `${item.label || item.key}不能为空`,
      trigger: item.trigger || (item.type === 'input' || item.type === 'textarea' ? 'blur' : 'change')
    })
  }

  if (item.rules?.length) {
    rules.push(...item.rules)
  }

  const normalizedRules = rules.length > 0 ? rules : undefined
  formItemRulesCache.set(item, {
    signature,
    value: normalizedRules
  })

  return normalizedRules
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
export function getFormItemComponentName(item: FormItemConfig) {
  return item.component?.name
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
