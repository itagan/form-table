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

  it('clears nested hidden field props for every remaining row', () => {
    const clearValidate = vi.fn()
    const controller = createValidationController({
      formRef: ref({ clearValidate }),
      getAllRowFieldProps: (rowIndex) => [
        `tableData.${rowIndex}.name`,
        `tableData.${rowIndex}.profile.city`,
        `tableData.${rowIndex}.profile.address`
      ],
      getVisibleRowFieldProps: (rowIndex) => [
        `tableData.${rowIndex}.name`,
        `tableData.${rowIndex}.profile.city`
      ]
    })

    controller.clearHiddenFieldValidations([
      { name: 'A', profile: { city: '杭州', address: '' } },
      { name: 'B', profile: { city: '上海', address: '' } }
    ])

    expect(clearValidate).toHaveBeenCalledWith([
      'tableData.0.profile.address',
      'tableData.1.profile.address'
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

  it('uses latest row indexes after rows are removed before scheduled cleanup runs', async () => {
    const clearValidate = vi.fn()
    const controller = createValidationController({
      formRef: ref({ clearValidate }),
      getAllRowFieldProps: (rowIndex, tableData = []) => {
        const row = tableData[rowIndex] || {}
        return Object.keys(row).map((key) => `tableData.${rowIndex}.${key}`)
      },
      getVisibleRowFieldProps: (rowIndex, tableData = []) => {
        const row = tableData[rowIndex] || {}
        return Object.keys(row)
          .filter((key) => key !== 'removedOnly' && key !== 'hidden')
          .map((key) => `tableData.${rowIndex}.${key}`)
      }
    })

    controller.scheduleHiddenFieldValidationCleanup([
      { id: 1, name: 'A', removedOnly: true },
      { id: 2, name: 'B', hidden: true }
    ])
    controller.scheduleHiddenFieldValidationCleanup([
      { id: 2, name: 'B', hidden: true }
    ])
    await nextTick()

    expect(clearValidate).toHaveBeenCalledTimes(1)
    expect(clearValidate).toHaveBeenCalledWith(['tableData.0.hidden'])
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

  it('validates multiple field props and returns false when any field fails', async () => {
    const validateField = vi.fn((prop, callback) => {
      callback(prop === 'tableData.0.profile.city' ? 'invalid city' : '')
    })
    const controller = createValidationController({
      formRef: ref({ validateField }),
      getAllRowFieldProps: () => [],
      getVisibleRowFieldProps: () => []
    })

    await expect(controller.validateFieldProps([
      'tableData.0.name',
      'tableData.0.profile.city'
    ])).resolves.toBe(false)
    expect(validateField).toHaveBeenCalledWith('tableData.0.name', expect.any(Function))
    expect(validateField).toHaveBeenCalledWith('tableData.0.profile.city', expect.any(Function))
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
