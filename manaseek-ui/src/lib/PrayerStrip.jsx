import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronRight, Compass, MapPin, Moon, Sun, Sunrise, Sunset } from 'lucide-react'
import { AT_KAABA_RADIUS_KM, compassPoint, distanceToKaabaKm, qiblaBearing } from './qibla'
import {
  deviceTimezoneLabel, formatClock, formatCountdown, nextPrayer, prayerTimes, timezoneLooksWrong,
} from './prayer-times'
import { formatAccuracy, useDeviceLocation } from './useDeviceLocation'

const PRAYER_ICONS = [Sunrise, Sun, Sun, Sunset, Moon]

// Keep the schedule local so it remains available without an API connection.
export default function PrayerStrip({ navigate }) {
  const position = useDeviceLocation()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const schedule = prayerTimes({ ...position, date: now })
  const { next } = nextPrayer({ ...position, now })
  const bearing = qiblaBearing(position)
  const atKaaba = distanceToKaabaKm(position) < AT_KAABA_RADIUS_KM
  const daily = schedule.times.filter((time) => !time.informational)
  const NextPrayerIcon = PRAYER_ICONS[daily.findIndex((time) => time.id === next.id)] ?? Sun
  const zone = deviceTimezoneLabel(now)
  const zoneSuspect = position.precise && timezoneLooksWrong(position, now)
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(now)

  return (
    <section className="home-prayer" aria-label="Jadwal shalat hari ini">
      <div className="home-prayer-location">
        <span><MapPin size={13} aria-hidden="true" />{position.precise ? 'Lokasi kamu' : 'Acuan: Makkah'}</span>
        <span>{dateLabel}</span>
      </div>
      <div className="home-prayer-next">
        <div>
          <p className="home-prayer-caption">Shalat berikutnya</p>
          <h2>{next.label} <span>{formatClock(next.at)}</span><small>{zone}</small></h2>
          <p className="home-prayer-countdown">{formatCountdown(next.at, now)}</p>
        </div>
        <div className="home-prayer-sun" aria-hidden="true"><NextPrayerIcon size={32} strokeWidth={1.4} /></div>
      </div>
      <div className="home-prayer-times">
        {daily.map((time, index) => {
          const isNext = time.id === next.id
          const Icon = PRAYER_ICONS[index]
          return (
            <div key={time.id} className={isNext ? 'is-next' : ''} aria-current={isNext ? 'true' : undefined}>
              <Icon size={17} strokeWidth={1.6} aria-hidden="true" />
              <span>{time.label}</span>
              <strong>{formatClock(time.at)}</strong>
            </div>
          )
        })}
      </div>
      <p className="home-prayer-method">
        {schedule.method.label} · {position.precise
          ? position.accuracy ? formatAccuracy(position.accuracy) : 'lokasi perangkat'
          : position.status === 'locating' ? 'mencari lokasi…' : 'lokasi acuan Masjidil Haram'}
        {zone ? ` · ${zone}` : ''}
      </p>
      {zoneSuspect && (
        <div className="home-prayer-warning" role="status">
          <AlertTriangle size={16} aria-hidden="true" />
          <p>Jam ponselmu masih {zone}, tidak cocok dengan lokasimu sekarang. Ubah zona waktu ponsel agar waktu shalat ini benar.</p>
        </div>
      )}
      <button className="home-qibla" onClick={() => navigate('qibla')}>
        <Compass size={21} strokeWidth={1.7} aria-hidden="true" />
        <span>Arah kiblat</span>
        <small>{atKaaba ? 'Masjidil Haram' : `${Math.round(bearing)}° · ${compassPoint(bearing)}`}</small>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </section>
  )
}
