import { useEffect, useState } from 'react'

/** Masjidil Haram. Used until the browser hands us a real position. */
export const FALLBACK_POSITION = {
  latitude: 21.4225,
  longitude: 39.8262,
  label: 'Masjidil Haram, Makkah',
  precise: false,
}

/**
 * Location is a nicety everywhere it is used: every screen has a sensible
 * answer from the fallback while the permission prompt is still open, or if
 * the jamaah declines it.
 */
export function useDeviceLocation() {
  const [position, setPosition] = useState(FALLBACK_POSITION)

  useEffect(() => {
    if (!navigator.geolocation) return

    let cancelled = false
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (cancelled) return
        setPosition({
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: 'Lokasi kamu saat ini',
          precise: true,
        })
      },
      () => {},
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )

    return () => {
      cancelled = true
    }
  }, [])

  return position
}
