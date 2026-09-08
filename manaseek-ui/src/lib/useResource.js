import { useCallback, useEffect, useState } from 'react'

/**
 * Loads one remote resource and exposes the three states a screen has to
 * render: loading, ready, failed.
 *
 * State is only ever set from the async continuation, never synchronously
 * inside the effect, which is what the React Compiler lint rules require and
 * what keeps a fetch from cascading extra renders.
 *
 * `fetcher` must be a useCallback so its identity is the dependency.
 */
export function useResource(fetcher) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data, error: null })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ status: 'error', data: null, error: error.message ?? 'Terjadi kesalahan' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [fetcher, reloadKey])

  // Called from event handlers, so setting state here is fine.
  const reload = useCallback(() => {
    setState({ status: 'loading', data: null, error: null })
    setReloadKey((key) => key + 1)
  }, [])

  return { ...state, reload }
}
