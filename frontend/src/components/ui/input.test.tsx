import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'
import { runAxe, expectNoA11yViolations } from '@/test/axe-helper'

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders as input element without explicit type', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')
      expect(input.tagName).toBe('INPUT')
      // When type is not specified, it defaults to text by browser behavior
    })

    it('renders with different input types', () => {
      const { rerender } = render(<Input type="email" data-testid="test-input" />)
      expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'email')

      rerender(<Input type="password" data-testid="test-input" />)
      expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'password')

      rerender(<Input type="number" data-testid="test-input" />)
      expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'number')
    })

    it('renders disabled input', () => {
      render(<Input disabled data-testid="test-input" />)
      expect(screen.getByTestId('test-input')).toBeDisabled()
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Search..." />)
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })

    it('renders with value', () => {
      render(<Input value="Test value" onChange={() => {}} />)
      expect(screen.getByDisplayValue('Test value')).toBeInTheDocument()
    })

    it('renders readonly input', () => {
      render(<Input readOnly value="Read only" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')
      expect(input).toHaveAttribute('readonly')
    })
  })

  describe('Interactions', () => {
    it('handles text input', async () => {
      const user = userEvent.setup()
      render(<Input data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      await user.type(input, 'Hello World')

      expect(input).toHaveValue('Hello World')
    })

    it('calls onChange handler', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<Input onChange={handleChange} data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      await user.type(input, 'test')

      expect(handleChange).toHaveBeenCalled()
      expect(handleChange).toHaveBeenCalledTimes(4) // once per character
    })

    it('calls onFocus and onBlur handlers', async () => {
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      const user = userEvent.setup()

      render(
        <Input
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid="test-input"
        />
      )

      const input = screen.getByTestId('test-input')
      await user.click(input)
      expect(handleFocus).toHaveBeenCalledTimes(1)

      await user.tab()
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Input data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      await user.tab()

      expect(input).toHaveFocus()
    })

    it('does not allow input when disabled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(<Input disabled onChange={handleChange} data-testid="test-input" />)

      const input = screen.getByTestId('test-input')
      await user.type(input, 'test')

      expect(handleChange).not.toHaveBeenCalled()
      expect(input).toHaveValue('')
    })

    it('handles clear functionality', async () => {
      const user = userEvent.setup()
      render(<Input defaultValue="Initial value" data-testid="test-input" />)

      const input = screen.getByTestId('test-input') as HTMLInputElement
      expect(input.value).toBe('Initial value')

      await user.clear(input)
      expect(input.value).toBe('')
    })
  })

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Input aria-label="Test input" placeholder="Enter text" />
      )
      const results = await runAxe(container)
      expectNoA11yViolations(results)
    })

    it('supports ARIA attributes', () => {
      render(
        <Input
          aria-label="Search"
          aria-describedby="search-help"
          aria-required="true"
          data-testid="test-input"
        />
      )

      const input = screen.getByTestId('test-input')
      expect(input).toHaveAttribute('aria-label', 'Search')
      expect(input).toHaveAttribute('aria-describedby', 'search-help')
      expect(input).toHaveAttribute('aria-required', 'true')
    })

    it('has proper focus styles', () => {
      render(<Input data-testid="test-input" />)
      const input = screen.getByTestId('test-input')
      expect(input).toHaveClass('focus-visible:ring-2')
    })

    it('maintains accessibility when disabled', async () => {
      const { container } = render(
        <Input disabled aria-label="Disabled input" />
      )
      const results = await runAxe(container)
      expectNoA11yViolations(results)
    })
  })

  describe('Custom Props', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLInputElement | null }
      render(<Input ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('applies custom className', () => {
      render(<Input className="custom-class" data-testid="test-input" />)
      expect(screen.getByTestId('test-input')).toHaveClass('custom-class')
    })

    it('passes through HTML input attributes', () => {
      render(
        <Input
          name="username"
          maxLength={20}
          minLength={3}
          required
          data-testid="test-input"
        />
      )

      const input = screen.getByTestId('test-input')
      expect(input).toHaveAttribute('name', 'username')
      expect(input).toHaveAttribute('maxlength', '20')
      expect(input).toHaveAttribute('minlength', '3')
      expect(input).toHaveAttribute('required')
    })

    it('supports file input type', () => {
      render(<Input type="file" data-testid="test-input" />)
      expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'file')
    })

    it('merges classNames correctly', () => {
      render(<Input className="extra-class" data-testid="test-input" />)
      const input = screen.getByTestId('test-input')
      // Should have both default and custom classes
      expect(input).toHaveClass('extra-class')
      expect(input).toHaveClass('rounded-md')
    })
  })

  describe('Validation States', () => {
    it('supports pattern validation', () => {
      render(
        <Input
          type="email"
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
          data-testid="test-input"
        />
      )
      expect(screen.getByTestId('test-input')).toHaveAttribute('pattern')
    })

    it('shows disabled opacity', () => {
      render(<Input disabled data-testid="test-input" />)
      expect(screen.getByTestId('test-input')).toHaveClass('disabled:opacity-50')
    })
  })
})
