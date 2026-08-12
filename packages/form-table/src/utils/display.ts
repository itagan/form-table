import type { FormItemOption, OptionPropsConfig } from '../types/config'

/** 选项对象未声明字段映射时采用的默认键名。 */
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

/** 读取选项的实际值。 */
export function getOptionValue(option: FormItemOption, optionProps?: OptionPropsConfig) {
  return option[getOptionProp(optionProps, 'value')]
}

/** 读取展示文本，缺少 label 时依次回退到 value 和空字符串。 */
export function getOptionLabel(option: FormItemOption, optionProps?: OptionPropsConfig) {
  return option[getOptionProp(optionProps, 'label')]
    ?? option[getOptionProp(optionProps, 'value')]
    ?? ''
}

/** 将配置字段对应的值归一化为禁用状态。 */
export function getOptionDisabled(option: FormItemOption, optionProps?: OptionPropsConfig) {
  return Boolean(option[getOptionProp(optionProps, 'disabled')])
}

/** 为 v-for 选择稳定 key，字段均缺失时才回退到数组下标。 */
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
