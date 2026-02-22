import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useApiState } from '../hooks/useApiState'

describe('useApiState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useApiState<string>())
    
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should initialize with initial data', () => {
    const { result } = renderHook(() => useApiState('initial'))
    
    expect(result.current.data).toBe('initial')
  })

  it('should update data', () => {
    const { result } = renderHook(() => useApiState<string>())
    
    act(() => {
      result.current.setData('new data')
    })
    
    expect(result.current.data).toBe('new data')
  })

  it('should update loading state', () => {
    const { result } = renderHook(() => useApiState<string>())
    
    act(() => {
      result.current.setLoading(true)
    })
    
    expect(result.current.isLoading).toBe(true)
  })

  it('should update error state', () => {
    const { result } = renderHook(() => useApiState<string>())
    
    act(() => {
      result.current.setError('Something went wrong')
    })
    
    expect(result.current.error).toBe('Something went wrong')
  })

  it('should reset all states', () => {
    const { result } = renderHook(() => useApiState<string>())
    
    // Set some values
    act(() => {
      result.current.setData('data')
      result.current.setLoading(true)
      result.current.setError('error')
    })
    
    // Reset
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should reset to initial data', () => {
    const { result } = renderHook(() => useApiState('initial'))
    
    act(() => {
      result.current.setData('changed')
    })
    
    expect(result.current.data).toBe('changed')
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.data).toBe('initial')
  })
})
