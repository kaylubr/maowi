import { useEffect, useRef } from 'react'

import { config } from '../../config'
import { useAuth } from '../../hooks/useAuth'
import { AuthAlert } from './AuthAlert'

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

let googleInitialized = false

export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth()
  const signInRef = useRef(loginWithGoogle.mutate)
  signInRef.current = loginWithGoogle.mutate
  const containerRef = useRef<HTMLDivElement>(null)
  const renderedWidthRef = useRef<number | null>(null)

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

      if (!googleInitialized) {
        services.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: (response) => signInRef.current(response.credential),
        })
        googleInitialized = true
      }

      // Google caps the button at 400px wide.
      const width = Math.min(container.clientWidth, 400)
      if (renderedWidthRef.current === width) {
        return
      }
      renderedWidthRef.current = width

      container.replaceChildren()
      services.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width,
      })
    }

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_SCRIPT_SRC}"]`,
    )
    if (window.google !== undefined) {
      render()
    } else {
      if (script === null) {
        script = document.createElement('script')
        script.src = GOOGLE_SCRIPT_SRC
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
      script.addEventListener('load', render)
    }

    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => render())
    observer?.observe(container)

    return () => {
      observer?.disconnect()
      script?.removeEventListener('load', render)
    }
  }, [])

  return (
    <div className="auth-google">
      <div className="auth-google-control" ref={containerRef} />
      <button
        type="button"
        className="btn btn-outline-secondary auth-google-visual"
        aria-hidden="true"
        tabIndex={-1}
      >
        <GoogleMark />
        Continue with Google
      </button>
      {loginWithGoogle.isError ? (
        <AuthAlert>{loginWithGoogle.error.message}</AuthAlert>
      ) : null}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}