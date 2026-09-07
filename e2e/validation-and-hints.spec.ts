import { expect, field, test } from './fixtures'

test('focuses the stable field returned by server validation', async ({ page }) => {
  await page.goto('/form-workflow')
  const firstProduct = field(page, 'tableData.0.productName').locator('input')
  await expect(firstProduct).toHaveValue('会议手册')
  await firstProduct.fill('会议手册更新')

  await page.getByText('异常流程开关', { exact: true }).click()
  await page.getByText('服务端拒绝第一行商品', { exact: true }).click()
  await page.getByRole('button', { name: '校验并保存' }).click()

  await expect(page.getByTestId('server-errors')).toContainText('该商品已存在于其他采购明细中')
  await expect(firstProduct).toBeFocused()
  await expect(firstProduct).toBeInViewport()
})

test('shows one real tooltip for field and header targets and dismisses it', async ({ page }) => {
  await page.goto('/hint-scenarios')
  const section = page.getByTestId('tooltip-hints')
  const name = section.locator('[data-form-table-field-prop="tableData.0.name"] input')
  await name.focus()

  const tooltip = page.locator('.el-tooltip__popper:visible')
  await expect(tooltip).toHaveCount(1)
  await expect(tooltip).toContainText('当前姓名：Alice')

  await name.press('Escape')
  await expect(page.locator('.el-tooltip__popper:visible')).toHaveCount(0)

  await section.locator('[data-form-table-hint="含税金额说明"]').hover()
  await expect(page.locator('.el-tooltip__popper:visible')).toHaveCount(1)
  await expect(page.locator('.el-tooltip__popper:visible')).toContainText('含税金额说明')
  await page.getByRole('heading', { name: 'Hint 展示策略' }).hover()
  await expect(page.locator('.el-tooltip__popper:visible')).toHaveCount(0)
})
