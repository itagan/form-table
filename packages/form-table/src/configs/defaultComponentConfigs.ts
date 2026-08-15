import type { BuiltinFormItemType } from '../types/config'

/** 仅负责 type 到组件的映射，不覆盖 Element UI 的交互默认值。 */
const componentTypeMap: Record<BuiltinFormItemType, string> = {
  input: 'el-input',
  select: 'el-select',
  date: 'el-date-picker',
  time: 'el-time-picker',
  'time-select': 'el-time-select',
  number: 'el-input-number',
  switch: 'el-switch',
  radio: 'el-radio-group',
  checkbox: 'el-checkbox-group',
  text: 'span',
  rate: 'el-rate',
  slider: 'el-slider',
  color: 'el-color-picker',
  cascader: 'el-cascader',
  autocomplete: 'el-autocomplete'
}

/** 将公开的内置字段类型转换为实际 Vue 组件名称。 */
export function getComponentType(type: BuiltinFormItemType) {
  return componentTypeMap[type]
}
