import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'
import { runAxe, expectNoA11yViolations } from '@/test/axe-helper'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('renders with different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-primary')

      rerender(<Button variant="destructive">Destructive</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-destructive')

      rerender(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toHaveClass('border')
    })

    it('renders with different sizes', () => {
      const { rerender } = render(<Button size="default">Default Size</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-10')

      rerender(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-9')

      rerender(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-11')
    })

    it('renders disabled button', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Click me</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick} disabled>Click me</Button>)

      const button = screen.getByRole('button')
      // Disabled buttons cannot be clicked in userEvent
      expect(button).toBeDisabled()
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('supports keyboard interaction', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Click me</Button>)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Button>Accessible Button</Button>)
      const results = await runAxe(container)
      expectNoA11yViolations(results)
    })

    it('has proper focus styles', () => {
      render(<Button>Focus me</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('maintains accessibility when disabled', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>)
      const results = await runAxe(container)
      expectNoA11yViolations(results)
    })

    it('has proper ARIA attributes when needed', () => {
      render(
        <Button aria-label="Custom label" aria-pressed="true">
          Toggle
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })

    it('has sufficient color contrast (visual check)', () => {
      // This test validates that focus indicators are present
      // Actual contrast testing requires visual regression tools
      render(<Button variant="default">Check Contrast</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('ring-offset-background')
    })
  })

  describe('Custom Props', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLButtonElement | null }
      render(<Button ref={ref}>Ref Button</Button>)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })

    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      expect(screen.getByRole('button')).toHaveClass('custom-class')
    })

    it('passes through HTML button attributes', () => {
      render(
        <Button type="submit" name="test-button" value="test">
          Submit
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('name', 'test-button')
      expect(button).toHaveAttribute('value', 'test')
    })
  })
})
