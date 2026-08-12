/**
 * 兼容的内部类型聚合入口。
 * 公开类型仍由 types.public.ts 精确导出，内部职责拆分不改变消费者导入路径。
 */
export * from './types/base'
export * from './types/context'
export * from './types/config'
export * from './types/component'
export * from './types/internal'
