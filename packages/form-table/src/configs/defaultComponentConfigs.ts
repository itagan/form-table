import type { ComponentProps, FormItemType } from '../types'

/** 仅负责 type 到组件的映射，不覆盖 Element UI 的交互默认值。 */
export const componentTypeMap: Record<FormItemType, string> = {
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
  'tree-select': 'el-tree-select',
  autocomplete: 'el-autocomplete',
  'tag-input': 'el-select'
}

/** 只补充 type 别名本身必需的属性。 */
export const typeRequiredProps: Partial<Record<FormItemType, ComponentProps>> = {
  textarea: { type: 'textarea' },
  date: { type: 'date' },
  datetime: { type: 'datetime' },
  'tag-input': {
    multiple: true,
    filterable: true,
    allowCreate: true
  }
}

export function getComponentType(type: FormItemType) {
  return componentTypeMap[type]
}

export function getRequiredProps(type: FormItemType) {
  return typeRequiredProps[type] || {}
}
