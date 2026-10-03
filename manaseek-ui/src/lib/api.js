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
let sessionVersion = 0
let refreshFlight = null

export const getSessionVersion = () => sessionVersion

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
  sessionVersion++
  persistTokens({ accessToken, refreshToken })
}

function persistTokens({ accessToken, refreshToken }) {
  try {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  } catch {
    // Nothing to do: the session simply will not survive a reload.
  }
}

export function clearTokens() {
  sessionVersion++
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
 * Exchanges the stored refresh token once for concurrent requests. Session
 * changes invalidate in-flight work; temporary failures preserve credentials.
 */
function assertCurrent(version) {
  if (version !== sessionVersion) {
    throw new ApiError({ code: 'SESSION_CHANGED', message: 'Sesi akun sudah berubah.', status: 401 })
  }
}

async function refreshSession(version) {
  assertCurrent(version)
  const { refreshToken } = getTokens()
  if (!refreshToken) return null
  if (refreshFlight?.version === version) return refreshFlight.promise
  const flight = {
    version,
    promise: (async () => {
      try {
        const tokens = await rawRequest('/auth/refresh', {
          method: 'POST', body: { refreshToken },
        })
        assertCurrent(version)
        persistTokens(tokens)
        return tokens.accessToken
      } catch (error) {
        assertCurrent(version)
        // Network/provider outages do not invalidate a recoverable session.
        if (error instanceof ApiError && [401, 403].includes(error.status)) {
          clearTokens()
          onUnauthenticated()
        }
        throw error
      }
    })(),
  }
  refreshFlight = flight
  try {
    return await flight.promise
  } finally {
    if (refreshFlight === flight) refreshFlight = null
  }
}

export async function request(path, options = {}) {
  const version = sessionVersion
  const { accessToken } = getTokens()

  try {
    const result = await rawRequest(path, { ...options, token: accessToken })
    assertCurrent(version)
    return result
  } catch (error) {
    assertCurrent(version)
    const expired =
      error instanceof ApiError &&
      error.status === 401 &&
      (error.code === 'TOKEN_INVALID' || error.code === 'UNAUTHORIZED')

    if (!expired || options.retried) throw error

    // A late 401 can arrive after another request already rotated the token.
    const fresh = getTokens().accessToken !== accessToken
      ? getTokens().accessToken : await refreshSession(version)
    assertCurrent(version)
    if (!fresh) throw error

    const result = await rawRequest(path, { ...options, token: fresh, retried: true })
    assertCurrent(version)
    return result
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
}

/** Public: no session needed, and a failure here must not trigger a refresh. */
export function loginWithGoogleToken(idToken) {
  return rawRequest('/auth/google', { method: 'POST', body: { idToken } })
}
