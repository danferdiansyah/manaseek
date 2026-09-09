/**
 * Prayer times computed on the device.
 *
 * Computed rather than fetched on purpose: jamaah lose signal constantly in
 * Makkah and Mina, and a prayer time that only works with data is not a prayer
 * time. The astronomy here is the standard solar-position method used by
 * PrayTimes and the Kemenag tables.
 */
const KAABA = { latitude: 21.4225, longitude: 39.8262 }

const dsin = (d) => Math.sin((d * Math.PI) / 180)
const dcos = (d) => Math.cos((d * Math.PI) / 180)
const dtan = (d) => Math.tan((d * Math.PI) / 180)
const darcsin = (x) => (Math.asin(x) * 180) / Math.PI
const darccos = (x) => (Math.acos(x) * 180) / Math.PI
const darctan2 = (y, x) => (Math.atan2(y, x) * 180) / Math.PI
const darccot = (x) => (Math.atan(1 / x) * 180) / Math.PI

const fix = (a, b) => {
  const v = a - b * Math.floor(a / b)
  return v < 0 ? v + b : v
}
const fixHour = (h) => fix(h, 24)

/**
 * Calculation methods differ by authority, and the difference is real: about
 * twenty minutes at Fajr. Saudi mosques follow Umm al-Qura, Indonesia follows
 * Kemenag, so the method follows the jamaah rather than being a setting they
 * would have to understand.
 */
export const METHODS = {
  UMM_AL_QURA: {
    id: 'UMM_AL_QURA',
    label: 'Umm al-Qura',
    note: 'Standar Arab Saudi',
    fajrAngle: 18.5,
    isha: { minutesAfterMaghrib: 90 },
  },
  KEMENAG: {
    id: 'KEMENAG',
    label: 'Kemenag RI',
    note: 'Standar Indonesia',
    fajrAngle: 20,
    isha: { angle: 18 },
  },
}

/** Rough Saudi bounding box; inside it, follow the local authority. */
export function methodFor({ latitude, longitude }) {
  const inSaudi = latitude > 15.5 && latitude < 32.5 && longitude > 34 && longitude < 56
  return inSaudi ? METHODS.UMM_AL_QURA : METHODS.KEMENAG
}

function julianDate(year, month, day) {
  if (month <= 2) {
    year -= 1
    month += 12
  }
  const a = Math.floor(year / 100)
  const b = 2 - a + Math.floor(a / 4)
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    b -
    1524.5
  )
}

/** Declination of the sun and the equation of time, both in degrees/hours. */
function sunPosition(jd) {
  const d = jd - 2451545.0
  const g = fix(357.529 + 0.98560028 * d, 360)
  const q = fix(280.459 + 0.98564736 * d, 360)
  const l = fix(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g), 360)
  const e = 23.439 - 0.00000036 * d

  const declination = darcsin(dsin(e) * dsin(l))
  const rightAscension = fix(darctan2(dcos(e) * dsin(l), dcos(l)) / 15, 24)
  const equationOfTime = q / 15 - rightAscension

  return { declination, equationOfTime }
}

function createSolar(jd, latitude) {
  const at = (hoursFromMidnight) => sunPosition(jd + hoursFromMidnight / 24)

  const midDay = (t) => fixHour(12 - at(t).equationOfTime)

  /**
   * Time at which the sun sits `angle` degrees below the horizon.
   * `direction` picks the morning ('ccw') or evening ('cw') crossing.
   */
  const sunAngleTime = (angle, t, direction) => {
    const { declination } = at(t)
    const numerator = -dsin(angle) - dsin(declination) * dsin(latitude)
    const denominator = dcos(declination) * dcos(latitude)
    const ratio = numerator / denominator

    // Above the polar circle the sun may never reach the angle at all.
    if (ratio > 1 || ratio < -1) return null

    const offset = darccos(ratio) / 15
    return midDay(t) + (direction === 'ccw' ? -offset : offset)
  }

  /** Asr begins when an object's shadow equals `factor` times its length. */
  const asrTime = (factor, t) => {
    const { declination } = at(t)
    const angle = -darccot(factor + dtan(Math.abs(latitude - declination)))
    return sunAngleTime(angle, t, 'cw')
  }

  return { midDay, sunAngleTime, asrTime }
}

/** The horizon dips slightly below level with altitude. */
const horizonAngle = (elevationMeters) => 0.833 + 0.0347 * Math.sqrt(Math.max(elevationMeters, 0))

/**
 * Returns the five prayers plus sunrise, as Date objects in the device's own
 * timezone offset for that day.
 */
