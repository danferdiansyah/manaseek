import { useCallback, useEffect, useState } from 'react'

/**
 * Device compass heading in degrees from true north.
 *
 * Three states matter to the caller, because a compass is the one input that
 * is routinely unavailable: 'unsupported' (desktop, or no magnetometer),
 * 'needs-permission' (iOS requires a user gesture before it will report), and
 * 'ready'. The qibla screen stays useful in all three.
 */
function initialStatus() {
  if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return 'unsupported'
  // iOS gates the sensor behind a user gesture; everyone else can just listen.
  if (typeof window.DeviceOrientationEvent.requestPermission === 'function') return 'needs-permission'
  return 'listening'
}

export function useCompassHeading() {
  const [heading, setHeading] = useState(null)
  const [status, setStatus] = useState(initialStatus)

  const handle = useCallback((event) => {
    // iOS reports a true-north heading directly; everyone else reports alpha,
    // which counts the other way round.
    const ios = event.webkitCompassHeading
    if (typeof ios === 'number' && !Number.isNaN(ios)) {
      setHeading(ios)
      return
    }
    if (typeof event.alpha === 'number') {
      setHeading((360 - event.alpha) % 360)
    }
  }, [])

  const listen = useCallback(() => {
    const name = 'ondeviceorientationabsolute' in window
      ? 'deviceorientationabsolute'
      : 'deviceorientation'
    window.addEventListener(name, handle, true)
    return () => window.removeEventListener(name, handle, true)
  }, [handle])

  const requestAccess = useCallback(async () => {
    const requestPermission = window.DeviceOrientationEvent?.requestPermission
    if (typeof requestPermission !== 'function') {
      setStatus('listening')
      return
    }

    try {
      const result = await requestPermission.call(window.DeviceOrientationEvent)
      setStatus(result === 'granted' ? 'listening' : 'denied')
    } catch {
      setStatus('denied')
    }
  }, [])

  useEffect(() => {
    if (status !== 'listening') return

    const stop = listen()
    // Chrome on a desktop, and phones without a magnetometer, subscribe
    // happily and then never fire. Give up rather than leave the jamaah
    // staring at a dial that will not move.
    const giveUp = setTimeout(() => {
      setHeading((current) => {
        if (current === null) setStatus('no-signal')
        return current
      })
    }, 2500)

    return () => {
      clearTimeout(giveUp)
      stop()
    }
  }, [status, listen])

  return { heading, status, requestAccess }
}
