import { config } from '../config'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(buildMessage(status, body))
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function extractDetail(body: unknown): string | null {
  const isErrorObject = typeof body === 'object' && body !== null && 'detail' in body
  if (!isErrorObject) {
    return null
  }

  const detail = (body as { detail: unknown }).detail
  return typeof detail === 'string' ? detail : null
}

function buildMessage(status: number, body: unknown): string {
  return extractDetail(body) ?? `Request failed with status ${status}`
}

function buildHeaders(options: RequestInit): HeadersInit | undefined {
  const hasBody = options.body !== undefined && options.body !== null
  const isFormData = options.body instanceof FormData

  if (!hasBody || isFormData) {
    return options.headers
  }

  return { 'Content-Type': 'application/json', ...options.headers }
}

export function isApiError(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  if (text === '') {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: buildHeaders(options),
  })

  const body = await readBody(response)

  if (!response.ok) {
    throw new ApiError(response.status, body)
  }

  return body as T
}
