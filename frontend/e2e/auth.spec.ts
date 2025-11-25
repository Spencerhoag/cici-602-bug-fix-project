import { test, expect } from '@playwright/test'
import { /* signInTestUser, signOut, */ TEST_USER } from './helpers/test-auth'

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

  // TODO: Fix auth integration tests - currently disabled due to Supabase GoTrue version compatibility issues
  // test('should sign in with test user credentials', async ({ page }) => {
  //   await signInTestUser(page)
  //   const emailInput = page.locator('input[type="email"]')
  //   await expect(emailInput).not.toBeVisible()
  //   const mainContent = page.locator('main, [role="main"]')
  //   await expect(mainContent).toBeVisible()
  // })

  // test('should persist session across page reloads', async ({ page }) => {
  //   await signInTestUser(page)
  //   await page.reload()
  //   await page.waitForLoadState('networkidle')
  //   const emailInput = page.locator('input[type="email"]')
  //   await expect(emailInput).not.toBeVisible()
  // })

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

// TODO: Re-enable Protected Routes tests after fixing auth integration
// test.describe('Protected Routes', () => {
//   test.beforeEach(async ({ page }) => {
//     await signInTestUser(page)
//   })
//
//   test('authenticated user can access main app', async ({ page }) => {
//     const mainContent = page.locator('main')
//     await expect(mainContent).toBeVisible()
//   })
//
//   test('authenticated user can create projects', async ({ page }) => {
//     const createButton = page.locator('button:has-text("Create"), button:has-text("New Project")')
//     if (await createButton.count() > 0) {
//       await createButton.first().click()
//       await page.waitForTimeout(500)
//       const dialog = page.locator('[role="dialog"], .modal')
//       if (await dialog.count() > 0) {
//         await expect(dialog.first()).toBeVisible()
//       }
//     }
//   })
// })
