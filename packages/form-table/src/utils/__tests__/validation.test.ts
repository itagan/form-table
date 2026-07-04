import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createValidationController } from '../validation'

describe('validation controller', () => {
  it('clears validations for hidden field props', () => {
    const clearValidate = vi.fn()
    const controller = createValidationController({
      formRef: ref({ clearValidate }),
      getAllRowFieldProps: (rowIndex) => [
        `tableData.${rowIndex}.name`,
        `tableData.${rowIndex}.remark`
      ],
      getVisibleRowFieldProps: (rowIndex) => [
        `tableData.${rowIndex}.name`
      ]
    })

    controller.clearHiddenFieldValidations([{ name: 'A' }, { name: 'B' }])

    expect(clearValidate).toHaveBeenCalledWith([
      'tableData.0.remark',
      'tableData.1.remark'
    ])
  })

  it('does not clear validations when all fields are visible', () => {
    const clearValidate = vi.fn()
    const controller = createValidationController({
      formRef: ref({ clearValidate }),
      getAllRowFieldProps: (rowIndex) => [`tableData.${rowIndex}.name`],
      getVisibleRowFieldProps: (rowIndex) => [`tableData.${rowIndex}.name`]
    })

    controller.clearHiddenFieldValidations([{ name: 'A' }])

    expect(clearValidate).not.toHaveBeenCalled()
  })

  it('coalesces scheduled hidden-field cleanup to the latest table data', async () => {
    const clearValidate = vi.fn()
    const controller = createValidationController({
      formRef: ref({ clearValidate }),
      getAllRowFieldProps: (rowIndex, tableData = []) => {
        return Object.keys(tableData[rowIndex] || {}).map((key) => `tableData.${rowIndex}.${key}`)
      },
      getVisibleRowFieldProps: (rowIndex) => [`tableData.${rowIndex}.name`]
    })

    controller.scheduleHiddenFieldValidationCleanup([{ name: 'A', stale: true }])
    controller.scheduleHiddenFieldValidationCleanup([{ name: 'B', remark: 'latest' }])
    await nextTick()

    expect(clearValidate).toHaveBeenCalledTimes(1)
    expect(clearValidate).toHaveBeenCalledWith(['tableData.0.remark'])
  })

  it('wraps validateField callbacks as boolean promises', async () => {
    const controller = createValidationController({
      formRef: ref({
        validateField: (prop, callback) => {
          callback(prop === 'tableData.0.name' ? '' : 'invalid')
        }
      }),
      getAllRowFieldProps: () => [],
      getVisibleRowFieldProps: () => []
    })

    await expect(controller.validateFieldProps('tableData.0.name')).resolves.toBe(true)
    await expect(controller.validateFieldProps('tableData.0.age')).resolves.toBe(false)
  })

  it('treats empty field lists or missing validateField as valid', async () => {
    const controller = createValidationController({
      formRef: ref({}),
      getAllRowFieldProps: () => [],
      getVisibleRowFieldProps: () => []
    })

    await expect(controller.validateFieldProps([])).resolves.toBe(true)
    await expect(controller.validateFieldProps('tableData.0.name')).resolves.toBe(true)
  })
})
