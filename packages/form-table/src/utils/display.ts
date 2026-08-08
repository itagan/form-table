import type { FormItemOption, OptionPropsConfig } from '../types'

const DEFAULT_OPTION_PROPS: Required<OptionPropsConfig> = {
  label: 'label',
  value: 'value',
  disabled: 'disabled',
  key: 'value'
}

function getOptionProp(
  optionProps: OptionPropsConfig | undefined,
  prop: keyof Required<OptionPropsConfig>
) {
  return optionProps?.[prop] ?? DEFAULT_OPTION_PROPS[prop]
}

export function getOptionValue(option: FormItemOption, optionProps?: OptionPropsConfig) {
  return option[getOptionProp(optionProps, 'value')]
}

export function getOptionLabel(option: FormItemOption, optionProps?: OptionPropsConfig) {
  return option[getOptionProp(optionProps, 'label')]
    ?? option[getOptionProp(optionProps, 'value')]
    ?? ''
}

export function getOptionDisabled(option: FormItemOption, optionProps?: OptionPropsConfig) {
  return Boolean(option[getOptionProp(optionProps, 'disabled')])
}

export function getOptionKey(
  option: FormItemOption,
  index: number,
  optionProps?: OptionPropsConfig
) {
  return option[getOptionProp(optionProps, 'key')]
    ?? option[getOptionProp(optionProps, 'value')]
    ?? option[getOptionProp(optionProps, 'label')]
    ?? index
}
