import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { config } from '../../src/ui/src/config'
import { routes } from '../../src/ui/src/routes'

export type StubResponse = {
  method?: string
  path: string
  status?: number
  body?: unknown
}

export type RecordedRequest = {
  method: string
  path: string
  body: unknown
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function stubApi(responses: StubResponse[]) {
  const stubs = [...responses]
  const calls: string[] = []
  const requests: RecordedRequest[] = []

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input).slice(config.apiBaseUrl.length)
    const method = (init?.method ?? 'GET').toUpperCase()
    calls.push(`${method} ${path}`)
    requests.push({ method, path, body: init?.body })

    const match = stubs.find(
      (stub) => stub.path === path && (stub.method ?? 'GET').toUpperCase() === method,
    )

    if (!match) {
      return jsonResponse({ detail: `No stub for ${method} ${path}` }, 500)
    }

    const status = match.status ?? 200
    return status === 204
      ? new Response(null, { status })
      : jsonResponse(match.body ?? {}, status)
  })

  vi.stubGlobal('fetch', fetchMock)

  return {
    fetchMock,
    calls,
    requests,
    replace(next: StubResponse[]) {
      stubs.splice(0, stubs.length, ...next)
    },
  }
}

export function renderApp(initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { router }
}
