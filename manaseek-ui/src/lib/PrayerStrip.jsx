import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronRight, MapPin } from 'lucide-react'
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
  return (
    <section className="prayer-section" aria-label="Waktu salat dan arah kiblat">
      <div className="prayer-card">
        <div className="prayer-date">
          <span>{dateLabel}</span>
          <span>{hijriLabel}</span>
        </div>
        <p className="prayer-next-label">Salat berikutnya</p>
        <div className="prayer-feature">
          <h2>{next.label}</h2>
          <span>{formatClock(next.at)}</span>
        </div>
        <p className="prayer-countdown">{formatCountdown(next.at, now) || 'Waktu belum tersedia'}</p>
        <div className="prayer-schedule" aria-label="Jadwal salat hari ini">
          {daily.map((time) => (
            <div key={time.id} className={`prayer-time${time.id === next.id ? ' is-next' : ''}`}>
              <span>{time.label}</span>
              <strong>{formatClock(time.at)}</strong>
              {time.id === next.id && <span className="sr-only">Salat berikutnya</span>}
            </div>
          ))}
        </div>
        <p className="prayer-method">{schedule.method.label}{zone ? ` · waktu ${zone}` : ''}</p>
      </div>
      <button onClick={() => navigate('qibla')} className="qibla-link">
        <span className="qibla-copy">
          <strong>Arah kiblat</strong>
          <span>{!position.precise ? 'Acuan Masjidil Haram' : atKaaba ? 'Anda berada di Masjidil Haram' : `${Math.round(bearing)}° · ${compassPoint(bearing)}`}</span>
        </span>
        <ChevronRight size={19} aria-hidden="true" />
      </button>
      <div className="location-note">
        <MapPin size={14} aria-hidden="true" />
        <p>{position.precise ? (position.accuracy ? formatAccuracy(position.accuracy) : 'Menggunakan lokasi Anda') : position.status === 'locating' ? 'Mencari lokasi Anda…' : 'Lokasi belum tersedia. Jadwal memakai acuan Makkah.'}</p>
        {!position.precise && position.status !== 'locating' && <button onClick={position.refresh}>Cari ulang</button>}
      </div>
      {zoneSuspect && (
        <div className="timezone-notice" role="status">
          <AlertTriangle size={18} />
          <p>Jam ponselmu masih {zone}, tidak cocok dengan lokasimu sekarang. Ubah zona waktu ponsel agar waktu salat ini benar.</p>
        </div>
      )}
    </section>
  )
}
