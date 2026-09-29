import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import subuhIcon from '../assets/home/prayers/subuh.webp'
import zuhurIcon from '../assets/home/prayers/zuhur.webp'
import asarIcon from '../assets/home/prayers/asar.webp'
import magribIcon from '../assets/home/prayers/magrib.webp'
import isyaIcon from '../assets/home/prayers/isya.webp'
import locationIcon from '../assets/home/prayers/location.webp'
import chevronIcon from '../assets/home/prayers/chevron.webp'
import qiblaIcon from '../assets/home/services/qibla.webp'
import { AT_KAABA_RADIUS_KM, compassPoint, distanceToKaabaKm, qiblaBearing } from './qibla'
import {
  deviceTimezoneLabel, formatClock, formatCountdown, nextPrayer, prayerTimes, timezoneLooksWrong,
} from './prayer-times'
import { formatAccuracy, useDeviceLocation } from './useDeviceLocation'

const PRAYER_ICONS = {
  fajr: subuhIcon,
  dhuhr: zuhurIcon,
  asr: asarIcon,
  maghrib: magribIcon,
  isha: isyaIcon,
}

function PrayerIcon({ src, size }) {
  return <img src={src} className="home-prayer-icon" width={size} height={size} alt="" aria-hidden="true" decoding="async" draggable="false" />
}

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
  const nextPrayerIcon = PRAYER_ICONS[next.id] ?? zuhurIcon
  const zone = deviceTimezoneLabel(now)
  const zoneSuspect = position.precise && timezoneLooksWrong(position, now)
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(now)

  return (
    <section className="home-prayer" aria-label="Jadwal shalat hari ini">
      <div className="home-prayer-location">
        <span><PrayerIcon src={locationIcon} size={24} />{position.precise ? 'Lokasi kamu' : 'Acuan: Makkah'}</span>
        <span>{dateLabel}</span>
      </div>
      <div className="home-prayer-next">
        <div>
          <p className="home-prayer-caption">Shalat berikutnya</p>
          <h2>{next.label}</h2>
          <p className="home-prayer-countdown">{formatCountdown(next.at, now)}</p>
        </div>
        <div className="home-prayer-art"><PrayerIcon src={nextPrayerIcon} size={76} /></div>
      </div>
      <div className="home-prayer-times">
        {daily.map((time) => {
          const isNext = time.id === next.id
          return (
            <div key={time.id} className={isNext ? 'is-next' : ''} aria-current={isNext ? 'true' : undefined}>
              <PrayerIcon src={PRAYER_ICONS[time.id]} size={36} />
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
        <PrayerIcon src={qiblaIcon} size={32} />
        <span>Arah kiblat</span>
        <small>{atKaaba ? 'Masjidil Haram' : `${Math.round(bearing)}° · ${compassPoint(bearing)}`}</small>
        <PrayerIcon src={chevronIcon} size={18} />
      </button>
    </section>
  )
}
