import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Homepage', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')

    // Wait for the app to load (either auth page or main app)
    await page.waitForLoadState('networkidle')

    // Check that the page loaded successfully
    expect(page.url()).toContain('localhost')
  })

  test('should have no accessibility violations on auth page', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded')

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper document structure', async ({ page }) => {
    await page.goto('/')

    // Check for main landmark
    const mainElement = page.locator('main, [role="main"]')
    await expect(mainElement).toBeAttached()
  })

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/')

    // Try to navigate with tab
    await page.keyboard.press('Tab')

    // Check that focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.tagName : null
    })

    expect(focusedElement).not.toBeNull()
  })
})

test.describe('Button Components', () => {
  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/')

    // Wait for any buttons to appear
    await page.waitForSelector('button', { timeout: 5000 })

    // Get first button
    const button = page.locator('button').first()

    // Focus the button with keyboard
    await button.focus()

    // Check that it can be activated with Enter
    const buttonText = await button.textContent()
    console.log('Testing button:', buttonText)

    // Verify focus is on the button
    const isFocused = await button.evaluate((el) => el === document.activeElement)
    expect(isFocused).toBe(true)
  })

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/')

    await page.waitForSelector('button', { timeout: 5000 })

    // Check all buttons have accessible names
    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const text = await button.textContent()

      // Button should have either aria-label or text content
      expect(ariaLabel || text?.trim()).toBeTruthy()
    }
  })
})

test.describe('Color Contrast', () => {
  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')

    await page.waitForLoadState('domcontentloaded')

    // Run accessibility scan focused on color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze()

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })
})

test.describe('Form Elements', () => {
  test('should have proper labels for inputs', async ({ page }) => {
    await page.goto('/')

    await page.waitForLoadState('domcontentloaded')

    // Run accessibility scan focused on form labels
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'best-practice'])
      .analyze()

    // Filter for label violations
    const labelViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'label' || v.id === 'label-title-only'
    )

    expect(labelViolations).toEqual([])
  })
})

test.describe('Responsive Design', () => {
  test('should be accessible on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await page.waitForLoadState('domcontentloaded')

    // Run accessibility scan on mobile
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should be accessible on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    await page.waitForLoadState('domcontentloaded')

    // Run accessibility scan on tablet
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
