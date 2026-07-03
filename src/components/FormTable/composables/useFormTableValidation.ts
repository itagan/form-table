import { watch, type Ref } from 'vue'
import type { ColumnConfig, TableRow } from '../types'
import { createValidationController } from '../utils/validation'

interface FormTableValidationProps {
  tableData: TableRow[]
  columns: ColumnConfig[]
  formData: Record<string, any>
}

interface UseFormTableValidationOptions {
  props: FormTableValidationProps
  formRef: Ref<any>
  getAllRowFieldProps: (rowIndex: number, tableData?: TableRow[]) => string[]
  getVisibleRowFieldProps: (rowIndex: number, tableData: TableRow[]) => string[]
}

/**
 * Owns validation scheduling and the hidden-field cleanup policy.
 *
 * Hidden fields keep their values, but their Element UI validation state is
 * cleared after visibility changes so invisible errors do not linger.
 */
export function useFormTableValidation(options: UseFormTableValidationOptions) {
  const {
    props,
    formRef,
    getAllRowFieldProps,
    getVisibleRowFieldProps
  } = options

  const validationController = createValidationController({
    formRef,
    getAllRowFieldProps,
    getVisibleRowFieldProps
  })

  watch(
    [() => props.tableData, () => props.columns, () => props.formData],
    ([tableData]) => {
      validationController.scheduleHiddenFieldValidationCleanup(tableData)
    },
    { immediate: true }
  )

  return validationController
}
