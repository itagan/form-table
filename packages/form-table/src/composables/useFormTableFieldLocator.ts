import { nextTick } from 'vue'
import type { Ref } from 'vue'
import type {
  FormTableElementFormRef,
  FormTableRowKey,
  TableRow
} from '../types'
import {
  createRowIdentityIndex,
  isConfiguredRowKey,
  resolveRowIdentityIndex
} from '../utils/rowIdentity'

export const FORM_TABLE_FIELD_PROP_ATTRIBUTE = 'data-form-table-field-prop'

const FOCUSABLE_SELECTOR = [
  'input:not([disabled]):not([readonly])',
  'textarea:not([disabled]):not([readonly])',
  'select:not([disabled])',
  'button:not([disabled])',
  '[contenteditable="true"]:not([aria-disabled="true"])',
  '[tabindex]:not([tabindex="-1"]):not([aria-disabled="true"])'
].join(',')

interface FormTableFieldLocatorOptions<TRow extends TableRow> {
  getTableData: () => TRow[]
  getRowKey: () => FormTableRowKey<TRow> | undefined
  containerRef: Readonly<Ref<HTMLElement | null>>
  formRef: Readonly<Ref<FormTableElementFormRef | null>>
}

/** 将业务行和字段路径映射到当前挂载的 FormItem，并提供校验、滚动和聚焦操作。 */
export function useFormTableFieldLocator<TRow extends TableRow = TableRow>(
  options: FormTableFieldLocatorOptions<TRow>
) {
  const warnedReasons = new Set<string>()

  const warnOnce = (reason: string, message: string) => {
    if (!import.meta.env.DEV || warnedReasons.has(reason)) return
    warnedReasons.add(reason)
    console.warn(message)
  }

  const resolveRowIndex = (row: TRow) => {
    const tableData = options.getTableData()
    const rowKey = options.getRowKey()
    if (isConfiguredRowKey(rowKey)) {
      const index = resolveRowIdentityIndex(createRowIdentityIndex(tableData, rowKey), row, rowKey)
      if (index < 0) {
        warnOnce(
          'row-identity',
          '[FormTable] Field target could not be resolved because its row identity is missing or duplicated.'
        )
      }
      return index
    }

    const index = tableData.indexOf(row)
    if (index < 0) {
      warnOnce(
        'row-reference',
        '[FormTable] Field target could not be resolved by row reference; configure rowKey for stale row references.'
      )
    }
    return index
  }

  const resolvePropPath = (row: TRow, fieldKey: string) => {
    const rowIndex = resolveRowIndex(row)
    if (rowIndex < 0) return undefined
    return `tableData.${rowIndex}.${fieldKey}`
  }

  const getMountedFields = () => {
    const container = options.containerRef.value
    if (!container) return []
    return Array.from(container.querySelectorAll<HTMLElement>(`[${FORM_TABLE_FIELD_PROP_ATTRIBUTE}]`))
      .filter(element => element.closest('[data-form-table-hint-root]') === container)
  }

  const findFieldElementByProp = (propPath: string) => getMountedFields().find(
    element => element.getAttribute(FORM_TABLE_FIELD_PROP_ATTRIBUTE) === propPath
  )

  const resolveMountedField = (row: TRow, fieldKey: string) => {
    const propPath = resolvePropPath(row, fieldKey)
    if (!propPath) return undefined
    const element = findFieldElementByProp(propPath)
    if (!element) {
      warnOnce(
        'field-unmounted',
        '[FormTable] Field target exists in tableData but its FormItem is not currently mounted.'
      )
      return undefined
    }
    return { propPath, element }
  }

  const findFocusable = (element: HTMLElement) => {
    if (element.matches(FOCUSABLE_SELECTOR)) return element
    return element.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) || undefined
  }

  const focusElement = (element: HTMLElement) => {
    const target = findFocusable(element)
    if (!target) return false
    target.focus()
    return document.activeElement === target
  }

  const getFieldProp = (row: TRow, fieldKey: string) => (
    resolveMountedField(row, fieldKey)?.propPath
  )

  const validateField = async (row: TRow, fieldKey: string) => {
    const propPath = getFieldProp(row, fieldKey)
    const validate = options.formRef.value?.validateField
    if (!propPath || !validate) return false
    return new Promise<boolean>((resolve) => {
      try {
        validate.call(options.formRef.value, propPath, message => resolve(!message))
      } catch {
        resolve(false)
      }
    })
  }

  const clearFieldValidate = (row: TRow, fieldKey: string) => {
    const propPath = getFieldProp(row, fieldKey)
    if (propPath) options.formRef.value?.clearValidate?.(propPath)
  }

  const focusField = async (row: TRow, fieldKey: string) => {
    await nextTick()
    const target = resolveMountedField(row, fieldKey)
    return target ? focusElement(target.element) : false
  }

  const scrollToFirstError = async () => {
    await nextTick()
    const element = getMountedFields().find(field => field.classList.contains('is-error'))
    if (!element) return false
    element.scrollIntoView?.({ block: 'center', inline: 'nearest' })
    focusElement(element)
    return true
  }

  return {
    getFieldProp,
    validateField,
    clearFieldValidate,
    focusField,
    scrollToFirstError,
    getMountedFields,
    focusElement
  }
}
