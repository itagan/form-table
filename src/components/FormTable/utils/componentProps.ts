import { getDefaultConfig, getComponentType } from '../configs/defaultComponentConfigs'

const NO_CLEARABLE_TYPES = new Set(['switch', 'radio', 'checkbox', 'rate', 'slider', 'color', 'upload'])

export interface ComponentPropsOptions {
  type: string
  customComponent?: string
  customComponents?: Record<string, any>
  bind?: Record<string, any>
  [key: string]: any
}

const ELEMENT_UI_DEFAULTS: Record<string, Record<string, any>> = {
  'el-input': {
    placeholder: '请输入',
    clearable: true
  },
  'el-select': {
    placeholder: '请选择',
    clearable: true
  },
  'el-date-picker': {
    placeholder: '请选择日期',
    clearable: true
  },
  'el-time-picker': {
    placeholder: '请选择时间',
    clearable: true
  },
  'el-cascader': {
    placeholder: '请选择',
    clearable: true
  },
  'el-tree-select': {
    placeholder: '请选择',
    clearable: true
  },
  'el-autocomplete': {
    placeholder: '请输入',
    clearable: true
  }
}

/**
 * 处理组件属性
 * 优先级：用户bind配置 > 用户直接配置 > 默认配置 > Element UI默认
 * @param options 组件配置选项
 * @returns 处理后的组件属性
 */
export function processComponentProps(options: ComponentPropsOptions): {
  componentType: string
  componentProps: Record<string, any>
} {
  const { type, customComponent, customComponents, bind, ...userProps } = options
  
  // 1. 获取组件类型
  let componentType: string
  if (type === 'custom' && customComponent) {
    const customComponentInstance = customComponents?.[customComponent]
    if (!customComponentInstance) {
      console.warn(`Custom component "${customComponent}" not found. Available:`, Object.keys(customComponents || {}))
      componentType = 'div'
    } else {
      componentType = customComponentInstance
    }
  } else {
    componentType = getComponentType(type)
  }
  
  // 2. 获取默认配置
  const defaultConfig = getDefaultConfig(type)
  const elementUIDefaults = ELEMENT_UI_DEFAULTS[componentType] || {}
  
  // 3. 合并属性（按优先级）
  const componentProps = {
    // Element UI默认属性
    ...elementUIDefaults,
    
    // 组件默认配置
    ...defaultConfig,
    
    // 用户直接配置的属性
    ...userProps,
    
    // 用户通过bind配置的属性（最高优先级）
    ...bind
  }
  
  // 4. 特殊处理：移除不适合的属性
  if (NO_CLEARABLE_TYPES.has(type)) {
    delete componentProps.clearable
  }
  
  return {
    componentType,
    componentProps
  }
}

/**
 * 验证组件配置
 * @param type 组件类型
 * @param props 组件属性
 * @returns 验证结果
 */
export function validateComponentConfig(type: string, props: Record<string, any>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // 基础验证
  if (!type) {
    errors.push('Component type is required')
  }
  
  // 特定组件验证
  if (type === 'custom' && !props.customComponent) {
    errors.push('Custom component name is required when type is "custom"')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
