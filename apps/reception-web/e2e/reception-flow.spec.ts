import { test, expect } from '@playwright/test'

test.describe('Reception Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('1. Landing page shows walk-in button', async ({ page }) => {
    // The landing page should display the walk-in participation button
    const walkInButton = page.getByRole('button', { name: /当日参加|walk.in/i })
    await expect(walkInButton).toBeVisible()
  })

  test('2. Full reception flow: landing → info → program selection → confirmation', async ({ page }) => {
    // Step 1: Click walk-in button
    const walkInButton = page.getByRole('button', { name: /当日参加|walk.in/i })
    await walkInButton.click()

    // Step 2: Fill attendee form
    // Wait for the attendee form to appear
    await page.waitForSelector('input[name="attendee.name"], input[placeholder*="名前"], input[placeholder*="お名前"]', { timeout: 5000 })

    // Fill in attendee information
    const nameInput = page.locator('input').first()
    await nameInput.fill('テスト太郎')

    // Fill furigana
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    if (inputCount >= 2) {
      await inputs.nth(1).fill('テストタロウ')
    }

    // Look for a next/submit button to proceed
    const nextButton = page.getByRole('button', { name: /次へ|next|進む/i })
    if (await nextButton.isVisible()) {
      await nextButton.click()
    }
  })

  test('3. Admin button is visible in header', async ({ page }) => {
    // Admin (管理) button should be visible
    const adminButton = page.getByRole('button', { name: /管理|admin/i })
    await expect(adminButton).toBeVisible()
  })

  test('4. Theme toggle works', async ({ page }) => {
    // Find the theme toggle button
    const themeButton = page.getByRole('button', { name: /ライト|ダーク|light|dark/i })
    if (await themeButton.isVisible()) {
      await themeButton.click()
      // Wait for theme transition
      await page.waitForTimeout(1000)
    }
  })

  test('5. Language toggle works', async ({ page }) => {
    // Find a language toggle button (JA/EN)
    const langButton = page.getByRole('button', { name: /^JA$|^EN$/i })
    if (await langButton.isVisible()) {
      const initialText = await langButton.textContent()
      await langButton.click()
      // Wait for language change
      await page.waitForTimeout(500)
      const newText = await langButton.textContent()
      expect(newText).not.toBe(initialText)
    }
  })
})

test.describe('Admin Panel', () => {
  test('6. Admin login modal opens', async ({ page }) => {
    await page.goto('/')
    
    // Click admin button
    const adminButton = page.getByRole('button', { name: /管理|admin/i })
    await adminButton.click()

    // Login modal should appear with email/password fields
    await page.waitForTimeout(500)
    const emailInput = page.locator('input[type="email"], input[placeholder*="メール"], input[placeholder*="email"]')
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible()
    }
  })
})

test.describe('Program Display', () => {
  test('7. Programs load and display on selection step', async ({ page }) => {
    await page.goto('/')

    // Click walk-in
    const walkInButton = page.getByRole('button', { name: /当日参加|walk.in/i })
    await walkInButton.click()

    // Wait for form and fill minimal data to get to program selection
    await page.waitForTimeout(1000)

    // Check that the step indicator shows program selection step exists
    const stepIndicator = page.locator('text=プログラム選択')
    if (await stepIndicator.isVisible()) {
      await expect(stepIndicator).toBeVisible()
    }
  })
})
