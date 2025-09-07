/**
 * 工具函数统一导出
 */

export * from './componentProps'
export { processComponentProps, validateComponentConfig } from './componentProps'

export * from './attrs'
export { 
  pick, 
  omit, 
  extractFormAttrs, 
  extractTableAttrs, 
  extractFormTableAttrs,
  EL_FORM_PROPS,
  EL_TABLE_PROPS,
  FORM_TABLE_PROPS
} from './attrs'
