import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('merges multiple class names', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('handles single class name', () => {
      const result = cn('single-class')
      expect(result).toBe('single-class')
    })

    it('handles empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('filters out falsy values', () => {
      const result = cn('valid', false, 'another', null, undefined, 'last')
      expect(result).toContain('valid')
      expect(result).toContain('another')
      expect(result).toContain('last')
      expect(result).not.toContain('false')
      expect(result).not.toContain('null')
      expect(result).not.toContain('undefined')
    })

    it('handles conditional class names', () => {
      const isActive = true
      const isDisabled = false

      const result = cn(
        'base',
        isActive && 'active',
        isDisabled && 'disabled'
      )

      expect(result).toContain('base')
      expect(result).toContain('active')
      expect(result).not.toContain('disabled')
    })

    it('merges Tailwind classes correctly', () => {
      // twMerge should handle conflicting Tailwind classes
      const result = cn('px-2', 'px-4')

      // Should keep only the last conflicting class
      expect(result).toBe('px-4')
    })

    it('handles Tailwind class conflicts with multiple properties', () => {
      const result = cn('px-2 py-1', 'px-4')

      expect(result).toContain('py-1')
      expect(result).toContain('px-4')
      expect(result).not.toContain('px-2')
    })

    it('preserves non-conflicting Tailwind classes', () => {
      const result = cn('text-red-500', 'bg-blue-500')

      expect(result).toContain('text-red-500')
      expect(result).toContain('bg-blue-500')
    })

    it('handles array of class names', () => {
      const result = cn(['class1', 'class2'])

      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('handles object syntax for conditional classes', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'highlighted': true
      })

      expect(result).toContain('active')
      expect(result).toContain('highlighted')
      expect(result).not.toContain('disabled')
    })

    it('handles mixed inputs', () => {
      const result = cn(
        'base',
        ['array1', 'array2'],
        { 'object': true },
        'string'
      )

      expect(result).toContain('base')
      expect(result).toContain('array1')
      expect(result).toContain('array2')
      expect(result).toContain('object')
      expect(result).toContain('string')
    })

    it('handles whitespace in class names', () => {
      const result = cn('  class1  ', '  class2  ')

      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('handles duplicate class names', () => {
      const result = cn('duplicate', 'other', 'duplicate')

      // cn merges classes but may keep duplicates
      expect(result).toContain('duplicate')
      expect(result).toContain('other')
    })

    it('works with component variant patterns', () => {
      const variant = 'primary'
      const size = 'lg'

      const result = cn(
        'base-button',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-gray-500',
        size === 'sm' && 'text-sm',
        size === 'lg' && 'text-lg'
      )

      expect(result).toContain('base-button')
      expect(result).toContain('bg-blue-500')
      expect(result).toContain('text-lg')
      expect(result).not.toContain('bg-gray-500')
      expect(result).not.toContain('text-sm')
    })

    it('handles Tailwind responsive classes', () => {
      const result = cn('w-full', 'md:w-1/2', 'lg:w-1/3')

      expect(result).toContain('w-full')
      expect(result).toContain('md:w-1/2')
      expect(result).toContain('lg:w-1/3')
    })

    it('handles Tailwind pseudo-class variants', () => {
      const result = cn('hover:bg-blue-500', 'focus:ring-2', 'active:scale-95')

      expect(result).toContain('hover:bg-blue-500')
      expect(result).toContain('focus:ring-2')
      expect(result).toContain('active:scale-95')
    })

    it('resolves Tailwind conflicts correctly', () => {
      const result = cn(
        'bg-red-500',
        'hover:bg-blue-500',
        'bg-green-500' // Should override bg-red-500 but not hover:bg-blue-500
      )

      expect(result).not.toContain('bg-red-500')
      expect(result).toContain('bg-green-500')
      expect(result).toContain('hover:bg-blue-500')
    })

    it('handles dark mode classes', () => {
      const result = cn('bg-white', 'dark:bg-gray-900')

      expect(result).toContain('bg-white')
      expect(result).toContain('dark:bg-gray-900')
    })

    it('handles arbitrary values', () => {
      const result = cn('bg-[#1da1f2]', 'text-[14px]')

      expect(result).toContain('bg-[#1da1f2]')
      expect(result).toContain('text-[14px]')
    })

    it('handles important modifier', () => {
      const result = cn('!bg-red-500', 'text-white')

      expect(result).toContain('!bg-red-500')
      expect(result).toContain('text-white')
    })

    it('returns consistent results for same inputs', () => {
      const input = ['class1', 'class2', { 'class3': true }]
      const result1 = cn(...input)
      const result2 = cn(...input)

      expect(result1).toBe(result2)
    })

    it('works in real-world UI component pattern', () => {
      // Simulating how it's used in actual components
      const baseStyles = 'rounded-md border px-3 py-2'
      const variantStyles = 'bg-primary text-primary-foreground'
      const customStyles = 'custom-override'

      const result = cn(baseStyles, variantStyles, customStyles)

      expect(result).toContain('rounded-md')
      expect(result).toContain('border')
      expect(result).toContain('px-3')
      expect(result).toContain('py-2')
      expect(result).toContain('bg-primary')
      expect(result).toContain('text-primary-foreground')
      expect(result).toContain('custom-override')
    })
  })
})
