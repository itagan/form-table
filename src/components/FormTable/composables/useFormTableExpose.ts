import type { ComputedRef, Ref } from 'vue'
import type {
  FormTableActions,
  FormTableElementFormRef,
  FormTableEmits,
  FormTableExpose,
  FormTableRecord,
  FormTableValidationErrors,
  TableRow
} from '../types'

type ValidateEvent = 'validate'
type UpdateFormDataEvent = 'update:formData'
type FormTableExposeEventName = ValidateEvent | UpdateFormDataEvent

interface UseFormTableExposeOptions {
  props: {
    tableData: TableRow[]
  }
  formRef: Ref<FormTableElementFormRef | null>
  formModel: ComputedRef<FormTableRecord>
  formTableActions: FormTableActions
  validateFieldProps: (fieldProp: string | string[]) => Promise<boolean>
  emitTableDataChange: (tableData: TableRow[]) => void
  emitBusinessEvent: <K extends FormTableExposeEventName>(
    type: K,
    ...args: FormTableEmits[K]
  ) => void
  insertRow: (index: number, rowData?: Partial<TableRow>) => void
  copyRow: (index: number, patch?: Partial<TableRow>) => void
  updateRow: (index: number, patch: Partial<TableRow>) => void
  moveRow: (fromIndex: number, toIndex: number) => void
  removeRow: (index: number) => void
}

/**
 * 构造 FormTable 通过 ref 暴露给业务侧的公开方法。
 *
 * 这里集中维护兼容面：业务侧仍拿到接近 Element UI Form 的方法，
 * 同时附带表格行操作；index.vue 只负责把依赖组装进来。
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
    // validate 保持 Element UI callback 风格，同时返回 Promise<boolean> 方便 await。
    validate: async (callback?: (valid: boolean, errors: FormTableValidationErrors) => void) => {
      try {
        const valid = await formRef.value?.validate?.()
        const errors: FormTableValidationErrors = []
        const normalizedValid = Boolean(valid)
        emitBusinessEvent('validate', normalizedValid, errors)
        callback?.(normalizedValid, errors)
        return normalizedValid
      } catch (error) {
        const errors: FormTableValidationErrors = Array.isArray(error) ? error : [error]
        emitBusinessEvent('validate', false, errors)
        callback?.(false, errors)
        return false
      }
    },

    resetFields: () => {
      formRef.value?.resetFields?.()
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

    // setFormData 会同步 tableData；没有传 tableData 时保留当前行数据。
    setFormData: (data: FormTableRecord) => {
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
