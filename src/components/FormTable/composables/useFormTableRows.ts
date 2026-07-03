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
 * 负责行数据变更、字段联动和行操作事件。
 *
 * 内置组件、slot 和自定义组件的编辑都会收口到 `commitRowChange`；
 * `behavior.onValueChange` 保持同步 patch 模型，不在这里引入异步队列。
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

  /**
   * 提交单行 patch。
   *
   * patch key 支持 `profile.city` 路径写法；resolveRowChange 会应用初始 patch、
   * 继续执行同步字段联动，并返回最终行数据和需要派发的字段变更。
   */
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

    // 字段联动可能一次改变多个字段，这里逐条派发最终去重后的 field-change。
    resolved.fieldChanges.forEach((change) => {
      emitBusinessEvent('field-change', change as FormTableFieldChangePayload)
    })

    return resolved
  }

  // 行级校验只校验当前可见字段，隐藏字段的残留错误由 validation cleanup 处理。
  const getRowFieldProps = (rowIndex: number) => {
    return getVisibleRowFieldProps(rowIndex, props.tableData)
  }

  /**
   * 插入新行。
   *
   * 新行先根据当前可见 columns 补默认值，再把已有值作为初始化变更触发联动，
   * 这样新增、复制和用户手动编辑都遵守同一套字段联动规则。
   */
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

  // 对外 updateRow 复用字段提交入口，因此也会触发路径 patch、联动和 field-change。
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

  /**
   * 复制行。
   *
   * patch 会先覆盖源行，再重新走默认值和初始化联动；这比直接插入源行副本更接近
   * “新建一行但预填已有数据”的业务语义。
   */
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

  // 删除前先清理原行字段校验，避免 Element UI 在索引变化后保留旧路径错误。
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

  // 行移动后校验路径中的 rowIndex 会变化，因此需要重新调度隐藏字段校验清理。
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

  // provide 给字段、slot 和自定义组件的动作集合，也作为 ref API 的实现来源。
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
