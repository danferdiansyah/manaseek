import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  api,
  clearTokens,
  getTokens,
  loginWithGoogleToken,
  saveTokens,
  setUnauthenticatedHandler,
} from './api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // A stored token is worth verifying; no token at all is already an answer.
  const [status, setStatus] = useState(() => (getTokens().accessToken ? 'loading' : 'signedOut'))
  const [error, setError] = useState(null)

  const signOutLocally = useCallback(() => {
    clearTokens()
    setUser(null)
    setStatus('signedOut')
  }, [])

  // A refresh token that stops working anywhere in the app lands here.
  useEffect(() => {
    setUnauthenticatedHandler(signOutLocally)
  }, [signOutLocally])

  // Restore a session on load: the stored token is only trustworthy if the
  // API still accepts it.
  useEffect(() => {
    if (status !== 'loading') return

    let cancelled = false
    api
      .get('/auth/me')
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus('signedIn')
      })
      .catch(() => {
        if (!cancelled) signOutLocally()
      })

    return () => {
      cancelled = true
    }
  }, [status, signOutLocally])

  const signInWithSession = useCallback(async (session) => {
    saveTokens(session)
    const me = await api.get('/auth/me')
    const nextUser = {
      ...me,
      isNewUser: session.user?.isNewUser ?? false,
      needsOnboarding: me.needsOnboarding ?? session.user?.needsOnboarding ?? false,
    }
    setUser(nextUser)
    setStatus('signedIn')
    return nextUser
  }, [])

  const signInWithGoogle = useCallback(async (idToken) => {
    setError(null)
    try {
      return await signInWithSession(await loginWithGoogleToken(idToken))
    } catch (err) {
      setError(err.message ?? 'Gagal masuk')
      throw err
    }
  }, [signInWithSession])

  const completeOnboarding = useCallback(async (details) => {
    setError(null)
    try {
      return await signInWithSession(await api.post('/auth/onboarding', details))
    } catch (err) {
      setError(err.message ?? 'Gagal menyimpan data pendaftaran')
      throw err
    }
  }, [signInWithSession])

  const signOut = useCallback(async () => {
    const { refreshToken } = getTokens()
    if (refreshToken) {
      // Best effort: the local session is cleared either way.
      await api.post('/auth/logout', { refreshToken }).catch(() => {})
    }
    signOutLocally()
  }, [signOutLocally])

  const value = useMemo(
    () => ({ user, status, error, signInWithGoogle, completeOnboarding, signOut }),
    [user, status, error, signInWithGoogle, completeOnboarding, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
