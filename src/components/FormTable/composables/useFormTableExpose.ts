import type { ComputedRef, Ref } from 'vue'
import type { FormTableActions, FormTableExpose, TableRow } from '../types'

type ValidateEvent = 'validate'
type UpdateFormDataEvent = 'update:formData'

interface UseFormTableExposeOptions {
  props: {
    tableData: TableRow[]
  }
  formRef: Ref<any>
  formModel: ComputedRef<Record<string, any>>
  formTableActions: FormTableActions
  validateFieldProps: (fieldProp: string | string[]) => Promise<boolean>
  emitTableDataChange: (tableData: TableRow[]) => void
  emitBusinessEvent: (
    type: ValidateEvent | UpdateFormDataEvent,
    ...args: any[]
  ) => void
  insertRow: (index: number, rowData?: Partial<TableRow>) => void
  copyRow: (index: number, patch?: Partial<TableRow>) => void
  updateRow: (index: number, patch: Partial<TableRow>) => void
  moveRow: (fromIndex: number, toIndex: number) => void
  removeRow: (index: number) => void
}

/**
 * Builds the public ref API exposed by FormTable.
 *
 * Keeping this object in one place makes the compatibility surface explicit:
 * callers still receive the same Element-UI-like methods while index.vue only
 * wires the implementation together.
 */
export function useFormTableExpose(options: UseFormTableExposeOptions): FormTableExpose {
  const {
    props,
    formRef,
    formModel,
    formTableActions,
    validateFieldProps,
    emitTableDataChange,
    emitBusinessEvent,
    insertRow,
    copyRow,
    updateRow,
    moveRow,
    removeRow
  } = options

  return {
    validate: async (callback?: (valid: boolean, errors: any[]) => void) => {
      try {
        const valid = await formRef.value?.validate()
        const errors: any[] = []
        emitBusinessEvent('validate', valid, errors)
        callback?.(valid, errors)
        return valid
      } catch (error) {
        const errors: any[] = Array.isArray(error) ? error : [error]
        emitBusinessEvent('validate', false, errors)
        callback?.(false, errors)
        return false
      }
    },

    resetFields: () => {
      formRef.value?.resetFields()
    },

    validateField: validateFieldProps,

    validateRow: async (index: number) => {
      return await formTableActions.validateRow(index)
    },

    clearValidate: formTableActions.clearValidate,

    addRow: formTableActions.addRow,

    insertRow,

    copyRow,

    updateRow,

    moveRow,

    getRow: formTableActions.getRow,

    removeRow,

    getFormData: () => ({
      ...formModel.value
    }),

    setFormData: (data: Record<string, any>) => {
      if (data.tableData) {
        emitTableDataChange(data.tableData)
      }
      emitBusinessEvent('update:formData', {
        ...data,
        tableData: data.tableData ?? props.tableData
      })
    }
  }
}
