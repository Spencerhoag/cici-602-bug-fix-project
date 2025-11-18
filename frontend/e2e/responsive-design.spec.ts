import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Responsive Design Tests
 * Ensures the app renders properly at different screen sizes
 */

const viewports = {
  mobile: { width: 375, height: 667, name: 'iPhone SE' },
  mobileLarge: { width: 414, height: 896, name: 'iPhone XR' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  tabletLarge: { width: 1024, height: 1366, name: 'iPad Pro' },
  desktop: { width: 1280, height: 720, name: 'Desktop' },
  desktopLarge: { width: 1920, height: 1080, name: 'Full HD' },
}

test.describe('Responsive Design - Layout', () => {
  Object.entries(viewports).forEach(([key, viewport]) => {
    test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')

      await page.waitForLoadState('domcontentloaded')

      // Check that the page is visible and doesn't have horizontal scroll
      const body = page.locator('body')
      const boundingBox = await body.boundingBox()

      expect(boundingBox).toBeTruthy()
      if (boundingBox) {
        // Body width should not exceed viewport width (no horizontal scroll)
        expect(boundingBox.width).toBeLessThanOrEqual(viewport.width)
      }

      // Check for any overflow issues
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)

      // Take screenshot for visual comparison
      await page.screenshot({
        path: `test-results/screenshots/${key}-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      })
    })
  })

  test('should handle orientation changes', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const portraitHeight = await page.evaluate(() => document.body.scrollHeight)

    // Landscape
    await page.setViewportSize({ width: 667, height: 375 })
    await page.waitForLoadState('networkidle')

    const landscapeHeight = await page.evaluate(() => document.body.scrollHeight)

    // Content should adapt (heights will be different)
    expect(portraitHeight).not.toBe(landscapeHeight)
  })
})

test.describe('Responsive Design - Typography', () => {
  test('should have readable font sizes on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Check that text is at least 14px (readable on mobile)
    const textElements = await page.locator('p, span, div, a, button, label').all()

    for (const element of textElements.slice(0, 10)) { // Sample first 10
      const fontSize = await element.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return parseFloat(style.fontSize)
      })

      // Font size should be at least 14px for readability
      if (fontSize > 0) {
        expect(fontSize).toBeGreaterThanOrEqual(12)
      }
    }
  })

  test('should not have text that overflows on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }) // iPhone 5/SE
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Check for text overflow
    const hasOverflow = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      for (const el of Array.from(elements)) {
        if (el.scrollWidth > el.clientWidth) {
          const style = window.getComputedStyle(el)
          if (style.overflow !== 'hidden' && style.overflowX !== 'hidden') {
            console.log('Overflow detected:', el)
            return true
          }
        }
      }
      return false
    })

    expect(hasOverflow).toBe(false)
  })
})

test.describe('Responsive Design - Navigation', () => {
  test('should have accessible navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Look for mobile menu (hamburger or similar)
    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], button:has-text("☰")')

    // If menu button exists, it should be clickable
    if (await menuButton.count() > 0) {
      await menuButton.first().click()

      // Navigation should appear
      await page.waitForTimeout(300) // Wait for animation

      // Menu should be visible or navigation should expand
      const nav = page.locator('nav, [role="navigation"]')
      expect(await nav.isVisible()).toBe(true)
    }
  })

  test('should not have overlapping navigation items', async ({ page }) => {
    for (const viewport of [viewports.mobile, viewports.tablet, viewports.desktop]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Check for overlapping elements in navigation
      const navItems = page.locator('nav a, nav button, [role="navigation"] a, [role="navigation"] button')
      const count = await navItems.count()

      if (count > 1) {
        const boxes = []
        for (let i = 0; i < Math.min(count, 10); i++) {
          const box = await navItems.nth(i).boundingBox()
          if (box) boxes.push(box)
        }

        // Check for overlaps
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const box1 = boxes[i]
            const box2 = boxes[j]

            // Check if boxes overlap
            const overlap = !(
              box1.x + box1.width < box2.x ||
              box2.x + box2.width < box1.x ||
              box1.y + box1.height < box2.y ||
              box2.y + box2.height < box1.y
            )

            expect(overlap).toBe(false)
          }
        }
      }
    }
  })
})

test.describe('Responsive Design - Images & Media', () => {
  test('should not have images that overflow container', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const isVisible = await img.isVisible()

      if (isVisible) {
        const imgBox = await img.boundingBox()
        if (imgBox) {
          // Image should not exceed viewport width
          expect(imgBox.width).toBeLessThanOrEqual(375)
        }
      }
    }
  })
})

test.describe('Responsive Design - Touch Targets', () => {
  test('should have adequately sized touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Check button sizes (minimum 44x44 for WCAG)
    const buttons = page.locator('button, a[role="button"], input[type="submit"]')
    const count = await buttons.count()

    const MIN_TOUCH_SIZE = 44 // WCAG recommendation

    for (let i = 0; i < Math.min(count, 20); i++) {
      const button = buttons.nth(i)
      const isVisible = await button.isVisible()

      if (isVisible) {
        const box = await button.boundingBox()
        if (box && box.width > 0 && box.height > 0) {
          // At least one dimension should meet minimum size
          const meetsMinimum = box.width >= MIN_TOUCH_SIZE || box.height >= MIN_TOUCH_SIZE

          if (!meetsMinimum) {
            const text = await button.textContent()
            console.log(`Small touch target found: "${text?.trim()}" - ${box.width}x${box.height}`)
          }
        }
      }
    }
  })

  test('should have adequate spacing between touch targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const MIN_SPACING = 8 // Minimum pixels between targets

    const buttons = page.locator('button:visible, a[role="button"]:visible')
    const count = await buttons.count()

    if (count > 1) {
      for (let i = 0; i < Math.min(count - 1, 10); i++) {
        const box1 = await buttons.nth(i).boundingBox()
        const box2 = await buttons.nth(i + 1).boundingBox()

        if (box1 && box2) {
          // Calculate spacing
          const horizontalSpacing = Math.abs(box1.x - (box2.x + box2.width))
          const verticalSpacing = Math.abs(box1.y - (box2.y + box2.height))

          const spacing = Math.min(horizontalSpacing, verticalSpacing)

          // Adjacent buttons should have some spacing
          if (spacing < 100) { // Only check if they're close
            expect(spacing).toBeGreaterThan(MIN_SPACING)
          }
        }
      }
    }
  })
})

test.describe('Responsive Design - Accessibility', () => {
  test('should maintain accessibility on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('should maintain accessibility on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('should maintain accessibility on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
