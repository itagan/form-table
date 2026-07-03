import type { ComputedRef, Ref } from 'vue'
import type {
  ColumnConfig,
  FormItemConfig,
  FormTableActions,
  FormTableBaseContext,
  FormTableFieldChangePayload,
  TableRow
} from '../types'
import { buildDefaultRow } from '../utils/dynamic'
import { createInitialFieldChanges, resolveRowChange } from '../utils/fieldChange'
import { applyRowPatch } from '../utils/path'
import {
  insertTableRow,
  moveTableRow,
  normalizeInsertIndex,
  removeTableRow
} from '../utils/rowActions'

interface FormTableRowsProps {
  tableData: TableRow[]
  formData: Record<string, any>
}

type FormTableBusinessEvent =
  | 'field-change'
  | 'row-add'
  | 'row-copy'
  | 'row-update'
  | 'row-move'
  | 'row-remove'

interface UseFormTableRowsOptions {
  props: FormTableRowsProps
  formRef: Ref<any>
  formTableContext: ComputedRef<FormTableBaseContext>
  visibleColumns: ComputedRef<ColumnConfig[]>
  getFieldConfigByKey: (fieldKey: string) => FormItemConfig | undefined
  getConfiguredFieldKeys: () => string[]
  getAllRowFieldProps: (rowIndex: number, tableData?: TableRow[]) => string[]
  getVisibleRowFieldProps: (rowIndex: number, tableData: TableRow[]) => string[]
  validateFieldProps: (fieldProp: string | string[]) => Promise<boolean>
  emitTableDataChange: (tableData: TableRow[]) => void
  scheduleHiddenFieldValidationCleanup: (tableData: TableRow[]) => void
  emitBusinessEvent: (type: FormTableBusinessEvent, ...args: any[]) => void
}

/**
 * Owns row mutations and field-change resolution.
 *
 * All editable surfaces eventually enter `commitRowChange`, including built-in
 * components, slots and custom components. `onValueChange` remains a synchronous
 * linked-patch model, matching the existing public behavior.
 */
export function useFormTableRows(options: UseFormTableRowsOptions) {
  const {
    props,
    formRef,
    formTableContext,
    visibleColumns,
    getFieldConfigByKey,
    getConfiguredFieldKeys,
    getAllRowFieldProps,
    getVisibleRowFieldProps,
    validateFieldProps,
    emitTableDataChange,
    scheduleHiddenFieldValidationCleanup,
    emitBusinessEvent
  } = options

  const commitRowChange = (rowIndex: number, patch: Partial<TableRow>) => {
    const currentRow = props.tableData[rowIndex]
    if (!currentRow) {
      return null
    }

    const resolved = resolveRowChange(
      {
        rowIndex,
        currentRow,
        tableData: props.tableData,
        formData: props.formData,
        getFieldConfig: getFieldConfigByKey
      },
      {
        initialPatch: patch
      }
    )

    if (resolved.fieldChanges.length === 0) {
      return resolved
    }

    const nextTableData = [...props.tableData]
    nextTableData[rowIndex] = resolved.nextRow
    emitTableDataChange(nextTableData)
    scheduleHiddenFieldValidationCleanup(nextTableData)
    resolved.fieldChanges.forEach((change) => {
      emitBusinessEvent('field-change', change as FormTableFieldChangePayload)
    })

    return resolved
  }

  const getRowFieldProps = (rowIndex: number) => {
    return getVisibleRowFieldProps(rowIndex, props.tableData)
  }

  const insertRow = (index: number, rowData?: Partial<TableRow>) => {
    const insertIndex = normalizeInsertIndex(index, props.tableData.length)
    const draftRow = buildDefaultRow(
      visibleColumns.value,
      formTableContext.value,
      insertIndex,
      rowData || {}
    )
    const insertResult = insertTableRow(props.tableData, insertIndex, draftRow)
    const { nextTableData } = insertResult
    const resolved = resolveRowChange(
      {
        rowIndex: insertIndex,
        currentRow: draftRow,
        tableData: props.tableData,
        formData: props.formData,
        getFieldConfig: getFieldConfigByKey
      },
      {
        tableData: nextTableData,
        initialChanges: createInitialFieldChanges(draftRow, getConfiguredFieldKeys())
      }
    )
    nextTableData[insertIndex] = resolved.nextRow
    emitTableDataChange(nextTableData)
    scheduleHiddenFieldValidationCleanup(nextTableData)
    emitBusinessEvent('row-add', resolved.nextRow, insertIndex)
  }

  const updateRow = (index: number, patch: Partial<TableRow>) => {
    if (!props.tableData[index]) {
      return
    }

    const resolved = commitRowChange(index, patch)
    if (!resolved || resolved.fieldChanges.length === 0) {
      return
    }

    emitBusinessEvent('row-update', resolved.nextRow, index)
  }

  const copyRow = (index: number, patch?: Partial<TableRow>) => {
    const sourceRow = props.tableData[index]
    if (!sourceRow) {
      return
    }

    const copiedRow = buildDefaultRow(
      visibleColumns.value,
      formTableContext.value,
      index + 1,
      applyRowPatch(sourceRow, patch || {})
    )
    const { insertIndex, nextTableData } = insertTableRow(props.tableData, index + 1, copiedRow)
    const resolved = resolveRowChange(
      {
        rowIndex: insertIndex,
        currentRow: copiedRow,
        tableData: props.tableData,
        formData: props.formData,
        getFieldConfig: getFieldConfigByKey
      },
      {
        tableData: nextTableData,
        initialChanges: createInitialFieldChanges(copiedRow, getConfiguredFieldKeys())
      }
    )
    nextTableData[insertIndex] = resolved.nextRow
    emitTableDataChange(nextTableData)
    scheduleHiddenFieldValidationCleanup(nextTableData)
    emitBusinessEvent('row-copy', resolved.nextRow, insertIndex)
  }

  const removeRow = (index: number) => {
    const removeResult = removeTableRow(props.tableData, index)
    if (!removeResult) {
      return
    }

    formRef.value?.clearValidate(getAllRowFieldProps(index))
    const { removedRow, nextTableData } = removeResult
    emitTableDataChange(nextTableData)
    scheduleHiddenFieldValidationCleanup(nextTableData)
    emitBusinessEvent('row-remove', removedRow, index)
  }

  const moveRow = (fromIndex: number, toIndex: number) => {
    const moveResult = moveTableRow(props.tableData, fromIndex, toIndex)
    if (!moveResult) {
      return
    }

    const { movedRow, normalizedToIndex, nextTableData } = moveResult
    emitTableDataChange(nextTableData)
    scheduleHiddenFieldValidationCleanup(nextTableData)
    emitBusinessEvent('row-move', movedRow, fromIndex, normalizedToIndex)
  }

  const formTableActions: FormTableActions = {
    addRow: (rowData?: Partial<TableRow>) => {
      insertRow(props.tableData.length, rowData)
    },
    insertRow,
    copyRow,
    updateRow,
    removeRow,
    moveRow,
    getRow: (index: number) => props.tableData[index],
    getRowFieldProps,
    validateField: validateFieldProps,
    validateRow: async (index: number) => {
      return await validateFieldProps(getRowFieldProps(index))
    },
    clearValidate: (fieldProps?: string | string[]) => {
      formRef.value?.clearValidate(fieldProps)
    },
    clearRowValidate: (index: number) => {
      formRef.value?.clearValidate(getAllRowFieldProps(index))
    }
  }

  return {
    commitRowChange,
    insertRow,
    updateRow,
    copyRow,
    removeRow,
    moveRow,
    getRowFieldProps,
    formTableActions
  }
}
