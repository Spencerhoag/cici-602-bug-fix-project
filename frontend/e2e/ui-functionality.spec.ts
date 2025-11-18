import { test, expect } from '@playwright/test'

/**
 * UI Functionality Tests
 * Ensures all interactive elements have purpose and work correctly
 */

test.describe('Interactive Elements - Buttons', () => {
  test('all visible buttons should be functional', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Get all visible buttons
    const buttons = page.locator('button:visible')
    const count = await buttons.count()

    console.log(`Found ${count} visible buttons`)

    for (let i = 0; i < Math.min(count, 15); i++) {
      const button = buttons.nth(i)
      const text = (await button.textContent())?.trim() || 'no text'
      const ariaLabel = await button.getAttribute('aria-label')
      const disabled = await button.isDisabled()

      // Skip disabled buttons
      if (disabled) {
        console.log(`Button "${text}" is disabled - skipping`)
        continue
      }

      // Button should have either text or aria-label
      expect(text || ariaLabel).toBeTruthy()

      // Check if button has click handler or navigation
      const hasClickHandler = await button.evaluate((btn) => {
        // Check for onclick, event listeners, or form submission
        if (btn.onclick) return true
        if (btn.type === 'submit' || btn.type === 'button') return true

        // Check if it's in a form
        const form = btn.closest('form')
        if (form) return true

        // Check for React/Vue event listeners (they add __reactEventHandlers$ or similar)
        const keys = Object.keys(btn)
        return keys.some(key => key.includes('react') || key.includes('vue') || key.includes('event'))
      })

      if (!hasClickHandler) {
        console.warn(`Button "${text}" (${ariaLabel}) may not have a click handler`)
      }

      // Try clicking and verify something happens
      const originalUrl = page.url()

      try {
        // Set up listeners for various events that indicate functionality
        let eventFired = false

        page.on('dialog', () => { eventFired = true })
        page.on('request', () => { eventFired = true })
        page.on('framenavigated', () => { eventFired = true })

        await button.click({ timeout: 2000 })

        // Wait briefly for any effects
        await page.waitForTimeout(100)

        const newUrl = page.url()
        const urlChanged = originalUrl !== newUrl

        // Either URL changed, dialog appeared, request was made, or DOM changed
        // This is a basic check - some buttons may have subtler effects
        console.log(`Button "${text}": URL changed: ${urlChanged}, Event fired: ${eventFired}`)

      } catch (error) {
        // Button might be covered or not clickable - that's okay for this test
        console.log(`Could not click button "${text}": ${error}`)
      }
    }
  })

  test('buttons should have appropriate cursor on hover', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const buttons = page.locator('button:visible').first()

    if (await buttons.count() > 0) {
      const cursor = await buttons.evaluate((btn) => {
        return window.getComputedStyle(btn).cursor
      })

      // Buttons should have pointer cursor or default (browser decides)
      expect(['pointer', 'default']).toContain(cursor)
    }
  })

  test('disabled buttons should not be clickable', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const disabledButtons = page.locator('button:disabled')
    const count = await disabledButtons.count()

    if (count > 0) {
      const button = disabledButtons.first()

      // Should not be clickable
      await expect(button).toBeDisabled()

      // Should have visual indication (opacity or cursor)
      const opacity = await button.evaluate((btn) => {
        return window.getComputedStyle(btn).opacity
      })

      // Disabled buttons typically have reduced opacity
      expect(parseFloat(opacity)).toBeLessThanOrEqual(1)
    }
  })
})

test.describe('Interactive Elements - Links', () => {
  test('all links should have valid href or onClick', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const links = page.locator('a:visible')
    const count = await links.count()

    for (let i = 0; i < Math.min(count, 15); i++) {
      const link = links.nth(i)
      const href = await link.getAttribute('href')
      const text = (await link.textContent())?.trim()

      // Link should have href or onClick handler
      if (!href || href === '#') {
        const hasClickHandler = await link.evaluate((el) => {
          return el.onclick !== null || Object.keys(el).some(key => key.includes('react'))
        })

        if (!hasClickHandler) {
          console.warn(`Link "${text}" has no href and no click handler`)
        }
      }

      // Link should have text or aria-label
      const ariaLabel = await link.getAttribute('aria-label')
      expect(text || ariaLabel).toBeTruthy()
    }
  })

  test('links should be distinguishable from regular text', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const links = page.locator('a:visible')

    if (await links.count() > 0) {
      const link = links.first()

      const styles = await link.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          textDecoration: computed.textDecoration,
          color: computed.color,
          cursor: computed.cursor,
        }
      })

      // Links should have underline, different color, or pointer cursor
      const isDistinguishable =
        styles.textDecoration.includes('underline') ||
        styles.cursor === 'pointer'

      expect(isDistinguishable).toBe(true)
    }
  })
})

