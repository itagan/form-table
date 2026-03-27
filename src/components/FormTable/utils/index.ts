/**
 * 工具函数统一导出
 */

export * from './componentProps'
export { processComponentProps, validateComponentConfig } from './componentProps'

export * from './attrs'
export { 
  pick, 
  extractFormAttrs, 
  extractTableAttrs, 
  EL_FORM_PROPS,
  EL_TABLE_PROPS
} from './attrs'
