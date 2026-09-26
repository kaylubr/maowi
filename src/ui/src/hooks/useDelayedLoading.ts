import { useEffect, useState } from 'react'

export function useDelayedLoading(pending: boolean, delay = 300): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!pending) {
      return
    }

    const timer = setTimeout(() => setVisible(true), delay)
    return () => {
      clearTimeout(timer)
      setVisible(false)
    }
  }, [pending, delay])

  return pending && visible
}
