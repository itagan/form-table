import type { Page } from '@playwright/test'
import { expect, field, test } from './fixtures'

const readJson = async <T>(page: Page, testId: string): Promise<T> => {
  const content = await page.getByTestId(testId).textContent()
  return JSON.parse(content || 'null') as T
}

test.beforeEach(async ({ page }) => {
  await page.goto('/form-table')
  await expect(page.getByRole('heading', { name: '基础表格表单' })).toBeVisible()
})

test('loads the built package entry and its explicit stylesheet', async ({ page }) => {
  const resources = await page.evaluate(() => (
    performance.getEntriesByType('resource').map(entry => entry.name)
  ))
  expect(resources.some(resource => /\/formtable\.es\.[^/]+\.js$/.test(resource))).toBe(true)

  const styles = await field(page, 'tableData.0.name').evaluate(element => {
    const layout = element.closest('.form-table-field-layout')
    return {
      itemMargin: getComputedStyle(element).marginBottom,
      layoutWrap: layout ? getComputedStyle(layout).flexWrap : ''
    }
  })
  expect(styles).toEqual({ itemMargin: '0px', layoutWrap: 'wrap' })
})

test('writes rapid field edits through the controlled table model', async ({ page }) => {
  const name = field(page, 'tableData.0.name').locator('input')
  await name.fill('第一次输入')
  await name.fill('最终姓名')

  const age = field(page, 'tableData.0.age').locator('input')
  await age.fill('27')

  const school = field(page, 'tableData.0.school')
  await school.locator('input').click()
  await page.locator('.el-select-dropdown:visible').getByText('市一中', { exact: true }).click()

  await expect.poll(async () => readJson<Array<Record<string, unknown>>>(page, 'basic-table-data'))
    .toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '最终姓名', age: 27, school: 'city-middle' })
    ]))
})

test('shows and clears validation across dynamic row removal', async ({ page }) => {
  const firstName = field(page, 'tableData.0.name').locator('input')
  await firstName.fill('')
  await page.getByRole('button', { name: '校验', exact: true }).click()
  await expect(field(page, 'tableData.0.name').getByText('请输入姓名')).toBeVisible()

  await firstName.fill('修复姓名')
  await firstName.blur()
  await expect(field(page, 'tableData.0.name').locator('.el-form-item__error')).toHaveCount(0)

  await page.getByRole('button', { name: '添加行' }).click()
  await page.getByRole('button', { name: '校验', exact: true }).click()
  await expect(field(page, 'tableData.2.name').getByText('请输入姓名')).toBeVisible()

  await page.getByRole('button', { name: '删除末行' }).click()
  await expect(field(page, 'tableData.2.name')).toHaveCount(0)
  await expect(page.locator('.el-form-item__error')).toHaveCount(0)
})