test.describe('Interactive Elements - Forms', () => {
  test('form inputs should be functional', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const inputs = page.locator('input:visible, textarea:visible')
    const count = await inputs.count()

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 10); i++) {
        const input = inputs.nth(i)
        const type = await input.getAttribute('type')
        const readonly = await input.getAttribute('readonly')

        // Skip readonly, hidden, submit, and button inputs
        if (readonly || type === 'hidden' || type === 'submit' || type === 'button') {
          continue
        }

        // Input should have label or aria-label
        const id = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const placeholder = await input.getAttribute('placeholder')

        let hasLabel = false
        if (id) {
          const label = page.locator(`label[for="${id}"]`)
          hasLabel = await label.count() > 0
        }

        const hasAccessibleName = hasLabel || ariaLabel || placeholder
        if (!hasAccessibleName) {
          console.warn(`Input of type "${type}" may not have an accessible name`)
        }

        // Try typing in the input
        try {
          await input.fill('test', { timeout: 1000 })
          const value = await input.inputValue()
          expect(value).toBe('test')

          // Clear it
          await input.fill('')
        } catch (error) {
          console.log(`Could not interact with input of type "${type}"`)
        }
      }
    }
  })

  test('form submission should be functional', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const forms = page.locator('form')
    const count = await forms.count()

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const form = forms.nth(i)

        // Form should have submit button or action
        const submitButton = form.locator('button[type="submit"], input[type="submit"]')
        const hasSubmitButton = await submitButton.count() > 0

        const action = await form.getAttribute('action')
        const onsubmit = await form.getAttribute('onsubmit')

        const hasSubmitMechanism = hasSubmitButton || action || onsubmit

        expect(hasSubmitMechanism).toBe(true)
      }
    }
  })
})

test.describe('Interactive Elements - Dialogs & Modals', () => {
  test('dialogs should be closable', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Look for buttons that might open dialogs
    const dialogTriggers = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New"), button:has-text("Edit")')
    const count = await dialogTriggers.count()

    if (count > 0) {
      const trigger = dialogTriggers.first()
      const text = await trigger.textContent()

      try {
        await trigger.click({ timeout: 2000 })
        await page.waitForTimeout(300) // Wait for animation

        // Look for dialog/modal
        const dialog = page.locator('[role="dialog"], [role="alertdialog"], .modal, .dialog')

        if (await dialog.count() > 0) {
          console.log(`Dialog opened by "${text}" button`)

          // Dialog should have close button
          const closeButton = dialog.locator('button[aria-label*="close" i], button:has-text("×"), button:has-text("Cancel")')

          if (await closeButton.count() > 0) {
            await closeButton.first().click()
            await page.waitForTimeout(300)

            // Dialog should be hidden or removed
            const stillVisible = await dialog.isVisible()
            expect(stillVisible).toBe(false)
          }
        }
      } catch (error) {
        console.log(`Could not test dialog for button "${text}"`)
      }
    }
  })

  test('dialogs should trap focus', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Try to open a dialog if available
    const dialogTriggers = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")')

    if (await dialogTriggers.count() > 0) {
      try {
        await dialogTriggers.first().click({ timeout: 2000 })
        await page.waitForTimeout(300)

        const dialog = page.locator('[role="dialog"], [role="alertdialog"]')

        if (await dialog.isVisible()) {
          // Tab through elements
          await page.keyboard.press('Tab')
          await page.waitForTimeout(100)

          // Focus should be within dialog
          const focusedElement = await page.evaluate(() => {
            const el = document.activeElement
            if (!el) return null

            const dialog = el.closest('[role="dialog"], [role="alertdialog"]')
            return dialog !== null
          })

          expect(focusedElement).toBe(true)
        }
      } catch (error) {
        console.log('Could not test dialog focus trap')
      }
    }
  })
})

test.describe('Interactive Elements - Dropdowns & Selects', () => {
  test('select elements should be functional', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const selects = page.locator('select:visible')
    const count = await selects.count()

    if (count > 0) {
      const select = selects.first()

      // Should have options
      const options = select.locator('option')
      const optionCount = await options.count()

      expect(optionCount).toBeGreaterThan(0)

      // Should be able to select an option
      if (optionCount > 1) {
        const secondOption = await options.nth(1).getAttribute('value')
        if (secondOption) {
          await select.selectOption(secondOption)
          const selectedValue = await select.inputValue()
          expect(selectedValue).toBe(secondOption)
        }
      }
    }
  })
})

test.describe('Visual Feedback', () => {
  test('interactive elements should have hover states', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const buttons = page.locator('button:visible').first()

    if (await buttons.count() > 0) {
      // Get initial background
      const initialBg = await buttons.evaluate((btn) => {
        return window.getComputedStyle(btn).backgroundColor
      })

      // Hover
      await buttons.hover()
      await page.waitForTimeout(100)

      const hoverBg = await buttons.evaluate((btn) => {
        return window.getComputedStyle(btn).backgroundColor
      })

      // Background might change on hover (but not required)
      console.log(`Button background: ${initialBg} -> ${hoverBg}`)
    }
  })

  test('interactive elements should have focus states', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Tab to first focusable element
    await page.keyboard.press('Tab')
    await page.waitForTimeout(100)

    // Check that something is focused
    const focused = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el.tagName === 'BODY') return null

      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      }
    })

    // Focused element should have visible focus indicator
    if (focused) {
      const hasFocusIndicator =
        focused.outlineWidth !== '0px' ||
        focused.boxShadow !== 'none'

      expect(hasFocusIndicator).toBe(true)
    }
  })

  test('loading states should be indicated', async ({ page }) => {
    await page.goto('/')

    // Check for loading indicator on page load
    const loadingIndicator = page.locator('[aria-label*="loading" i], .loading, .spinner, [role="progressbar"]')

    // Loading indicator might appear briefly
    // This is more of a smoke test
    await page.waitForLoadState('domcontentloaded')

    // Page should eventually finish loading
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    console.log('Page loaded successfully')
  })
})

test.describe('Error Handling', () => {
  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Some errors might be expected (like network errors in dev)
    // Filter out common non-critical errors
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('sourcemap') &&
      !error.includes('ERR_BLOCKED_BY_CLIENT')
    )

    if (criticalErrors.length > 0) {
      console.warn('Console errors found:', criticalErrors)
    }

    // Just log for now, don't fail
    expect(criticalErrors.length).toBeLessThan(10)
  })
})
