import type {
  FormItemConfig,
  FormTableFieldChangeContext,
  FormTableFieldChangePayload,
  TableRow
} from '../types'
import { getFormItemOnValueChange } from './fieldConfig'
import { getValueByPath, setValueByPath } from './path'

export interface InitialFieldChange {
  fieldKey: string
  value: any
  previousValue: any
}

export interface ResolvedRowChange {
  nextRow: TableRow
  fieldChanges: FormTableFieldChangePayload[]
}

interface ResolveRowChangeContext {
  rowIndex: number
  currentRow: TableRow
  tableData: TableRow[]
  formData: Record<string, any>
  getFieldConfig: (fieldKey: string) => FormItemConfig | undefined
}

interface ResolveRowChangeOptions {
  tableData?: TableRow[]
  initialPatch?: Partial<TableRow>
  initialChanges?: InitialFieldChange[]
}

function createFieldChangeContext(
  rowIndex: number,
  row: TableRow,
  fieldKey: string,
  value: any,
  previousValue: any,
  tableData: TableRow[],
  formData: Record<string, any>
): FormTableFieldChangeContext {
  return {
    row,
    index: rowIndex,
    fieldKey,
    value,
    previousValue,
    tableData,
    formData: {
      ...formData,
      tableData
    },
    getValue: (path: string) => getValueByPath(row, path)
  }
}

export function createInitialFieldChanges(
  row: TableRow,
  fieldKeys: string[]
): InitialFieldChange[] {
  return fieldKeys.reduce<InitialFieldChange[]>((changes, fieldKey) => {
    const value = getValueByPath(row, fieldKey)
    if (value === undefined) {
      return changes
    }

    changes.push({
      fieldKey,
      value,
      previousValue: undefined
    })
    return changes
  }, [])
}

export function resolveRowChange(
  context: ResolveRowChangeContext,
  options: ResolveRowChangeOptions = {}
): ResolvedRowChange {
  const { rowIndex, currentRow, formData, getFieldConfig } = context
  let nextRow = currentRow
  const nextTableData = [...(options.tableData || context.tableData)]
  nextTableData[rowIndex] = nextRow
  const fieldChanges = new Map<string, FormTableFieldChangePayload>()
  const pendingChanges: FormTableFieldChangePayload[] = []

  const queueFieldChange = (fieldKey: string, value: any, previousValue: any) => {
    if (Object.is(previousValue, value)) {
      return
    }

    const currentChange = fieldChanges.get(fieldKey)
    const initialPreviousValue = currentChange?.previousValue ?? previousValue

    if (Object.is(initialPreviousValue, value)) {
      fieldChanges.delete(fieldKey)
    } else {
      fieldChanges.set(fieldKey, {
        row: nextRow,
        index: rowIndex,
        fieldKey,
        value,
        previousValue: initialPreviousValue
      })
    }

    pendingChanges.push({
      row: nextRow,
      index: rowIndex,
      fieldKey,
      value,
      previousValue
    })
  }

  const applyPatch = (patch?: Partial<TableRow>) => {
    if (!patch) {
      return
    }

    Object.keys(patch).forEach((fieldKey) => {
      const value = patch[fieldKey]
      const previousValue = getValueByPath(nextRow, fieldKey)

      if (Object.is(previousValue, value)) {
        return
      }

      nextRow = setValueByPath(nextRow, fieldKey, value)
      nextTableData[rowIndex] = nextRow
      queueFieldChange(fieldKey, value, previousValue)
    })
  }

  applyPatch(options.initialPatch)
  ;(options.initialChanges || []).forEach((change) => {
    queueFieldChange(change.fieldKey, change.value, change.previousValue)
  })

  let processedCount = 0
  const maxLinkedChanges = 100

  while (pendingChanges.length > 0 && processedCount < maxLinkedChanges) {
    const change = pendingChanges.shift()!
    const fieldConfig = getFieldConfig(change.fieldKey)
    const onValueChange = fieldConfig ? getFormItemOnValueChange(fieldConfig) : undefined

    if (!onValueChange) {
      processedCount += 1
      continue
    }

    const linkedPatch = onValueChange(
      createFieldChangeContext(
        rowIndex,
        nextRow,
        change.fieldKey,
        change.value,
        change.previousValue,
        nextTableData,
        formData
      )
    )

    if (linkedPatch) {
      applyPatch(linkedPatch)
    }
    processedCount += 1
  }

  if (pendingChanges.length > 0) {
    console.warn('[FormTable] onValueChange exceeded max linked update count, remaining changes were ignored.')
  }

  const resolvedFieldChanges = Array.from(fieldChanges.values()).map((change) => ({
    ...change,
    row: nextRow
  }))

  return {
    nextRow,
    fieldChanges: resolvedFieldChanges
  }
}
