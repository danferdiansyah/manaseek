import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronRight, Sun, Sunrise, Sunset, Moon, MapPin } from 'lucide-react'
import KaabaIcon from './KaabaIcon'
import { AT_KAABA_RADIUS_KM, compassPoint, distanceToKaabaKm, qiblaBearing } from './qibla'
import {
  deviceTimezoneLabel,
  formatClock,
  formatCountdown,
  nextPrayer,
  prayerTimes,
  timezoneLooksWrong,
} from './prayer-times'
import { formatAccuracy, useDeviceLocation } from './useDeviceLocation'

/**
 * Next prayer, the day's five times, and the qibla, in one card.
 *
 * Times are computed on the device rather than fetched: jamaah lose signal
 * constantly in Makkah and Mina, and a prayer time that needs data is not a
 * prayer time.
 */
export default function PrayerStrip({ navigate }) {
  const position = useDeviceLocation()
  const [now, setNow] = useState(() => new Date())

  // A minute is the finest granularity anything here shows.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const schedule = prayerTimes({ ...position, date: now })
  const { next } = nextPrayer({ ...position, now })
  const bearing = qiblaBearing(position)
  const atKaaba = distanceToKaabaKm(position) < AT_KAABA_RADIUS_KM
  const daily = schedule.times.filter((t) => !t.informational)
  const zone = deviceTimezoneLabel(now)
  const zoneSuspect = position.precise && timezoneLooksWrong(position, now)
  const dateLabel = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(now)
  const hijriLabel = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  const prayerIcons = { fajr: Sunrise, dhuhr: Sun, asr: Sun, maghrib: Sunset, isha: Moon }
  const NextIcon = prayerIcons[next.id] ?? Sun

  return (
    <section className="prayer-section" aria-label="Waktu salat dan arah kiblat">
      <div className="prayer-card">
        <div className="prayer-card-top"><span className="eyebrow">WAKTU SALAT</span><span className="prayer-date">{dateLabel}<br /><span>{hijriLabel}</span></span></div>
        <div className="prayer-feature"><div><p className="prayer-next-label">Salat berikutnya</p><h2>{next.label}</h2><p className="prayer-countdown">{formatCountdown(next.at, now) || 'Waktu belum tersedia'}</p></div><span className="prayer-sun"><NextIcon size={39} strokeWidth={1.5} /></span></div>
        <p className="prayer-reminder">Sejenak berhenti, mendekatkan diri.<br /><span>Jadikan salat penenang perjalanan Anda.</span></p>
        <div className="prayer-schedule">
          {daily.map((time) => {
            const Icon = prayerIcons[time.id]
            return <div key={time.id} className={`prayer-time${time.id === next.id ? ' is-next' : ''}`}><Icon size={22} strokeWidth={1.6} /><span>{time.label}</span><strong>{formatClock(time.at)}</strong><i /></div>
          })}
        </div>
      </div>
      <button onClick={() => navigate('qibla')} className="qibla-card">
        <span className="qibla-art"><KaabaIcon size={43} /></span>
        <span className="qibla-copy"><span className="eyebrow">ARAH KIBLAT</span><strong>{!position.precise ? 'Lokasi acuan: Masjidil Haram' : atKaaba ? 'Kamu berada di Masjidil Haram' : `${Math.round(bearing)}° · ${compassPoint(bearing)}`}</strong><small>{schedule.method.label}{zone ? ` · waktu ${zone}` : ''}</small></span>
        <span className="qibla-arrow"><ChevronRight size={20} /></span>
      </button>
      <p className="location-note"><MapPin size={12} />{position.precise ? (position.accuracy ? formatAccuracy(position.accuracy) : 'Menggunakan lokasi kamu') : position.status === 'locating' ? 'Mencari lokasi Anda…' : 'Lokasi belum tersedia. Jadwal memakai acuan Makkah.'}{!position.precise && position.status !== 'locating' && <button onClick={position.refresh}>Cari ulang</button>}</p>
      {zoneSuspect && <div className="timezone-notice"><AlertTriangle size={17} /><p>Jam ponselmu masih {zone}, tidak cocok dengan lokasimu sekarang. Ubah zona waktu ponsel agar waktu salat ini benar.</p></div>}
    </section>
  )
}
