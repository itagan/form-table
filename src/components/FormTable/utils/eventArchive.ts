import type { FormTableArchivedEventName, FormTableValue } from '../types'

interface ArchivedColumn {
  id?: string
  columnKey?: string
  property?: string
  label?: string
  type?: string
  index?: number
}

interface ArchivedElement {
  tagName?: string
  className?: string
  text?: string
}

interface ArchivedDomEvent {
  type?: string
  button?: number
  key?: string
  clientX?: number
  clientY?: number
}

const tableColumnKeys = ['id', 'columnKey', 'property', 'label', 'type', 'index']

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object'
}

function isDomEvent(value: unknown): value is Event & {
  button?: number
  key?: string
  clientX?: number
  clientY?: number
} {
  return typeof Event !== 'undefined' && value instanceof Event
}

function isHtmlElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement
}

function isTableColumn(value: unknown): value is Record<string, any> {
  if (!isObject(value) || isDomEvent(value) || isHtmlElement(value)) {
    return false
  }

  return tableColumnKeys.some((key) => key in value)
}

function archiveDomEvent(event: Event & {
  button?: number
  key?: string
  clientX?: number
  clientY?: number
}): ArchivedDomEvent {
  return {
    type: event.type,
    button: event.button,
    key: event.key,
    clientX: event.clientX,
    clientY: event.clientY
  }
}

function archiveElement(element: HTMLElement): ArchivedElement {
  return {
    tagName: element.tagName,
    className: element.className,
    text: element.textContent?.trim().slice(0, 80)
  }
}

function archiveColumn(column: Record<string, any>): ArchivedColumn {
  return {
    id: column.id,
    columnKey: column.columnKey,
    property: column.property,
    label: column.label,
    type: column.type,
    index: column.index
  }
}

function archiveValue(value: FormTableValue): FormTableValue {
  if (isDomEvent(value)) {
    return archiveDomEvent(value)
  }

  if (isHtmlElement(value)) {
    return archiveElement(value)
  }

  if (isTableColumn(value)) {
    return archiveColumn(value)
  }

  return value
}

function archiveSortChangePayload(payload: FormTableValue): FormTableValue {
  if (!isObject(payload)) {
    return payload
  }

  return {
    column: archiveValue(payload.column),
    prop: payload.prop,
    order: payload.order
  }
}

/**
 * 统一事件归档面向日志和调试面板，避免把 DOM/Event/Element UI 列实例
 * 直接暴露给 `@event`，具名事件仍会收到 Element UI 原始参数。
 */
export function archiveFormTableEventArgs(
  type: FormTableArchivedEventName,
  args: FormTableValue[]
): FormTableValue[] {
  switch (type) {
    case 'cell-mouse-enter':
    case 'cell-mouse-leave':
    case 'cell-click':
    case 'cell-dblclick':
      return [
        args[0],
        archiveValue(args[1]),
        archiveValue(args[2]),
        archiveValue(args[3])
      ]
    case 'row-click':
    case 'row-contextmenu':
    case 'row-dblclick':
      return [
        args[0],
        archiveValue(args[1]),
        archiveValue(args[2])
      ]
    case 'header-click':
    case 'header-contextmenu':
      return [
        archiveValue(args[0]),
        archiveValue(args[1])
      ]
    case 'header-dragend':
      return [
        args[0],
        args[1],
        archiveValue(args[2]),
        archiveValue(args[3])
      ]
    case 'sort-change':
      return [archiveSortChangePayload(args[0])]
    default:
      return args
  }
}
