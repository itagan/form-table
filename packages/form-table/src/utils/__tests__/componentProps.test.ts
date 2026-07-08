import { describe, expect, it, vi } from 'vitest'
import { processComponentProps } from '../componentProps'

describe('component props utils', () => {
  it('merges Element defaults, type defaults, render props and bind by priority', () => {
    const result = processComponentProps({
      type: 'textarea',
      rows: 2,
      placeholder: '透传占位',
      bind: {
        rows: 5,
        placeholder: '用户占位'
      }
    })

    expect(result.componentType).toBe('el-input')
    expect(result.componentProps).toMatchObject({
      clearable: true,
      type: 'textarea',
      rows: 5,
      placeholder: '用户占位'
    })
  })

  it('removes clearable from component types that should not receive it', () => {
    expect(processComponentProps({
      type: 'switch',
      bind: {
        clearable: true,
        activeValue: 'yes'
      }
    }).componentProps).toEqual({
      activeValue: 'yes'
    })
  })

  it('resolves registered custom components and keeps user bind props', () => {
    const CustomInput = { name: 'CustomInput' }
    const result = processComponentProps({
      type: 'custom',
      componentName: 'CustomInput',
      customComponents: {
        CustomInput
      },
      bind: {
        placeholder: '请输入'
      }
    })

    expect(result.componentType).toBe(CustomInput)
    expect(result.componentProps).toEqual({
      placeholder: '请输入'
    })
  })

  it('falls back to div and warns when a custom component is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const result = processComponentProps({
      type: 'custom',
      componentName: 'MissingInput',
      customComponents: {}
    })

    expect(result.componentType).toBe('div')
    expect(warnSpy).toHaveBeenCalledWith('Custom component "MissingInput" not found. Available:', [])

    warnSpy.mockRestore()
  })
})
