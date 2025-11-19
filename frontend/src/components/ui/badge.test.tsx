import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'
import { runAxe, expectNoA11yViolations } from '@/test/axe-helper'

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders badge with text', () => {
      render(<Badge>Test Badge</Badge>)
      expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('renders with default variant', () => {
      render(<Badge data-testid="test-badge">Default</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveClass('bg-primary')
    })

    it('renders with different variants', () => {
      const { rerender } = render(<Badge variant="default" data-testid="test-badge">Default</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('bg-primary')

      rerender(<Badge variant="secondary" data-testid="test-badge">Secondary</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('bg-secondary')

      rerender(<Badge variant="destructive" data-testid="test-badge">Destructive</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('bg-destructive')

      rerender(<Badge variant="success" data-testid="test-badge">Success</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('bg-success')

      rerender(<Badge variant="warning" data-testid="test-badge">Warning</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('bg-warning')

      rerender(<Badge variant="outline" data-testid="test-badge">Outline</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('text-foreground')
    })

    it('has base styling classes', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold'
      )
    })

    it('renders as div element', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge.tagName).toBe('DIV')
    })
  })

  describe('Variants', () => {
    it('default variant has correct classes', () => {
      render(<Badge variant="default" data-testid="test-badge">Default</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveClass('border-transparent', 'bg-primary', 'text-primary-foreground')
    })

    it('secondary variant has correct classes', () => {
      render(<Badge variant="secondary" data-testid="test-badge">Secondary</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveClass('border-transparent', 'bg-secondary', 'text-secondary-foreground')
    })

    it('destructive variant has correct classes', () => {
      render(<Badge variant="destructive" data-testid="test-badge">Destructive</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveClass('border-transparent', 'bg-destructive', 'text-destructive-foreground')
    })

    it('success variant has correct classes', () => {
      render(<Badge variant="success" data-testid="test-badge">Success</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveClass('border-transparent', 'bg-success', 'text-success-foreground')
    })

    it('warning variant has correct classes', () => {
      render(<Badge variant="warning" data-testid="test-badge">Warning</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveClass('border-transparent', 'bg-warning', 'text-warning-foreground')
    })

    it('outline variant has correct classes', () => {
      render(<Badge variant="outline" data-testid="test-badge">Outline</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveClass('text-foreground')
    })
  })

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Badge className="custom-class" data-testid="test-badge">Badge</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('custom-class')
    })

    it('passes through HTML div attributes', () => {
      render(
        <Badge
          id="my-badge"
          role="status"
          aria-label="Status badge"
          data-testid="test-badge"
        >
          Badge
        </Badge>
      )

      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveAttribute('id', 'my-badge')
      expect(badge).toHaveAttribute('role', 'status')
      expect(badge).toHaveAttribute('aria-label', 'Status badge')
    })

    it('merges classNames correctly', () => {
      render(<Badge className="extra-padding" data-testid="test-badge">Badge</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveClass('extra-padding')
      expect(badge).toHaveClass('rounded-full') // maintains default classes
    })

    it('supports onClick handler', () => {
      const handleClick = vi.fn()
      render(
        <Badge onClick={handleClick} data-testid="test-badge">
          Clickable
        </Badge>
      )

      const badge = screen.getByTestId('test-badge')
      badge.click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Content', () => {
    it('renders text content', () => {
      render(<Badge>Simple text</Badge>)
      expect(screen.getByText('Simple text')).toBeInTheDocument()
    })

    it('renders complex children', () => {
      render(
        <Badge>
          <span data-testid="icon">★</span>
          <span>Badge with icon</span>
        </Badge>
      )

      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Badge with icon')).toBeInTheDocument()
    })

    it('renders numbers', () => {
      render(<Badge>42</Badge>)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders empty badge', () => {
      render(<Badge data-testid="empty-badge" />)
      const badge = screen.getByTestId('empty-badge')
      expect(badge).toBeInTheDocument()
      expect(badge.textContent).toBe('')
    })
  })

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Badge aria-label="Status">Active</Badge>
      )
      const results = await runAxe(container)
      expectNoA11yViolations(results)
    })

    it('has focus ring classes', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>)
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring', 'focus:ring-offset-2')
    })

    it('supports role attribute for semantic meaning', () => {
      render(<Badge role="status" data-testid="test-badge">New</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveAttribute('role', 'status')
    })

    it('supports aria-live for dynamic updates', () => {
      render(
        <Badge aria-live="polite" data-testid="test-badge">
          3 new messages
        </Badge>
      )
      expect(screen.getByTestId('test-badge')).toHaveAttribute('aria-live', 'polite')
    })

    it('all variants have no accessibility violations', async () => {
      const variants = ['default', 'secondary', 'destructive', 'success', 'warning', 'outline'] as const

      for (const variant of variants) {
        const { container } = render(
          <Badge variant={variant} aria-label={`${variant} badge`}>
            {variant}
          </Badge>
        )
        const results = await runAxe(container)
        expectNoA11yViolations(results)
      }
    })
  })

  describe('Use Cases', () => {
    it('renders as notification badge', () => {
      render(
        <Badge variant="destructive" data-testid="notification">
          5
        </Badge>
      )
      expect(screen.getByTestId('notification')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('renders as status indicator', () => {
      render(
        <Badge variant="success" role="status" aria-label="Online status">
          Online
        </Badge>
      )
      expect(screen.getByLabelText('Online status')).toBeInTheDocument()
    })

    it('renders multiple badges together', () => {
      render(
        <div>
          <Badge variant="default" data-testid="badge-1">Badge 1</Badge>
          <Badge variant="secondary" data-testid="badge-2">Badge 2</Badge>
          <Badge variant="success" data-testid="badge-3">Badge 3</Badge>
        </div>
      )

      expect(screen.getByTestId('badge-1')).toBeInTheDocument()
      expect(screen.getByTestId('badge-2')).toBeInTheDocument()
      expect(screen.getByTestId('badge-3')).toBeInTheDocument()
    })

    it('works as a tag/label', () => {
      render(
        <Badge variant="outline">
          JavaScript
        </Badge>
      )
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('has transition classes', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('transition-colors')
    })

    it('maintains rounded-full shape', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('rounded-full')
    })

    it('has proper text size', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('text-xs')
    })

    it('has semibold font weight', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>)
      expect(screen.getByTestId('test-badge')).toHaveClass('font-semibold')
    })
  })
})
