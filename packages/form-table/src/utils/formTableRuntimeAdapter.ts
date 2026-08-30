import type { ComponentProps } from '../types/base'

export type FormTableListenerMap = Record<string, (...args: unknown[]) => void>

interface Vue2ComponentProxy {
  $listeners?: FormTableListenerMap
}

const MANAGED_TABLE_LISTENERS = new Set(['update:tableData', 'field-change', 'form-validate'])
const MANAGED_TOOLTIP_PROPS = new Set([
  'content',
  'reference',
  'popper',
  'manual',
  'value',
  'enterable'
])

/** 将 Vue 2 实例专属的 $listeners 读取限制在运行时适配边界内。 */
export function getVue2ComponentListeners(proxy: unknown): FormTableListenerMap {
  return (proxy as Vue2ComponentProxy | null)?.$listeners || {}
}

/** FormTable 自身事件在根组件处理，其余监听器原样交给 el-table。 */
export function resolveTableListeners(listeners: FormTableListenerMap): FormTableListenerMap {
  const resolvedListeners: FormTableListenerMap = {}
  for (const name of Object.keys(listeners)) {
    if (!MANAGED_TABLE_LISTENERS.has(name)) resolvedListeners[name] = listeners[name]
  }
  return resolvedListeners
}

/** data/rowKey 由根组件协议管理，不继续透传 tableProps 中的同名配置。 */
export function resolveTableProps(tableProps: ComponentProps): ComponentProps {
  const {
    data: _managedData,
    rowKey: _managedRowKey,
    ...resolvedProps
  } = tableProps
  return resolvedProps
}

/** 归一化单例 Tooltip 属性，并保护 FormTable 自身管理的显隐和引用协议。 */
export function resolveHintTooltipProps(tooltipProps: ComponentProps): ComponentProps {
  const passthrough: ComponentProps = {}
  for (const key of Object.keys(tooltipProps)) {
    if (!MANAGED_TOOLTIP_PROPS.has(key)) passthrough[key] = tooltipProps[key]
  }
  const customPopperClass = typeof passthrough.popperClass === 'string'
    ? passthrough.popperClass
    : ''

  return {
    placement: 'top',
    effect: 'dark',
    openDelay: 100,
    ...passthrough,
    popperClass: ['form-table-hint-tooltip', customPopperClass].filter(Boolean).join(' ')
  }
}
