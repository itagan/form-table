import type { BuiltinFormItemType, ComponentProps } from '../types'

/** 仅负责 type 到组件的映射，不覆盖 Element UI 的交互默认值。 */
const componentTypeMap: Record<BuiltinFormItemType, string> = {
  input: 'el-input',
  select: 'el-select',
  date: 'el-date-picker',
  datetime: 'el-date-picker',
  time: 'el-time-picker',
  textarea: 'el-input',
  number: 'el-input-number',
  switch: 'el-switch',
  radio: 'el-radio-group',
  checkbox: 'el-checkbox-group',
  text: 'span',
  rate: 'el-rate',
  slider: 'el-slider',
  color: 'el-color-picker',
  upload: 'el-upload',
  cascader: 'el-cascader',
  autocomplete: 'el-autocomplete'
}

/** 只补充 type 别名本身必需的属性。 */
const typeRequiredProps: Partial<Record<BuiltinFormItemType, ComponentProps>> = {
  textarea: { type: 'textarea' },
  date: { type: 'date' },
  datetime: { type: 'datetime' }
}

/** 将公开的内置字段类型转换为实际 Vue 组件名称。 */
export function getComponentType(type: BuiltinFormItemType) {
  return componentTypeMap[type]
}

/** 获取某个类型别名正常工作所需的最小默认属性。 */
export function getRequiredProps(type: BuiltinFormItemType) {
  return typeRequiredProps[type] || {}
}
