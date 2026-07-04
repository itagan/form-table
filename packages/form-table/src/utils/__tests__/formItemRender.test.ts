import { describe, expect, it, vi } from 'vitest'
import type { FormItemConfig, FormTableActions, ValidationRule } from '../../types'
import {
  createComponentWrapperProps,
  createFormTableSlotContext,
  hasFormItemTooltipContent,
  mergeFormItemRules,
  normalizeFormItemLabelWidth,
  resolveFormItemTooltipContent
} from '../formItemRender'

function createActions(): FormTableActions {
  return {
    addRow: vi.fn(),
    insertRow: vi.fn(),
    copyRow: vi.fn(),
    updateRow: vi.fn(),
    removeRow: vi.fn(),
    moveRow: vi.fn(),
    getRow: vi.fn(),
    getRowFieldProps: vi.fn(),
    validateField: vi.fn(async () => true),
    validateRow: vi.fn(async () => true),
    clearValidate: vi.fn(),
    clearRowValidate: vi.fn()
  }
}

describe('form item render utils', () => {
  it('normalizes Element UI auto label width for table cells', () => {
    expect(normalizeFormItemLabelWidth('auto')).toBeUndefined()
    expect(normalizeFormItemLabelWidth('120px')).toBe('120px')
    expect(normalizeFormItemLabelWidth()).toBeUndefined()
  })

  it('detects whether tooltip has displayable raw content', () => {
    expect(hasFormItemTooltipContent('text')).toBe(true)
    expect(hasFormItemTooltipContent(0)).toBe(true)
    expect(hasFormItemTooltipContent(false)).toBe(true)
    expect(hasFormItemTooltipContent('')).toBe(false)
    expect(hasFormItemTooltipContent(null)).toBe(false)
    expect(hasFormItemTooltipContent(undefined)).toBe(false)
  })

  it('resolves tooltip content with formatter, options and empty text', () => {
    expect(resolveFormItemTooltipContent({
      value: 'enabled',
      options: [
        { label: '启用', value: 'enabled' }
      ],
      context: {
        row: { status: 'enabled' },
        index: 0,
        fieldKey: 'status',
        formData: {},
        tableData: []
      }
    })).toBe('启用')

    expect(resolveFormItemTooltipContent({
      value: 'enabled',
      formatter: (value) => `状态:${value}`,
      context: {
        row: { status: 'enabled' },
        index: 0,
        fieldKey: 'status',
        formData: {},
        tableData: []
      }
    })).toBe('状态:enabled')

    expect(resolveFormItemTooltipContent({
      value: '',
      emptyText: '-',
      context: {
        row: { status: '' },
        index: 0,
        fieldKey: 'status',
        formData: {},
        tableData: []
      }
    })).toBe('-')
  })

  it('merges inherited and local validation rules and omits empty rule lists', () => {
    const inheritedRule: ValidationRule = { required: true, message: '请输入姓名' }
    const localRule: ValidationRule = { min: 2, message: '至少两个字符' }

    expect(mergeFormItemRules({
      formRules: {
        'tableData.*.name': [inheritedRule]
      },
      propPath: 'tableData.1.name',
      localRules: [localRule]
    })).toEqual([inheritedRule, localRule])

    expect(mergeFormItemRules({
      formRules: {},
      propPath: 'tableData.1.name'
    })).toBeUndefined()
  })

  it('creates ComponentWrapper props from field config and resolved dynamic values', () => {
    const listener = vi.fn()
    const formatter = vi.fn()
    const config: FormItemConfig = {
      key: 'phone',
      type: 'custom',
      label: '手机号',
      layout: {
        span: 12
      },
      component: {
        customComponent: 'PhoneInput',
        listeners: {
          commit: listener
        }
      },
      display: {
        formatter,
        emptyText: '-'
      },
      behavior: {
        visible: true
      }
    }
    const row = { phone: '13800138000' }

    expect(createComponentWrapperProps({
      config,
      row,
      rowIndex: 2,
      bind: {
        placeholder: '请输入手机号'
      },
      options: [{ label: '默认', value: 'default' }],
      optionProps: { label: 'name', value: 'id' }
    })).toEqual({
      type: 'custom',
      fieldKey: 'phone',
      row,
      rowIndex: 2,
      customComponent: 'PhoneInput',
      bind: {
        placeholder: '请输入手机号'
      },
      options: [{ label: '默认', value: 'default' }],
      optionProps: { label: 'name', value: 'id' },
      listeners: {
        commit: listener
      },
      formatter,
      emptyText: '-'
    })
  })

  it('creates slot context helpers bound to the current row and prop path', async () => {
    const actions = createActions()
    const row = { school: '县一小' }
    const setValue = vi.fn()
    const updateRow = vi.fn()
    const slotContext = createFormTableSlotContext({
      row,
      rowIndex: 1,
      propPath: 'tableData.1.school',
      config: {
        key: 'school',
        type: 'slot'
      },
      formTableContext: {
        formData: { mode: 'edit' },
        tableData: [{ school: '县二中' }, row, { school: '市一中' }]
      },
      actions,
      setValue,
      updateRow
    })

    expect(slotContext).toMatchObject({
      row,
      index: 1,
      rowCount: 3,
      isFirstRow: false,
      isLastRow: false,
      fieldKey: 'school',
      propPath: 'tableData.1.school',
      value: '县一小',
      formData: { mode: 'edit' }
    })
    expect(slotContext.tableData).toHaveLength(3)

    slotContext.setValue('县三小')
    slotContext.updateRow({ school: '县四小' })
    slotContext.removeCurrentRow()
    slotContext.copyCurrentRow({ school: '复制' })
    slotContext.insertBefore({ school: '前' })
    slotContext.insertAfter({ school: '后' })
    slotContext.moveCurrentRow(0)
    slotContext.moveUp()
    slotContext.moveDown()
    await slotContext.validateCurrentField()
    await slotContext.validateCurrentRow()
    slotContext.clearCurrentFieldValidate()
    slotContext.clearCurrentRowValidate()

    expect(setValue).toHaveBeenCalledWith('县三小')
    expect(updateRow).toHaveBeenCalledWith({ school: '县四小' })
    expect(actions.removeRow).toHaveBeenCalledWith(1)
    expect(actions.copyRow).toHaveBeenCalledWith(1, { school: '复制' })
    expect(actions.insertRow).toHaveBeenCalledWith(1, { school: '前' })
    expect(actions.insertRow).toHaveBeenCalledWith(2, { school: '后' })
    expect(actions.moveRow).toHaveBeenCalledWith(1, 0)
    expect(actions.moveRow).toHaveBeenCalledWith(1, 0)
    expect(actions.moveRow).toHaveBeenCalledWith(1, 2)
    expect(actions.validateField).toHaveBeenCalledWith('tableData.1.school')
    expect(actions.validateRow).toHaveBeenCalledWith(1)
    expect(actions.clearValidate).toHaveBeenCalledWith('tableData.1.school')
    expect(actions.clearRowValidate).toHaveBeenCalledWith(1)
  })
})
