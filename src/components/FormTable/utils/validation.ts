import { nextTick, type Ref } from 'vue'
import type { TableRow } from '../types'

interface ValidationControllerOptions {
  formRef: Ref<any>
  getAllRowFieldProps: (rowIndex: number, tableData?: TableRow[]) => string[]
  getVisibleRowFieldProps: (rowIndex: number, tableData: TableRow[]) => string[]
}

export function createValidationController(options: ValidationControllerOptions) {
  const { formRef, getAllRowFieldProps, getVisibleRowFieldProps } = options
  let pendingValidationCleanupTableData: TableRow[] | null = null
  let isValidationCleanupScheduled = false

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
