import type { FormItemOption, OptionPropsConfig } from '../types'

const DEFAULT_OPTION_PROPS: Required<OptionPropsConfig> = {
  label: 'label',
  value: 'value',
  disabled: 'disabled',
  key: 'value'
}

function normalizeOptionProps(optionProps?: OptionPropsConfig) {
  return {
    ...DEFAULT_OPTION_PROPS,
    ...(optionProps || {})
  }
}

export function getOptionValue(option: FormItemOption, optionProps?: OptionPropsConfig) {
  return option[normalizeOptionProps(optionProps).value]
}

export function getOptionLabel(option: FormItemOption, optionProps?: OptionPropsConfig) {
  const props = normalizeOptionProps(optionProps)
  return option[props.label] ?? option[props.value] ?? ''
}

export function getOptionDisabled(option: FormItemOption, optionProps?: OptionPropsConfig) {
  return Boolean(option[normalizeOptionProps(optionProps).disabled])
}

export function getOptionKey(
  option: FormItemOption,
  index: number,
  optionProps?: OptionPropsConfig
) {
  const props = normalizeOptionProps(optionProps)
  return option[props.key] ?? option[props.value] ?? option[props.label] ?? index
}
