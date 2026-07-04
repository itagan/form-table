import type {
  ComponentBind,
  FormItemConfig,
  FormItemOption,
  FormTableActions,
  FormTableBaseContext,
  FormTableRecord,
  FormTableSlotContext,
  FormTableValue,
  OptionPropsConfig,
  ValidationRule
} from '../types'
import {
  getFormItemCustomComponent,
  getFormItemEmptyText,
  getFormItemFormatter,
  getFormItemListeners
} from './fieldConfig'
import { getValueByPath } from './path'
import { resolveRulesForProp } from './rules'

export function normalizeFormItemLabelWidth(labelWidth?: string) {
  return labelWidth === 'auto' ? undefined : labelWidth
}

export function mergeFormItemRules(options: {
  formRules: Record<string, ValidationRule[]>
  propPath: string
  localRules?: ValidationRule[]
}) {
  const inheritedRules = resolveRulesForProp(options.formRules, options.propPath)
  const localRules = options.localRules || []
  const mergedRules = [...inheritedRules, ...localRules]

  return mergedRules.length > 0 ? mergedRules : undefined
}

export function createComponentWrapperProps(options: {
  config: FormItemConfig
  row: FormTableRecord
  rowIndex: number
  bind: ComponentBind
  options?: FormItemOption[]
  optionProps?: OptionPropsConfig
}) {
  return {
    type: options.config.type,
    fieldKey: options.config.key,
    row: options.row,
    rowIndex: options.rowIndex,
    customComponent: getFormItemCustomComponent(options.config),
    bind: options.bind,
    options: options.options,
    optionProps: options.optionProps,
    listeners: getFormItemListeners(options.config),
    formatter: getFormItemFormatter(options.config),
    emptyText: getFormItemEmptyText(options.config)
  }
}

export function createFormTableSlotContext(options: {
  row: FormTableRecord
  rowIndex: number
  config: FormItemConfig
  propPath: string
  formTableContext: FormTableBaseContext
  actions: FormTableActions
  setValue: (value: FormTableValue) => void
  updateRow: (patch: Partial<FormTableRecord>) => void
}): FormTableSlotContext {
  const { row, rowIndex, config, propPath, formTableContext, actions, setValue, updateRow } = options

  return {
    row,
    index: rowIndex,
    rowCount: formTableContext.tableData.length,
    isFirstRow: rowIndex === 0,
    isLastRow: rowIndex === formTableContext.tableData.length - 1,
    fieldKey: config.key,
    propPath,
    value: getValueByPath(row, config.key),
    formData: formTableContext.formData,
    tableData: formTableContext.tableData,
    setValue,
    updateRow,
    removeCurrentRow: () => actions.removeRow(rowIndex),
    copyCurrentRow: (patch?: Partial<FormTableRecord>) => actions.copyRow(rowIndex, patch),
    insertBefore: (rowData?: Partial<FormTableRecord>) => actions.insertRow(rowIndex, rowData),
    insertAfter: (rowData?: Partial<FormTableRecord>) => actions.insertRow(rowIndex + 1, rowData),
    moveCurrentRow: (toIndex: number) => actions.moveRow(rowIndex, toIndex),
    moveUp: () => actions.moveRow(rowIndex, rowIndex - 1),
    moveDown: () => actions.moveRow(rowIndex, rowIndex + 1),
    validateCurrentField: async () => await actions.validateField(propPath),
    validateCurrentRow: async () => await actions.validateRow(rowIndex),
    clearCurrentFieldValidate: () => actions.clearValidate(propPath),
    clearCurrentRowValidate: () => actions.clearRowValidate(rowIndex)
  }
}
