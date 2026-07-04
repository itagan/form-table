import type {
  ComponentBind,
  DispatchFn,
  FormTableFieldContext,
  FormTableFieldListener,
  FormTableListenerArgs,
  FormTableRecord,
  FormTableValue
} from '../types'
import { getValueByPath } from './path'

const INTERNAL_COMPONENT_PROP_KEYS = new Set([
  'options',
  'formatter',
  'emptyText',
  'optionProps'
])

export function filterComponentRenderProps(componentProps: ComponentBind) {
  return Object.keys(componentProps).reduce<ComponentBind>((props, key) => {
    if (!INTERNAL_COMPONENT_PROP_KEYS.has(key)) {
      props[key] = componentProps[key]
    }

    return props
  }, {})
}

export function createFieldValueSetter(options: {
  getRow: () => FormTableRecord
  getRowIndex: () => number
  getFieldKey: () => string
  dispatch?: DispatchFn
  fallback?: (row: FormTableRecord, fieldKey: string, value: FormTableValue) => void
  warn?: (message: string) => void
}) {
  const warn = options.warn || console.warn

  return (value: FormTableValue) => {
    const row = options.getRow()
    const fieldKey = options.getFieldKey()

    if (getValueByPath(row, fieldKey) === value) {
      return
    }

    if (options.dispatch) {
      options.dispatch('update:row', options.getRowIndex(), row, fieldKey, value)
      return
    }

    if (options.fallback) {
      options.fallback(row, fieldKey, value)
      return
    }

    warn('[FormTable] dispatch not found, value update skipped.')
  }
}

export function createRowPatchUpdater(options: {
  getRow: () => FormTableRecord
  getRowIndex: () => number
  dispatch?: DispatchFn
}) {
  return (patch: Partial<FormTableRecord>) => {
    if (options.dispatch) {
      options.dispatch('update:row-data', options.getRowIndex(), patch)
      return
    }

    Object.assign(options.getRow(), patch)
  }
}

export function wrapComponentListeners(
  listeners: Record<string, FormTableFieldListener> | undefined,
  getFieldContext: () => FormTableFieldContext
) {
  return Object.keys(listeners || {}).reduce<Record<string, (...args: FormTableListenerArgs) => void>>((acc, eventName) => {
    const listener = listeners?.[eventName]

    acc[eventName] = (...args: FormTableListenerArgs) => {
      listener?.(getFieldContext(), ...args)
    }

    return acc
  }, {})
}
