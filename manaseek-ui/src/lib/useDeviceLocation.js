import { useCallback, useEffect, useRef, useState } from 'react'

/** Masjidil Haram. Stands in until the device produces a fix of its own. */
export const FALLBACK_POSITION = {
  latitude: 21.4225,
  longitude: 39.8262,
  accuracy: null,
  label: 'Masjidil Haram, Makkah',
  precise: false,
}

/** Good enough to stop burning the radio: a fix this tight will not improve usefully. */
const TARGET_ACCURACY_M = 30
/** How long to keep refining before settling for the best fix so far. */
const REFINE_BUDGET_MS = 20_000

/**
 * Device location, in two stages.
 *
 * A single getCurrentPosition call forces a choice between fast and accurate:
 * without enableHighAccuracy it returns a wifi fix that can be kilometres off,
 * and with it the jamaah waits ten seconds staring at nothing. So we do both —
 * take a coarse fix immediately so the screen has an answer, then keep a
 * high-accuracy watch running and adopt each fix that is genuinely tighter
 * than the last.
 *
 * The watch stops once the fix is good enough or the budget runs out, because
 * a GPS left running is a battery a jamaah needs for the rest of the day.
 */
export function useDeviceLocation({ watch = false } = {}) {
  const [position, setPosition] = useState(FALLBACK_POSITION)
  const [status, setStatus] = useState(() =>
    typeof navigator !== 'undefined' && navigator.geolocation ? 'locating' : 'unsupported',
  )
  const [attempt, setAttempt] = useState(0)
  const bestAccuracy = useRef(Infinity)

  const adopt = useCallback((coords, { force = false } = {}) => {
    // Later fixes are only better if they are tighter; a GPS that briefly
    // loses satellites must not drag the map back to a cell-tower guess.
    if (!force && coords.accuracy > bestAccuracy.current) return

    bestAccuracy.current = coords.accuracy
    setPosition({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      label: 'Lokasi kamu saat ini',
      precise: true,
    })
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return

    let cancelled = false
    let watchId = null
    let settleTimer = null

    bestAccuracy.current = Infinity

    const stopWatching = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
      }
    }

    const fail = (error) => {
      if (cancelled) return
      setStatus(error?.code === error?.PERMISSION_DENIED ? 'denied' : 'unavailable')
    }

    // Stage one: whatever the device can produce right now.
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (cancelled) return
        adopt(coords, { force: true })
      },
      (error) => {
        // Only fatal if the refining watch also fails; permission denial is.
        if (error.code === error.PERMISSION_DENIED) fail(error)
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    )

    // Stage two: refine, and keep refining if the caller is tracking movement.
    watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (cancelled) return
        adopt(coords)

        if (!watch && coords.accuracy <= TARGET_ACCURACY_M) {
          stopWatching()
          setStatus('ready')
        }
      },
      (error) => {
        if (bestAccuracy.current === Infinity) fail(error)
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )

    if (!watch) {
      settleTimer = setTimeout(() => {
        stopWatching()
        if (!cancelled) setStatus((s) => (s === 'locating' ? 'ready' : s))
      }, REFINE_BUDGET_MS)
    }

    return () => {
      cancelled = true
      clearTimeout(settleTimer)
      stopWatching()
    }
  }, [adopt, watch, attempt])

  /** Ask again from scratch, for a "cari ulang" control. */
  const refresh = useCallback(() => {
    setStatus('locating')
    setAttempt((n) => n + 1)
  }, [])

  return { ...position, status, refresh }
}

/** "sekitar 12 m" — accuracy stated in words the jamaah can act on. */
export function formatAccuracy(accuracy) {
  if (accuracy == null) return ''
  if (accuracy < 1000) return `akurasi sekitar ${Math.round(accuracy)} m`
  return `akurasi sekitar ${(accuracy / 1000).toFixed(1)} km`
}