export function prayerTimes({ latitude, longitude, date = new Date(), method, elevation = 0 }) {
  const config = method ?? methodFor({ latitude, longitude })
  const jd = julianDate(date.getFullYear(), date.getMonth() + 1, date.getDate()) - longitude / (15 * 24)
  const solar = createSolar(jd, latitude)
  const dip = horizonAngle(elevation)

  // One refinement pass: each time is recomputed at its own estimate, because
  // the sun's declination moves measurably across a single day.
  const refine = (fn, seed) => {
    let t = seed
    for (let i = 0; i < 2; i += 1) {
      const next = fn(t)
      if (next === null) return null
      t = next
    }
    return t
  }

  const fajr = refine((t) => solar.sunAngleTime(config.fajrAngle, t, 'ccw'), 5 / 24)
  const sunrise = refine((t) => solar.sunAngleTime(dip, t, 'ccw'), 6 / 24)
  const dhuhr = refine((t) => solar.midDay(t), 12 / 24)
  const asr = refine((t) => solar.asrTime(1, t), 13 / 24)
  const maghrib = refine((t) => solar.sunAngleTime(dip, t, 'cw'), 18 / 24)

  const isha = config.isha.minutesAfterMaghrib
    ? maghrib === null
      ? null
      : maghrib + config.isha.minutesAfterMaghrib / 60
    : refine((t) => solar.sunAngleTime(config.isha.angle, t, 'cw'), 18 / 24)

  // The formulas run in mean solar time at the given longitude; shift to the
  // device's own clock so the result matches the wall clock beside the jamaah.
  const timezoneHours = -date.getTimezoneOffset() / 60
  const toDate = (hours) => {
    if (hours === null) return null
    const local = hours + timezoneHours - longitude / 15
    const result = new Date(date)
    result.setHours(0, 0, 0, 0)
    result.setTime(result.getTime() + Math.round(local * 3600 * 1000))
    return result
  }

  return {
    method: config,
    times: [
      { id: 'fajr', label: 'Subuh', at: toDate(fajr) },
      { id: 'sunrise', label: 'Terbit', at: toDate(sunrise), informational: true },
      { id: 'dhuhr', label: 'Zuhur', at: toDate(dhuhr) },
      { id: 'asr', label: 'Asar', at: toDate(asr) },
      { id: 'maghrib', label: 'Magrib', at: toDate(maghrib) },
      { id: 'isha', label: 'Isya', at: toDate(isha) },
    ],
  }
}

/**
 * The prayer the jamaah is waiting for, and the one currently in force.
 * Rolls into tomorrow's Fajr after Isha rather than showing nothing.
 */
export function nextPrayer({ latitude, longitude, now = new Date(), method }) {
  const today = prayerTimes({ latitude, longitude, date: now, method })
  const prayers = today.times.filter((t) => !t.informational && t.at)

  const upcoming = prayers.find((t) => t.at.getTime() > now.getTime())
  if (upcoming) {
    const index = prayers.indexOf(upcoming)
    return { next: upcoming, current: index > 0 ? prayers[index - 1] : null, method: today.method }
  }

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const next = prayerTimes({ latitude, longitude, date: tomorrow, method }).times.find(
    (t) => t.id === 'fajr',
  )

  return { next, current: prayers[prayers.length - 1] ?? null, method: today.method }
}

/**
 * The zone the times are stated in, e.g. "WIB" or "GMT+3".
 *
 * Shown rather than assumed: a phone that has not switched zones after landing
 * in Jeddah will produce times that look plausible and are four hours wrong.
 * Naming the zone lets the jamaah catch that themselves.
 */
export function deviceTimezoneLabel(date = new Date()) {
  const part = new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')

  return part?.value ?? ''
}

/** True when the device clock is not on the timezone its location implies. */
export function timezoneLooksWrong({ longitude }, date = new Date()) {
  const deviceOffsetHours = -date.getTimezoneOffset() / 60
  // Solar time is the honest baseline; zones sit within a few hours of it.
  const solarOffsetHours = longitude / 15

  return Math.abs(deviceOffsetHours - solarOffsetHours) > 2.5
}

export function formatClock(date) {
  if (!date) return '--:--'
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date)
}

/** "2 jam 14 menit" — plain words, no clock arithmetic for the reader. */
export function formatCountdown(target, now = new Date()) {
  if (!target) return ''
  const totalMinutes = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes} menit lagi`
  if (minutes === 0) return `${hours} jam lagi`
  return `${hours} jam ${minutes} menit lagi`
}

export { KAABA }
