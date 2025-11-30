import { Page, expect } from '@playwright/test'

/**
 * Visual Regression Testing Helpers
 * Utilities for comparing screenshots and detecting visual changes
 */

export interface VisualTestOptions {
  maxDiffPixels?: number
  maxDiffPixelRatio?: number
  threshold?: number
}

/**
 * Compare a page screenshot with a baseline
 */
export async function compareVisual(
  page: Page,
  name: string,
  options?: VisualTestOptions
) {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    maxDiffPixels: options?.maxDiffPixels,
    maxDiffPixelRatio: options?.maxDiffPixelRatio,
    threshold: options?.threshold || 0.2,
  })
}

/**
 * Compare a specific element screenshot with a baseline
 */
export async function compareElementVisual(
  page: Page,
  selector: string,
  name: string,
  options?: VisualTestOptions
) {
  const element = page.locator(selector)
  await expect(element).toHaveScreenshot(`${name}.png`, {
    maxDiffPixels: options?.maxDiffPixels,
    maxDiffPixelRatio: options?.maxDiffPixelRatio,
    threshold: options?.threshold || 0.2,
  })
}

/**
 * Test responsive breakpoints with visual comparison
 */
export async function testResponsiveVisuals(
  page: Page,
  url: string,
  name: string,
  viewports: { width: number; height: number; name: string }[]
) {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(url)
    await page.waitForLoadState('networkidle')

    await compareVisual(page, `${name}-${viewport.name}`, {
      maxDiffPixelRatio: 0.05, // Allow 5% difference
    })
  }
}

/**
 * Check for layout shifts
 */
export async function detectLayoutShifts(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let cls = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            cls += (entry as any).value
          }
        }
      })

      observer.observe({ entryTypes: ['layout-shift'] })

      // Observe for 2 seconds
      setTimeout(() => {
        observer.disconnect()
        resolve(cls)
      }, 2000)
    })
  })
}

/**
 * Check element visibility at different scroll positions
 */
export async function checkElementsAtScrollPositions(
  page: Page,
  selector: string,
  positions: number[]
): Promise<boolean[]> {
  const results: boolean[] = []

  for (const position of positions) {
    await page.evaluate((y) => window.scrollTo(0, y), position)
    await page.waitForTimeout(100)

    const isVisible = await page.locator(selector).isVisible()
    results.push(isVisible)
  }

  return results
}

/**
 * Detect overlapping elements
 */
export async function detectOverlaps(
  page: Page,
  selector1: string,
  selector2: string
): Promise<boolean> {
  return await page.evaluate(
    ({ sel1, sel2 }) => {
      const el1 = document.querySelector(sel1)
      const el2 = document.querySelector(sel2)

      if (!el1 || !el2) return false

      const rect1 = el1.getBoundingClientRect()
      const rect2 = el2.getBoundingClientRect()

      return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
      )
    },
    { sel1: selector1, sel2: selector2 }
  )
}

/**
 * Check if element is within viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).evaluate((el) => {
    const rect = el.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  })
}

/**
 * Measure element contrast ratio
 */
export async function measureContrast(
  page: Page,
  selector: string
): Promise<{ ratio: number; passes: boolean }> {
  return await page.locator(selector).evaluate((el) => {
    const computed = window.getComputedStyle(el)
    const fg = computed.color
    const bg = computed.backgroundColor

    // Parse RGB values
    const parsergb = (color: string) => {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (!match) return [0, 0, 0]
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
    }

    const [r1, g1, b1] = parsergb(fg)
    const [r2, g2, b2] = parsergb(bg)

    // Calculate relative luminance
    const luminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        const val = c / 255
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }

    const l1 = luminance(r1, g1, b1)
    const l2 = luminance(r2, g2, b2)

    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

    return {
      ratio: Math.round(ratio * 100) / 100,
      passes: ratio >= 4.5, // WCAG AA for normal text
    }
  })
}

/**
 * Check for horizontal scroll
 */
export async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
}

/**
 * Get all overflow elements
 */
export async function findOverflowElements(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const overflowElements: string[] = []
    const elements = document.querySelectorAll('*')

    elements.forEach((el) => {
      if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
        const computed = window.getComputedStyle(el)
        if (computed.overflow !== 'hidden' && computed.overflow !== 'auto') {
          // Create a selector
          let selector = el.tagName.toLowerCase()
          if (el.id) selector += `#${el.id}`
          if (el.className) {
            const classes = Array.from(el.classList).slice(0, 2).join('.')
            if (classes) selector += `.${classes}`
          }
          overflowElements.push(selector)
        }
      }
    })

    return overflowElements
  })
}
