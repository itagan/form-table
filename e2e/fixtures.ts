import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

interface BrowserFixtures {
  browserErrors: string[]
}

export const test = base.extend<BrowserFixtures>({
  browserErrors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })

    await use(errors)
    expect(errors).toEqual([])
  }
})

export { expect }

export const field = (page: Page, prop: string) => (
  page.locator(`[data-form-table-field-prop="${prop}"]:visible`)
)
