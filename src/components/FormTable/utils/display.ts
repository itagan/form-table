import type {
  FormItemOption,
  FormTableRuntimeContext,
  OptionPropsConfig
} from '../types'

const DEFAULT_OPTION_PROPS: Required<OptionPropsConfig> = {
  label: 'label',
  value: 'value',
  disabled: 'disabled',
  key: 'value'
}

export function getOptionProps(optionProps?: OptionPropsConfig): Required<OptionPropsConfig> {
  return {
    ...DEFAULT_OPTION_PROPS,
    ...(optionProps || {})
  }
}

export function getOptionValue(option: FormItemOption, optionProps?: OptionPropsConfig) {
  const props = getOptionProps(optionProps)
  return option?.[props.value]
}

export function getOptionLabel(option: FormItemOption, optionProps?: OptionPropsConfig) {
  const props = getOptionProps(optionProps)
  return option?.[props.label] ?? getOptionValue(option, optionProps) ?? ''
}

export function getOptionDisabled(option: FormItemOption, optionProps?: OptionPropsConfig) {
  const props = getOptionProps(optionProps)
  return Boolean(option?.[props.disabled])
}

export function getOptionKey(
  option: FormItemOption,
  index: number,
  optionProps?: OptionPropsConfig
) {
  const props = getOptionProps(optionProps)
  return option?.[props.key] ?? option?.[props.value] ?? option?.[props.label] ?? index
}

export function resolveDisplayValue(
  value: any,
  options: FormItemOption[] | undefined,
  optionProps: OptionPropsConfig | undefined,
  formatter: ((value: any, context: FormTableRuntimeContext) => any) | undefined,
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
