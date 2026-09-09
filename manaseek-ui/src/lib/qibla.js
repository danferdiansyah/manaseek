/**
 * Qibla direction.
 *
 * The bearing is the initial heading of the great circle to the Kaaba, which
 * is what a compass needle should point along — not the rhumb line a flat map
 * would suggest. Over Jakarta to Makkah the two differ by tens of degrees.
 */
export const KAABA = { latitude: 21.4225, longitude: 39.8262 }

const toRad = (d) => (d * Math.PI) / 180
const toDeg = (r) => (r * 180) / Math.PI

/** Degrees clockwise from true north. */
export function qiblaBearing({ latitude, longitude }) {
  const phi1 = toRad(latitude)
  const phi2 = toRad(KAABA.latitude)
  const dLambda = toRad(KAABA.longitude - longitude)

  const y = Math.sin(dLambda)
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLambda)

  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export function distanceToKaabaKm({ latitude, longitude }) {
  const R = 6371
  const dPhi = toRad(KAABA.latitude - latitude)
  const dLambda = toRad(KAABA.longitude - longitude)
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(toRad(latitude)) * Math.cos(toRad(KAABA.latitude)) * Math.sin(dLambda / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Inside the Haram the bearing is meaningless; say where they are instead. */
export const AT_KAABA_RADIUS_KM = 1

const POINTS = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut']

/** "Barat Laut" reads better than "295°" for most jamaah. */
export function compassPoint(bearing) {
  return POINTS[Math.round(((bearing % 360) + 360) % 360 / 45) % 8]
}
