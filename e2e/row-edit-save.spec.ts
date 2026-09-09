import type { Page } from '@playwright/test'
import { expect, field, test } from './fixtures'

interface EmployeeRow {
  id: string
  name: string
  department: string
  phone: string
  version: number
}

const readRows = async (page: Page): Promise<EmployeeRow[]> => {
  const content = await page.getByTestId('row-edit-save-data').textContent()
  return JSON.parse(content || '[]') as EmployeeRow[]
}

const readRequest = async (page: Page) => {
  const content = await page.getByTestId('row-edit-save-request').textContent()
  return JSON.parse(content || '{}') as { id: string; changes: Record<string, unknown> }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/row-edit-save')
  await expect(page.getByRole('heading', { name: '按行编辑与保存' })).toBeVisible()
})

test('edits, validates, and submits only the changed fields of one row', async ({ page }) => {
  await page.getByRole('button', { name: '编辑', exact: true }).first().click()

  const name = field(page, 'tableData.0.name').locator('input')
  const phone = field(page, 'tableData.0.phone').locator('input')
  await name.fill('张三更新')
  await phone.fill('123')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByText('请输入正确的 11 位手机号').first()).toBeVisible()
  await expect(phone).toBeFocused()

  await phone.fill('13600136000')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByText('已保存“张三更新”，仅提交当前行的变化字段')).toBeVisible()
  await expect(name).toHaveCount(0)

  await expect.poll(async () => readRequest(page)).toEqual({
    id: 'employee-1',
    changes: { name: '张三更新', phone: '13600136000' }
  })
  await expect.poll(async () => (await readRows(page))[0].version).toBe(4)
  expect((await readRows(page))[1].version).toBe(5)
})

test('restores a row on cancel and keeps values after a failed save', async ({ page }) => {
  await page.getByRole('button', { name: '编辑', exact: true }).nth(1).click()
  const name = field(page, 'tableData.1.name').locator('input')
  await name.fill('不应保留')
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect.poll(async () => (await readRows(page))[1].name).toBe('李四')

  await page.getByRole('button', { name: '编辑', exact: true }).nth(1).click()
  await name.fill('失败后保留')
  await page.getByTestId('row-save-failure-switch').click()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByText('保存失败，当前输入已保留，请重试')).toBeVisible()
  await expect(name).toHaveValue('失败后保留')
  await expect(page.getByRole('button', { name: '保存', exact: true })).toBeVisible()
})
