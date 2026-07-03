import type {
  FormItemOption,
  FormTableValue,
  FormTableRuntimeContext,
  OptionPropsConfig
} from '../types'

const DEFAULT_OPTION_PROPS: Required<OptionPropsConfig> = {
  label: 'label',
  value: 'value',
  disabled: 'disabled',
  key: 'value'
}

/**
 * 解析选项字段映射。
 *
 * 默认使用 `{ label, value, disabled, key }`，调用方可以通过
 * `component.optionProps` 适配后端返回的字段名。
 */
export function getOptionProps(optionProps?: OptionPropsConfig): Required<OptionPropsConfig> {
  return {
    ...DEFAULT_OPTION_PROPS,
    ...(optionProps || {})
  }
}

/**
 * 获取选项实际提交值。
 */
export function getOptionValue(option: FormItemOption, optionProps?: OptionPropsConfig) {
  const props = getOptionProps(optionProps)
  return option?.[props.value]
}

/**
 * 获取选项展示文案。
 *
 * 当 label 不存在时回退到 value，保证纯 value 选项也能展示。
 */
export function getOptionLabel(option: FormItemOption, optionProps?: OptionPropsConfig) {
  const props = getOptionProps(optionProps)
  return option?.[props.label] ?? getOptionValue(option, optionProps) ?? ''
}

/**
 * 获取选项禁用状态。
 */
export function getOptionDisabled(option: FormItemOption, optionProps?: OptionPropsConfig) {
  const props = getOptionProps(optionProps)
  return Boolean(option?.[props.disabled])
}

/**
 * 获取 v-for key。
 *
 * 优先使用配置的 key 字段，避免 label/value 变化时引起不必要重渲染。
 */
export function getOptionKey(
  option: FormItemOption,
  index: number,
  optionProps?: OptionPropsConfig
) {
  const props = getOptionProps(optionProps)
  return option?.[props.key] ?? option?.[props.value] ?? option?.[props.label] ?? index
}

/**
 * 解析文本展示值。
 *
 * 优先级：自定义 formatter > options 映射 label > 原始 value > emptyText。
 * 用于 `type: 'text'` 和 tooltip 内容展示。
 */
export function resolveDisplayValue(
  value: FormTableValue,
  options: FormItemOption[] | undefined,
  optionProps: OptionPropsConfig | undefined,
  formatter: ((value: FormTableValue, context: FormTableRuntimeContext) => FormTableValue) | undefined,
  emptyText: string | undefined,
  context: FormTableRuntimeContext
) {
  let displayValue = value

  if (typeof formatter === 'function') {
    displayValue = formatter(value, context)
  } else if (Array.isArray(options) && options.length > 0) {
    const matchedOption = options.find((option) => getOptionValue(option, optionProps) === value)
    if (matchedOption) {
      displayValue = getOptionLabel(matchedOption, optionProps)
    }
  }

  if (displayValue === null || displayValue === undefined || displayValue === '') {
    return emptyText ?? ''
  }

  return displayValue
}
