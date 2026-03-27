/**
 * 默认组件配置
 * 只包含需要特殊处理的组件配置，其他组件使用Element UI默认行为
 */

export interface DefaultComponentConfig {
  [key: string]: any
}

export const defaultComponentConfigs: Record<string, DefaultComponentConfig> = {
  // 日期相关组件需要设置默认格式
  date: {
    type: 'date',
    format: 'YYYY-MM-DD',
    valueFormat: 'YYYY-MM-DD'
  },
  datetime: {
    type: 'datetime',
    format: 'YYYY-MM-DD HH:mm:ss',
    valueFormat: 'YYYY-MM-DD HH:mm:ss'
  },
  time: {
    format: 'HH:mm:ss',
    valueFormat: 'HH:mm:ss'
  },
  
  // 数字输入框默认配置
  number: {
    min: 0,
    step: 1
  },
  
  // 评分组件默认配置
  rate: {
    max: 5,
    showScore: true
  },
  
  // 滑块组件默认配置
  slider: {
    min: 0,
    max: 100,
    step: 1
  },
  
  // 颜色选择器默认配置
  color: {
    showAlpha: true
  },
  
  // 上传组件默认配置
  upload: {
    action: '#',
    'auto-upload': false,
    'list-type': 'text'
  },
  
  // 级联选择器默认配置
  cascader: {
    props: {
      expandTrigger: 'hover'
    }
  },
  
  // 树形选择器默认配置
  'tree-select': {
    props: {
      children: 'children',
      label: 'label',
      value: 'value'
    }
  },
  
  // 自动完成组件默认配置
  autocomplete: {
    triggerOnFocus: true
  },
  
  // 标签输入组件默认配置
  'tag-input': {
    multiple: true,
    filterable: true,
    allowCreate: true,
    'default-first-option': true
  },
  
  // 多行文本默认配置
  textarea: {
    type: 'textarea',
    rows: 3
  }
}

/**
 * 组件类型映射表
 * 将配置中的type映射到实际的Element UI组件
 */
export const componentTypeMap: Record<string, string> = {
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
  slotComponent: 'div',
  custom: 'div',
  rate: 'el-rate',
  slider: 'el-slider',
  color: 'el-color-picker',
  upload: 'el-upload',
  cascader: 'el-cascader',
  'tree-select': 'el-tree-select',
  autocomplete: 'el-autocomplete',
  'tag-input': 'el-select'
}

/**
 * 获取组件默认配置
 * @param type 组件类型
 * @returns 默认配置对象
 */
export function getDefaultConfig(type: string): DefaultComponentConfig {
  return defaultComponentConfigs[type] || {}
}

/**
 * 获取组件类型
 * @param type 配置中的类型
 * @returns Element UI组件名称
 */
export function getComponentType(type: string): string {
  return componentTypeMap[type] || 'el-input'
}
