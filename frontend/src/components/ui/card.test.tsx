import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card'
import { runAxe, expectNoA11yViolations } from '@/test/axe-helper'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card element', () => {
      render(<Card data-testid="test-card">Card content</Card>)
      expect(screen.getByTestId('test-card')).toBeInTheDocument()
    })

    it('has proper styling classes', () => {
      render(<Card data-testid="test-card">Content</Card>)
      const card = screen.getByTestId('test-card')
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'shadow-sm')
    })

    it('applies custom className', () => {
      render(<Card className="custom-class" data-testid="test-card">Content</Card>)
      expect(screen.getByTestId('test-card')).toHaveClass('custom-class')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLDivElement | null }
      render(<Card ref={ref}>Content</Card>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('passes through HTML div attributes', () => {
      render(
        <Card id="my-card" role="region" aria-label="Test card" data-testid="test-card">
          Content
        </Card>
      )
      const card = screen.getByTestId('test-card')
      expect(card).toHaveAttribute('id', 'my-card')
      expect(card).toHaveAttribute('role', 'region')
      expect(card).toHaveAttribute('aria-label', 'Test card')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      )
      const results = await runAxe(container)
      expectNoA11yViolations(results)
    })
  })

  describe('CardHeader', () => {
    it('renders card header', () => {
      render(<CardHeader data-testid="test-header">Header content</CardHeader>)
      expect(screen.getByTestId('test-header')).toBeInTheDocument()
    })

    it('has proper styling classes', () => {
      render(<CardHeader data-testid="test-header">Header</CardHeader>)
      const header = screen.getByTestId('test-header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    it('applies custom className', () => {
      render(<CardHeader className="custom-header" data-testid="test-header">Header</CardHeader>)
      expect(screen.getByTestId('test-header')).toHaveClass('custom-header')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLDivElement | null }
      render(<CardHeader ref={ref}>Header</CardHeader>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('CardTitle', () => {
    it('renders card title as h3', () => {
      render(<CardTitle>Test Title</CardTitle>)
      const title = screen.getByText('Test Title')
      expect(title.tagName).toBe('H3')
    })

    it('has proper styling classes', () => {
      render(<CardTitle data-testid="test-title">Title</CardTitle>)
      const title = screen.getByTestId('test-title')
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
    })

    it('applies custom className', () => {
      render(<CardTitle className="custom-title" data-testid="test-title">Title</CardTitle>)
      expect(screen.getByTestId('test-title')).toHaveClass('custom-title')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLParagraphElement | null }
      render(<CardTitle ref={ref}>Title</CardTitle>)
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
    })

    it('renders children content', () => {
      render(
        <CardTitle>
          <span>Complex</span> Title
        </CardTitle>
      )
      expect(screen.getByText('Complex')).toBeInTheDocument()
      expect(screen.getByText('Title')).toBeInTheDocument()
    })
  })

  describe('CardDescription', () => {
    it('renders card description as paragraph', () => {
      render(<CardDescription>Test description</CardDescription>)
      const description = screen.getByText('Test description')
      expect(description.tagName).toBe('P')
    })

    it('has proper styling classes', () => {
      render(<CardDescription data-testid="test-desc">Description</CardDescription>)
      const description = screen.getByTestId('test-desc')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    it('applies custom className', () => {
      render(<CardDescription className="custom-desc" data-testid="test-desc">Desc</CardDescription>)
      expect(screen.getByTestId('test-desc')).toHaveClass('custom-desc')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLParagraphElement | null }
      render(<CardDescription ref={ref}>Description</CardDescription>)
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement)
    })
  })

  describe('CardContent', () => {
    it('renders card content', () => {
      render(<CardContent data-testid="test-content">Main content</CardContent>)
      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })

    it('has proper styling classes', () => {
      render(<CardContent data-testid="test-content">Content</CardContent>)
      const content = screen.getByTestId('test-content')
      expect(content).toHaveClass('p-6', 'pt-0')
    })

    it('applies custom className', () => {
      render(<CardContent className="custom-content" data-testid="test-content">Content</CardContent>)
      expect(screen.getByTestId('test-content')).toHaveClass('custom-content')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLDivElement | null }
      render(<CardContent ref={ref}>Content</CardContent>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('renders complex children', () => {
      render(
        <CardContent>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </CardContent>
      )
      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
    })
  })

  describe('CardFooter', () => {
    it('renders card footer', () => {
      render(<CardFooter data-testid="test-footer">Footer content</CardFooter>)
      expect(screen.getByTestId('test-footer')).toBeInTheDocument()
    })

    it('has proper styling classes', () => {
      render(<CardFooter data-testid="test-footer">Footer</CardFooter>)
      const footer = screen.getByTestId('test-footer')
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })

    it('applies custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="test-footer">Footer</CardFooter>)
      expect(screen.getByTestId('test-footer')).toHaveClass('custom-footer')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null as HTMLDivElement | null }
      render(<CardFooter ref={ref}>Footer</CardFooter>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('Card Composition', () => {
    it('renders complete card structure', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByTestId('full-card')).toBeInTheDocument()
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Description')).toBeInTheDocument()
      expect(screen.getByText('Main content goes here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    it('works without optional sections', () => {
      render(
        <Card>
          <CardContent>Only content</CardContent>
        </Card>
      )

      expect(screen.getByText('Only content')).toBeInTheDocument()
    })

    it('supports multiple cards', () => {
      render(
        <div>
          <Card data-testid="card-1">
            <CardTitle>Card 1</CardTitle>
          </Card>
          <Card data-testid="card-2">
            <CardTitle>Card 2</CardTitle>
          </Card>
        </div>
      )

      expect(screen.getByTestId('card-1')).toBeInTheDocument()
      expect(screen.getByTestId('card-2')).toBeInTheDocument()
    })

    it('maintains proper hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      )

      const title = screen.getByText('Title')
      const content = screen.getByText('Content')

      // Title should come before content in document order
      expect(title.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  describe('Accessibility for Complete Card', () => {
    it('has no accessibility violations with full structure', async () => {
      const { container } = render(
        <Card role="article" aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title">Accessible Card</CardTitle>
            <CardDescription>This card follows accessibility best practices</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content with proper semantic structure</p>
          </CardContent>
          <CardFooter>
            <button type="button">Primary Action</button>
          </CardFooter>
        </Card>
      )

      const results = await runAxe(container)
      expectNoA11yViolations(results)
    })
  })
})
