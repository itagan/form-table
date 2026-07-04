import { describe, expect, it, vi } from 'vitest'
import type { FormItemConfig, FormTableRuntimeContext } from '../../types'
import {
  getFormItemColSpan,
  getFormItemCustomComponent,
  getFormItemEmptyText,
  getFormItemFormatter,
  getFormItemListeners,
  getFormItemOnValueChange,
  getFormItemSlotName,
  isFormItemTooltipEnabled,
  resolveFormItemBind,
  resolveFormItemColProps,
  resolveFormItemDefaultValue,
  resolveFormItemOptionProps,
  resolveFormItemOptions,
  resolveFormItemTooltipProps,
  resolveFormItemVisible
} from '../fieldConfig'

const context: FormTableRuntimeContext = {
  row: {
    status: 'enabled',
    level: 'senior'
  },
  index: 1,
  fieldKey: 'status',
  formData: {
    disabled: true
  },
  tableData: []
}

describe('field config utils', () => {
  it('resolves dynamic visibility, bind, options and option props', () => {
    const item: FormItemConfig = {
      key: 'status',
      type: 'select',
      behavior: {
        visible: ({ row }) => row.status === 'enabled'
      },
      component: {
        bind: ({ formData }) => ({
          disabled: formData.disabled,
          placeholder: '请选择状态'
        }),
        options: ({ row }) => [
          { label: row.level, value: row.level }
        ],
        optionProps: () => ({
          label: 'name',
          value: 'id'
        })
      }
    }

    expect(resolveFormItemVisible(item, context)).toBe(true)
    expect(resolveFormItemBind(item, context)).toEqual({
      disabled: true,
      placeholder: '请选择状态'
    })
    expect(resolveFormItemOptions(item, context)).toEqual([
      { label: 'senior', value: 'senior' }
    ])
    expect(resolveFormItemOptionProps(item, context)).toEqual({
      label: 'name',
      value: 'id'
    })
  })

  it('returns undefined for empty col props and option props', () => {
    const item: FormItemConfig = {
      key: 'name',
      type: 'input',
      layout: {
        colProps: {}
      },
      component: {
        optionProps: {}
      }
    }

    expect(resolveFormItemColProps(item, context)).toBeUndefined()
    expect(resolveFormItemOptionProps(item, context)).toBeUndefined()
  })

  it('exposes structural getters with defaults', () => {
    const listener = vi.fn()
    const formatter = vi.fn()
    const onValueChange = vi.fn()
    const item: FormItemConfig = {
      key: 'school',
      type: 'slot',
      layout: {
        span: 12,
        colProps: {
          offset: 1
        }
      },
      component: {
        customComponent: 'SchoolSelect',
        slotName: 'school-slot',
        listeners: {
          change: listener
        }
      },
      display: {
        formatter,
        emptyText: '-',
        tooltip: {
          enabled: true,
          props: {
            placement: 'right'
          }
        }
      },
      behavior: {
        defaultValue: ({ row }: FormTableRuntimeContext) => row.level,
        onValueChange
      }
    }

    expect(getFormItemColSpan(item)).toBe(12)
    expect(resolveFormItemColProps(item, context)).toEqual({ offset: 1 })
    expect(getFormItemCustomComponent(item)).toBe('SchoolSelect')
    expect(getFormItemSlotName(item)).toBe('school-slot')
    expect(getFormItemListeners(item)).toEqual({ change: listener })
    expect(getFormItemFormatter(item)).toBe(formatter)
    expect(getFormItemEmptyText(item)).toBe('-')
    expect(isFormItemTooltipEnabled(item)).toBe(true)
    expect(resolveFormItemTooltipProps(item, context)).toEqual({ placement: 'right' })
    expect(resolveFormItemDefaultValue(item, context)).toBe('senior')
    expect(getFormItemOnValueChange(item)).toBe(onValueChange)
  })

  it('uses fallback values for omitted optional config groups', () => {
    const item: FormItemConfig = {
      key: 'name',
      type: 'input'
    }

    expect(getFormItemColSpan(item)).toBe(24)
    expect(resolveFormItemVisible(item, context)).toBe(true)
    expect(resolveFormItemBind(item, context)).toEqual({})
    expect(resolveFormItemOptions(item, context)).toBeUndefined()
    expect(getFormItemListeners(item)).toEqual({})
    expect(isFormItemTooltipEnabled(item)).toBe(false)
    expect(resolveFormItemTooltipProps(item, context)).toEqual({})
    expect(resolveFormItemDefaultValue(item, context)).toBeUndefined()
  })
})
