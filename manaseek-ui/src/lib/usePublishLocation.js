import { useEffect, useRef, useState } from 'react'
import { api } from './api'

/** Metres a mutawif must move before a new fix is worth sending. */
const MIN_MOVE_M = 40
/** Send at least this often anyway, so the fix never goes stale on the server. */
const MAX_SILENCE_MS = 3 * 60 * 1000
/** Ignore fixes this coarse; they would move the pin without adding truth. */
const MAX_USABLE_ACCURACY_M = 500

const distanceMetres = (a, b) => {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dPhi = toRad(b.latitude - a.latitude)
  const dLambda = toRad(b.longitude - a.longitude)
  const h =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLambda / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Keeps the mutawif's position on the server current while they are online.
 *
 * Sends on movement rather than on a timer: a mutawif standing in the Haram
 * for an hour should cost one request, not sixty, and a mutawif walking to a
 * jamaah should show up where they actually are. A floor on silence keeps the
 * server-side freshness check satisfied while they stand still.
 */
export function usePublishLocation({ enabled }) {
  const [state, setState] = useState({ status: 'idle', accuracy: null, at: null })
  const lastSent = useRef(null)
  const sending = useRef(false)

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) {
      lastSent.current = null
      return
    }

    let cancelled = false

    const publish = async (coords) => {
      if (sending.current) return
      sending.current = true

      try {
        await api.patch('/mutawif/me/location', {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: Math.round(coords.accuracy),
        })
        if (cancelled) return
        lastSent.current = { latitude: coords.latitude, longitude: coords.longitude, at: Date.now() }
        setState({ status: 'sent', accuracy: Math.round(coords.accuracy), at: new Date() })
      } catch {
        if (!cancelled) setState((s) => ({ ...s, status: 'failed' }))
      } finally {
        sending.current = false
      }
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (cancelled || coords.accuracy > MAX_USABLE_ACCURACY_M) return

        const previous = lastSent.current
        const moved = previous ? distanceMetres(previous, coords) : Infinity
        const silent = previous ? Date.now() - previous.at : Infinity

        if (moved >= MIN_MOVE_M || silent >= MAX_SILENCE_MS) publish(coords)
      },
      () => {
        if (!cancelled) setState((s) => ({ ...s, status: 'denied' }))
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )

    return () => {
      cancelled = true
      navigator.geolocation.clearWatch(watchId)
    }
  }, [enabled])

  return state
}
