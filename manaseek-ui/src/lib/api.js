/**
 * Thin client over the Manaseek API.
 *
 * The API is served from the same origin at /api (the web app's vercel.json
 * rewrites it to the API deployment), so there is no base URL to configure and
 * no CORS to negotiate.
 */
const BASE = '/api'

const ACCESS_KEY = 'manaseek.accessToken'
const REFRESH_KEY = 'manaseek.refreshToken'

let onUnauthenticated = () => {}

export function setUnauthenticatedHandler(handler) {
  onUnauthenticated = handler
}

export function getTokens() {
  try {
    return {
      accessToken: localStorage.getItem(ACCESS_KEY),
      refreshToken: localStorage.getItem(REFRESH_KEY),
    }
  } catch {
    // Private browsing can throw on access; treat it as a signed-out session.
    return { accessToken: null, refreshToken: null }
  }
}

export function saveTokens({ accessToken, refreshToken }) {
  try {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  } catch {
    // Nothing to do: the session simply will not survive a reload.
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    // Ignore.
  }
}

export class ApiError extends Error {
  constructor({ code, message, details, status }) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
    this.status = status
  }
}

async function parse(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { error: { code: 'INTERNAL_ERROR', message: text.slice(0, 200) } }
  }
}

async function rawRequest(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await parse(response)

  if (!response.ok) {
    const error = payload?.error ?? {}
    throw new ApiError({
      code: error.code ?? 'INTERNAL_ERROR',
      message: error.message ?? `Request failed with status ${response.status}`,
      details: error.details,
      status: response.status,
    })
  }

  return payload
}

/**
 * Exchanges the stored refresh token for a new pair. Runs at most once per
 * failed request; if it fails the session is over.
 */
async function refreshSession() {
  const { refreshToken } = getTokens()
  if (!refreshToken) return null

  try {
    const tokens = await rawRequest('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })
    saveTokens(tokens)
    return tokens.accessToken
  } catch {
    clearTokens()
    onUnauthenticated()
    return null
  }
}

export async function request(path, options = {}) {
  const { accessToken } = getTokens()

  try {
    return await rawRequest(path, { ...options, token: accessToken })
  } catch (error) {
    const expired =
      error instanceof ApiError &&
      error.status === 401 &&
      (error.code === 'TOKEN_INVALID' || error.code === 'UNAUTHORIZED')

    if (!expired || options.retried) throw error

    const fresh = await refreshSession()
    if (!fresh) throw error

    return rawRequest(path, { ...options, token: fresh, retried: true })
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
}

/** Public: no session needed, and a failure here must not trigger a refresh. */
export function loginWithGoogleToken(idToken) {
  return rawRequest('/auth/google', { method: 'POST', body: { idToken } })
}
