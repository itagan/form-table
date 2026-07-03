/**
 * componentProps 工具模块
 *
 * 负责将 FormItemConfig 解析为实际可渲染的组件类型和属性。
 * 属性合并优先级: component.bind > 渲染透传配置 > 默认配置 > Element UI 默认
 */

import { getDefaultConfig, getComponentType } from '../configs/defaultComponentConfigs'
import type { ComponentBind, CustomComponentsMap } from '../types'

const NO_CLEARABLE_TYPES = new Set(['switch', 'radio', 'checkbox', 'rate', 'slider', 'color', 'upload'])

/**
 * 组件属性解析入参。
 *
 * 除显式字段外，剩余字段会作为渲染层透传属性参与合并。
 */
export interface ComponentPropsOptions {
  type: string
  customComponent?: string
  customComponents?: CustomComponentsMap
  bind?: ComponentBind
  [key: string]: any
}

/**
 * Element UI 常用组件默认属性。
 *
 * 这些值只提供体验默认值，业务方仍可通过 `component.bind` 覆盖。
 */
const ELEMENT_UI_DEFAULTS: Record<string, ComponentBind> = {
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
 * 优先级：component.bind 配置 > 渲染透传配置 > 默认配置 > Element UI 默认
 * @param options 组件配置选项
 * @returns 处理后的组件属性
 */
export function processComponentProps(options: ComponentPropsOptions): {
  componentType: any
  componentProps: ComponentBind
} {
  const {
    type,
    customComponent,
    customComponents,
    bind,
    fieldKey,
    row,
    rowIndex,
    ...userProps
  } = options
  
  // 1. 获取组件类型
  let componentType: any
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
    
    // 渲染层透传属性
    ...userProps,
    
    // 用户通过 component.bind 配置的属性（最高优先级）
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
