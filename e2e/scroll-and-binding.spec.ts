import type { Page } from '@playwright/test'
import { expect, field, test } from './fixtures'

const scrollLeft = (page: Page) => page.locator('.el-table__body-wrapper').evaluate(element => element.scrollLeft)

test('moves the wide table horizontally without moving the page vertically', async ({ page }) => {
  await page.goto('/horizontal-scroll')
  const initialPageTop = await page.evaluate(() => window.scrollY)

  await page.getByRole('button', { name: '滚到末列' }).click()
  await expect(page.getByTestId('scroll-status')).toHaveText('已滚动到末列')
  await expect.poll(() => scrollLeft(page)).toBeGreaterThan(0)
  expect(await page.evaluate(() => window.scrollY)).toBe(initialPageTop)

  await page.getByRole('button', { name: '定位配送地址' }).click()
  await expect(page.getByTestId('scroll-status')).toHaveText('已将配送地址字段滚动到可视区域中央')
  await expect(field(page, 'tableData.0.address')).toBeInViewport()

  await page.getByRole('button', { name: '滚到首列' }).click()
  await expect.poll(() => scrollLeft(page)).toBeLessThanOrEqual(1)
})

test('updates object mappings together and applies date fallbacks', async ({ page }) => {
  await page.goto('/composite-binding')
  const contact = field(page, 'tableData.0.contactName')
  await contact.getByPlaceholder('联系人').fill('Bob')
  await contact.getByPlaceholder('联系电话').fill('13900000000')

  const data = page.getByTestId('composite-binding-data')
  await expect(data).toContainText('"contactName": "Bob"')
  await expect(data).toContainText('"contactPhone": "13900000000"')

  const date = field(page, 'tableData.0.startDate').locator('.el-date-editor')
  await date.hover()
  await date.locator('.el-range__close-icon').click()
  await expect(data).toContainText('"startDate": ""')
  await expect(data).toContainText('"endDate": ""')
})
