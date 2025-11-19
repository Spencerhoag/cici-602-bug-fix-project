import { Page } from '@playwright/test'

/**
 * Test user credentials (created by CI)
 */
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
}

/**
 * Sign in the test user
 */
export async function signInTestUser(page: Page) {
  await page.goto('/')

  // Wait for auth page to load
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 })

  // Fill in credentials
  await page.fill('input[type="email"], input[name="email"]', TEST_USER.email)
  await page.fill('input[type="password"], input[name="password"]', TEST_USER.password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle')

  // Verify we're logged in (not on auth page anymore)
  await page.waitForSelector('main, [role="main"]', { timeout: 10000 })
}

/**
 * Sign out the current user
 */
export async function signOut(page: Page) {
  // Look for sign out button/link
  const signOutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out")')

  if (await signOutButton.count() > 0) {
    await signOutButton.first().click()
    await page.waitForLoadState('networkidle')
  }
}

/**
 * Check if user is signed in
 */
export async function isSignedIn(page: Page): Promise<boolean> {
  try {
    // Check if we're on the auth page
    const emailInput = await page.locator('input[type="email"]').count()
    return emailInput === 0
  } catch {
    return false
  }
}
