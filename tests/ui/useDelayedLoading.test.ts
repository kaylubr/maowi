import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDelayedLoading } from '../../src/ui/src/hooks/useDelayedLoading'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDelayedLoading', () => {
  it('stays hidden until the full delay has elapsed', () => {
    const { result } = renderHook(() => useDelayedLoading(true, 300))

    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  it('never flashes for work that finishes inside the delay', () => {
    const { result, rerender } = renderHook(
      ({ pending }: { pending: boolean }) => useDelayedLoading(pending, 300),
      { initialProps: { pending: true } },
    )

    act(() => {
      vi.advanceTimersByTime(100)
    })
    rerender({ pending: false })
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current).toBe(false)
  })

  it('hides immediately once pending clears', () => {
    const { result, rerender } = renderHook(
      ({ pending }: { pending: boolean }) => useDelayedLoading(pending, 300),
      { initialProps: { pending: true } },
    )

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe(true)

    rerender({ pending: false })

    expect(result.current).toBe(false)
  })

  it('stays hidden while idle', () => {
    const { result } = renderHook(() => useDelayedLoading(false, 300))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current).toBe(false)
  })

  it('delays again after a completed show/hide cycle', () => {
    const { result, rerender } = renderHook(
      ({ pending }: { pending: boolean }) => useDelayedLoading(pending, 300),
      { initialProps: { pending: true } },
    )
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe(true)

    rerender({ pending: false })
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    rerender({ pending: true })

    expect(result.current).toBe(false)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe(true)
  })
})
