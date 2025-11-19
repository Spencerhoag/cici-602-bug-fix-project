import { test, expect } from '@playwright/test'
import { signInTestUser, signOut, TEST_USER } from './helpers/test-auth'

/**
 * Authentication E2E Tests
 * Tests user login, logout, and authenticated routes
 */

test.describe('Authentication', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Should see login form
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('should sign in with test user credentials', async ({ page }) => {
    await signInTestUser(page)

    // Should be redirected to main app (not on login page)
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).not.toBeVisible()

    // Should see main app content
    const mainContent = page.locator('main, [role="main"]')
    await expect(mainContent).toBeVisible()
  })

  test('should sign out successfully', async ({ page }) => {
    // First sign in
    await signInTestUser(page)

    // Then sign out
    await signOut(page)

    // Should be back on login page
    await page.waitForLoadState('networkidle')
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 10000 })
  })

  test('should persist session across page reloads', async ({ page }) => {
    // Sign in
    await signInTestUser(page)

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should still be logged in
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).not.toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('input[type="email"]')

    // Try to sign in with wrong password
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error (check for error message or still on login page)
    await page.waitForTimeout(2000)

    // Either error message is shown or still on login page
    const stillOnLoginPage = await page.locator('input[type="email"]').isVisible()
    const errorMessage = await page.locator('text=/error|invalid|incorrect/i').count()

    expect(stillOnLoginPage || errorMessage > 0).toBeTruthy()
  })
})

test.describe('Protected Routes', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await signInTestUser(page)
  })

  test('authenticated user can access main app', async ({ page }) => {
    // Should see main app content
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })

  test('authenticated user can create projects', async ({ page }) => {
    // Look for create project button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Project")')

    if (await createButton.count() > 0) {
      await createButton.first().click()
      await page.waitForTimeout(500)

      // Should see a form or dialog
      const dialog = page.locator('[role="dialog"], .modal')
      if (await dialog.count() > 0) {
        await expect(dialog.first()).toBeVisible()
      }
    }
  })
})
