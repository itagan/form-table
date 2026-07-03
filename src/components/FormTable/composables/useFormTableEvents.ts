import type {
  DispatchFn,
  FormTableArchivedEventName,
  FormTableEmitFn,
  FormTableEmits,
  TableRow
} from '../types'

interface InternalEventHandlers {
  updateRowField?: (rowIndex: number, fieldKey: string, value: any) => void
  updateRowData?: (rowIndex: number, patch: Partial<TableRow>) => void
}

/**
 * 区分内部更新命令和外部业务事件。
 *
 * 子组件仍然只注入一个 `dispatch`，但 `update:row` / `update:row-data`
 * 被视为内部命令；其他事件保持原参数透出，并额外进入统一 `event` 归档。
 */
export function useFormTableEvents(emit: FormTableEmitFn) {
  const internalHandlers: InternalEventHandlers = {}

  // handlers 在 rows composable 创建后再注入，避免事件模块反向依赖行操作实现。
  const setInternalEventHandlers = (handlers: InternalEventHandlers) => {
    Object.assign(internalHandlers, handlers)
  }

  // 统一归档事件适合日志、埋点和调试；具体业务仍应优先监听明确事件名。
  const emitBusinessEvent = <K extends FormTableArchivedEventName>(
    type: K,
    ...args: FormTableEmits[K]
  ) => {
    emit(type, ...args)
    emit('event', { type, args })
  }

  // 内部命令不会触发 event 归档，只有它们解析后的业务结果会被派发出去。
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

    emitBusinessEvent(type as FormTableArchivedEventName, ...(args as FormTableEmits[FormTableArchivedEventName]))
  }

  return {
    dispatch,
    emitBusinessEvent,
    setInternalEventHandlers
  }
}
