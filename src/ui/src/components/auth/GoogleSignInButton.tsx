import { useEffect, useRef } from 'react'

import { config } from '../../config'
import { useAuth } from '../../hooks/useAuth'
import { ErrorText } from '../ui/typography'

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

type GoogleCredentialResponse = {
  credential: string
}

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
      }) => void
      renderButton: (
        element: HTMLElement,
        options: Record<string, string | number>,
      ) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityServices
  }
}

export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (container === null) {
      return
    }

    const render = () => {
      const services = window.google
      if (services === undefined) {
        return
      }

      services.accounts.id.initialize({
        client_id: config.googleClientId,
        callback: (response) => loginWithGoogle.mutate(response.credential),
      })
      services.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: container.clientWidth,
      })
    }

    if (window.google !== undefined) {
      render()
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', render)
    document.head.appendChild(script)

    return () => script.removeEventListener('load', render)
  }, [loginWithGoogle.mutate])

  return (
    <div>
      <div ref={containerRef} />
      {loginWithGoogle.isError ? (
        <ErrorText>{loginWithGoogle.error.message}</ErrorText>
      ) : null}
    </div>
  )
}
