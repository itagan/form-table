import type { FormItemOption, OptionPropsConfig } from '../types'

const DEFAULT_OPTION_PROPS: Required<OptionPropsConfig> = {
  label: 'label',
  value: 'value',
  disabled: 'disabled',
  key: 'value'
}

/** 按自定义字段映射取键名，未配置的部分回退到 Element UI 常用字段。 */
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
