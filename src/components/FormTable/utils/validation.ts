import { nextTick, type Ref } from 'vue'
import type { TableRow } from '../types'

/**
 * 校验控制器依赖。
 *
 * 字段路径计算由主组件提供，控制器只负责调度和调用 el-form API。
 */
interface ValidationControllerOptions {
  formRef: Ref<any>
  getAllRowFieldProps: (rowIndex: number, tableData?: TableRow[]) => string[]
  getVisibleRowFieldProps: (rowIndex: number, tableData: TableRow[]) => string[]
}

/**
 * 创建 FormTable 的校验控制器。
 *
 * 负责三件事：
 * - 清理隐藏字段上残留的 Element UI 校验状态。
 * - 把多次清理请求合并到同一个 nextTick。
 * - 将 `validateField` 包装成 Promise<boolean>。
 */
export function createValidationController(options: ValidationControllerOptions) {
  const { formRef, getAllRowFieldProps, getVisibleRowFieldProps } = options
  let pendingValidationCleanupTableData: TableRow[] | null = null
  let isValidationCleanupScheduled = false

  /**
   * 清理当前不可见字段的校验状态。
   *
   * 当字段由 visible 控制隐藏时，Element UI 不会自动清除错误提示，
   * 这里通过全量字段路径和可见字段路径的差集来定位需要清理的字段。
   */
  const clearHiddenFieldValidations = (tableData: TableRow[]) => {
    const hiddenFieldProps = tableData.reduce<string[]>((propsList, _row, rowIndex) => {
      const allFieldProps = getAllRowFieldProps(rowIndex, tableData)
      const visibleFieldProps = new Set(getVisibleRowFieldProps(rowIndex, tableData))

      allFieldProps.forEach((fieldProp) => {
        if (!visibleFieldProps.has(fieldProp)) {
          propsList.push(fieldProp)
        }
      })

      return propsList
    }, [])

    if (hiddenFieldProps.length > 0) {
      formRef.value?.clearValidate(hiddenFieldProps)
    }
  }

  /**
   * 延迟清理隐藏字段校验。
   *
   * 表格数据和显隐条件可能在同一次更新中连续变化，使用 nextTick 合并请求，
   * 并始终以最后一次传入的 tableData 为准。
   */
  const scheduleHiddenFieldValidationCleanup = (tableData: TableRow[]) => {
    pendingValidationCleanupTableData = tableData
    if (isValidationCleanupScheduled) {
      return
    }

    isValidationCleanupScheduled = true
    nextTick(() => {
      isValidationCleanupScheduled = false
      const cleanupTableData = pendingValidationCleanupTableData
      pendingValidationCleanupTableData = null

      if (cleanupTableData) {
        clearHiddenFieldValidations(cleanupTableData)
      }
    })
  }

  /**
   * 校验一个或多个字段路径。
   *
   * Element UI 的 `validateField` 使用 callback 返回错误信息，
   * 这里统一转换为 Promise<boolean>，供 ref 方法和 slot actions 复用。
   */
  const validateFieldProps = async (fieldProp: string | string[]) => {
    const fieldProps = Array.isArray(fieldProp) ? fieldProp : [fieldProp]
    if (fieldProps.length === 0 || !formRef.value?.validateField) {
      return true
    }

    try {
      await Promise.all(fieldProps.map((prop) => {
        return new Promise<void>((resolve, reject) => {
          formRef.value?.validateField(prop, (message: string) => {
            if (message) {
              reject(new Error(message))
              return
            }

            resolve()
          })
        })
      }))
      return true
    } catch {
      return false
    }
  }

  return {
    clearHiddenFieldValidations,
    scheduleHiddenFieldValidationCleanup,
    validateFieldProps
  }
}
