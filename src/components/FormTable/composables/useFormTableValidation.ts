import { watch, type Ref } from 'vue'
import type { FormTableProps, TableRow } from '../types'
import { createValidationController } from '../utils/validation'

type FormTableValidationProps = Pick<FormTableProps, 'tableData' | 'columns' | 'formData'>

interface UseFormTableValidationOptions {
  props: FormTableValidationProps
  formRef: Ref<any>
  getAllRowFieldProps: (rowIndex: number, tableData?: TableRow[]) => string[]
  getVisibleRowFieldProps: (rowIndex: number, tableData: TableRow[]) => string[]
}

/**
 * 维护校验调度和隐藏字段错误清理策略。
 *
 * 隐藏字段会保留行数据里的原值，但会清理 Element UI 的校验状态，
 * 避免不可见字段的错误提示残留在界面或阻塞当前可见行校验。
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

  // tableData、columns、formData 都可能影响显隐条件，变化后统一延迟清理隐藏字段错误。
  watch(
    [() => props.tableData, () => props.columns, () => props.formData],
    ([tableData]) => {
      validationController.scheduleHiddenFieldValidationCleanup(tableData)
    },
    { immediate: true }
  )

  return validationController
}
