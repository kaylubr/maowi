import { useLocation } from 'react-router-dom'

type RedirectState = {
  from?: { pathname?: string }
}

export function useRedirectTarget(): string {
  const location = useLocation()
  const from = (location.state as RedirectState | null)?.from?.pathname

  return typeof from === 'string' && from !== '' ? from : '/dashboard'
}
