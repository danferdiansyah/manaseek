import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronRight, Sun } from 'lucide-react'
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
import { useDeviceLocation } from './useDeviceLocation'

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
  const { next, current } = nextPrayer({ ...position, now })
  const bearing = qiblaBearing(position)
  const atKaaba = distanceToKaabaKm(position) < AT_KAABA_RADIUS_KM
  const daily = schedule.times.filter((t) => !t.informational)
  const zone = deviceTimezoneLabel(now)
  const zoneSuspect = position.precise && timezoneLooksWrong(position, now)

  return (
    <section className="glass rounded-[20px] overflow-hidden">
      <div className="px-4 pt-4 pb-3.5 flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-[13px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--color-canopy-100)' }}
        >
          <Sun size={19} color="var(--color-canopy-700)" strokeWidth={1.8} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink-soft">
            {current ? `Sekarang waktu ${current.label}` : 'Menuju waktu shalat berikutnya'}
          </p>
          <p className="text-[17px] font-semibold text-ink mt-0.5">
            {next.label} {formatClock(next.at)}
          </p>
          <p className="text-sm text-ink-soft mt-0.5">{formatCountdown(next.at, now)}</p>
        </div>
      </div>

      <div className="flex border-t border-white/70">
        {daily.map((time) => {
          const isNext = time.id === next.id
          return (
            <div
              key={time.id}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5"
              style={isNext ? { background: 'var(--color-canopy-100)' } : undefined}
            >
              <span
                className="text-xs"
                style={{ color: isNext ? 'var(--color-canopy-700)' : 'var(--color-ink-faint)' }}
              >
                {time.label}
              </span>
              <span
                className="text-sm tabular-nums"
                style={{
                  color: isNext ? 'var(--color-canopy-700)' : 'var(--color-ink-soft)',
                  fontWeight: isNext ? 600 : 500,
                }}
              >
                {formatClock(time.at)}
              </span>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => navigate('qibla')}
        className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-white/70 text-left"
      >
        <span
          className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--color-brass-bg)',
            border: '1px solid rgba(184,148,74,.28)',
          }}
        >
          <KaabaIcon size={19} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-medium text-ink">Arah kiblat</span>
          <span className="block text-xs text-ink-faint mt-0.5">
            {atKaaba
              ? 'Kamu berada di Masjidil Haram'
              : `${Math.round(bearing)}° · ${compassPoint(bearing)}`}
          </span>
        </span>
        <ChevronRight size={16} color="var(--color-ink-faint)" />
      </button>

      <p className="px-4 pb-3 text-xs text-ink-faint">
        {schedule.method.label} · {position.precise ? 'lokasi kamu' : 'Masjidil Haram'}
        {zone ? ` · waktu ${zone}` : ''}
      </p>

      {zoneSuspect && (
        <div
          className="mx-4 mb-4 rounded-[14px] px-3.5 py-3 flex items-start gap-2.5"
          style={{ background: 'var(--color-brass-bg)', border: '1px solid rgba(184,148,74,.18)' }}
        >
          <AlertTriangle size={14} color="var(--color-brass)" className="flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: '#7a6224' }}>
            Jam ponselmu masih {zone}, tidak cocok dengan lokasimu sekarang. Ubah
            zona waktu ponsel agar waktu shalat ini benar.
          </p>
        </div>
      )}
    </section>
  )
}
