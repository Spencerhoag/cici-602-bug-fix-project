# Frontend Testing Guide

## Quick Start

```bash
# Run tests in watch mode (use during development)
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage
```

## What's Tested

**Component Tests (15 passing):**
- Component rendering and variants
- User interactions (click, hover, keyboard)
- Accessibility (WCAG 2.1 AA with axe-core)
- Focus management and ARIA attributes
- Props and ref forwarding

**E2E Tests (run in CI/CD):**
- Responsive design across 6 viewports
- UI functionality (buttons, links, forms, dialogs)
- Touch target sizes (44x44px minimum)
- Visual feedback (hover, focus states)
- Layout overflow detection

## Test Files

```
src/
  components/
    ui/
      button.test.tsx           # Component tests
  test/
    setup.ts                    # Test configuration
    axe-helper.ts              # Accessibility utilities

e2e/
  example.spec.ts              # Basic E2E tests
  responsive-design.spec.ts    # Responsive layout tests
  ui-functionality.spec.ts     # Interactive element tests
  helpers/
    visual-regression.ts       # Visual testing utilities
```

## Writing Tests

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { runAxe, expectNoA11yViolations } from '@/test/axe-helper'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<MyComponent />)
    const results = await runAxe(container)
    expectNoA11yViolations(results)
  })
})
```

## Accessibility Testing

All component tests include accessibility checks using axe-core:

- WCAG 2.1 Level AA compliance
- Color contrast ratios
- Keyboard navigation
- Screen reader compatibility
- Form labels and ARIA attributes
- Semantic HTML structure

## CI/CD

Tests run automatically in GitHub Actions on push and PR:

1. **Component Tests** - Fast feedback on code changes
2. **E2E Tests** - Full browser testing with Playwright
3. **Reports** - Uploaded as artifacts

View results in the Actions tab on GitHub.

## Configuration Files

- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration (CI only)
- `src/test/setup.ts` - Test environment setup

## Tips

1. **Use watch mode** during development: `npm test`
2. **Check accessibility** for every new component
3. **Review coverage** to find untested code
4. **Let CI handle E2E** - component tests catch most issues
5. **Test keyboard navigation** - press Tab through your UI

## Troubleshooting

### Tests Pass Locally But Fail in CI

- Ensure you've run `npm run test:run` before committing
- Check for timing issues or hardcoded paths
- Review the GitHub Actions logs

### Accessibility Violations

The error message will show:
- Which rule failed (e.g., `color-contrast`)
- The affected HTML element
- How to fix it

See [axe-core rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md) for details.

## Resources

- [React Testing Library](https://testing-library.com/react)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
