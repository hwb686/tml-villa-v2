import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils'

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('should handle undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
  })

  it('should handle null values', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar')
  })

  it('should merge tailwind classes correctly', () => {
    // twMerge should dedupe conflicting classes
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('should handle object syntax', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo')
  })

  it('should handle array syntax', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('should handle complex combinations', () => {
    const result = cn(
      'base-class',
      'text-red-500',
      { 'font-bold': true, 'font-normal': false },
      ['mt-4', 'mb-2']
    )
    expect(result).toContain('base-class')
    expect(result).toContain('text-red-500')
    expect(result).toContain('font-bold')
    expect(result).toContain('mt-4')
    expect(result).toContain('mb-2')
  })
})
