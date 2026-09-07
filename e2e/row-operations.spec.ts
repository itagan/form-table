import type { Page } from '@playwright/test'
import { expect, field, test } from './fixtures'

interface OperationRow {
  _rowKey: string
  name: string
  score: number
}

const readRows = async (page: Page): Promise<OperationRow[]> => {
  const content = await page.getByTestId('row-operations-data').textContent()
  return JSON.parse(content || '[]') as OperationRow[]
}

const actionButton = (page: Page, name: string, rowIndex: number) => (
  page.getByRole('button', { name, exact: true }).nth(rowIndex)
)

test.beforeEach(async ({ page }) => {
  await page.goto('/row-column-operations')
  await expect(page.getByRole('heading', { name: '行列操作与异步提交' })).toBeVisible()
})

test('navigates by the mounted field order after reorder and visibility changes', async ({ page }) => {
  const name = field(page, 'tableData.0.name').locator('input')
  const score = field(page, 'tableData.0.score').locator('input')

  await name.focus()
  await name.press('Enter')
  await expect(score).toBeFocused()
  await score.press('Shift+Enter')
  await expect(name).toBeFocused()

  await page.getByRole('button', { name: '姓名/评分换序' }).click()
  await score.focus()
  await score.press('Enter')
  await expect(name).toBeFocused()

  await page.getByRole('button', { name: '移除备注列' }).click()
  await name.focus()
  await name.press('Enter')
  await expect(field(page, 'tableData.1.score').locator('input')).toBeFocused()
})

test('leaves Enter handling with interactive slot controls', async ({ page }) => {
  const commit = field(page, 'tableData.0.score').getByRole('button', { name: '审核后提交' })
  await commit.focus()
  await commit.dispatchEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
  await expect(commit).toBeFocused()
})

test('keeps row identity through movement, editing, and copying', async ({ page }) => {
  await actionButton(page, '下移', 0).click()
  await expect.poll(async () => (await readRows(page))[0]._rowKey).toBe('server:2')

  const firstName = field(page, 'tableData.0.name').locator('input')
  await expect(firstName).toHaveValue('李四')
  await firstName.fill('李四更新')
  await expect.poll(async () => (await readRows(page))[0].name).toBe('李四更新')

  await actionButton(page, '复制', 0).click()
  await expect.poll(async () => (await readRows(page)).length).toBe(3)
  const rows = await readRows(page)
  expect(rows[1].name).toBe('李四更新（复制）')
  expect(rows[1]._rowKey).not.toBe(rows[0]._rowKey)
})

test('commits an accepted async slot value and rejects an invalid one', async ({ page }) => {
  const score = field(page, 'tableData.0.score')
  const input = score.locator('input')
  const commit = score.getByRole('button', { name: '审核后提交' })

  await input.fill('55')
  await commit.click()
  await expect(page.getByText('业务检查未通过：评分不能低于 60')).toBeVisible()
  expect((await readRows(page))[0].score).toBe(80)

  await input.fill('88')
  await commit.click()
  await expect(page.getByText('检查通过，评分已写入表格')).toBeVisible()
  await expect.poll(async () => (await readRows(page))[0].score).toBe(88)
})
