import type {
  DispatchFn,
  FormTableFieldChangePayload,
  TableRow
} from '../types'

type FormTableEventName =
  | 'update:tableData'
  | 'update:formData'
  | 'field-change'
  | 'row-add'
  | 'row-copy'
  | 'row-update'
  | 'row-move'
  | 'row-remove'
  | 'validate'

type FormTableEmit = {
  (e: 'update:tableData', data: TableRow[]): void
  (e: 'update:formData', data: Record<string, any>): void
  (e: 'field-change', payload: FormTableFieldChangePayload): void
  (e: 'row-add', row: TableRow, index: number): void
  (e: 'row-copy', row: TableRow, index: number): void
  (e: 'row-update', row: TableRow, index: number): void
  (e: 'row-move', row: TableRow, fromIndex: number, toIndex: number): void
  (e: 'row-remove', row: TableRow, index: number): void
  (e: 'validate', valid: boolean, errors: any[]): void
  (e: 'event', payload: { type: string; args: any[] }): void
}

interface InternalEventHandlers {
  updateRowField?: (rowIndex: number, fieldKey: string, value: any) => void
  updateRowData?: (rowIndex: number, patch: Partial<TableRow>) => void
}

/**
 * Separates internal update commands from public business events.
 *
 * Child components still use one injected `dispatch`, but `update:row` and
 * `update:row-data` are treated as internal commands while public events are
 * emitted unchanged and mirrored into the unified `event` archive.
 */
export function useFormTableEvents(emit: FormTableEmit) {
  const internalHandlers: InternalEventHandlers = {}

  const setInternalEventHandlers = (handlers: InternalEventHandlers) => {
    Object.assign(internalHandlers, handlers)
  }

  const emitBusinessEvent = (type: FormTableEventName, ...args: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(emit as any)(type, ...args)
    emit('event', { type, args })
  }

  const dispatch: DispatchFn = (type: string, ...args: any[]) => {
    if (type === 'update:row') {
      const [rowIndex, _row, fieldKey, value] = args
      internalHandlers.updateRowField?.(rowIndex, fieldKey, value)
      return
    }

    if (type === 'update:row-data') {
      const [rowIndex, patch] = args
      internalHandlers.updateRowData?.(rowIndex, patch)
      return
    }

    emitBusinessEvent(type as FormTableEventName, ...args)
  }

  return {
    dispatch,
    emitBusinessEvent,
    setInternalEventHandlers
  }
}
