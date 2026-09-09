import { useEffect } from 'react'
import { ArrowLeft, Compass, Info, Loader2, LocateFixed, MapPin } from 'lucide-react'
import KaabaIcon from '../lib/KaabaIcon'
import { AT_KAABA_RADIUS_KM, compassPoint, distanceToKaabaKm, qiblaBearing } from '../lib/qibla'
import { useCompassHeading } from '../lib/useCompassHeading'
import { formatAccuracy, useDeviceLocation } from '../lib/useDeviceLocation'

const DIAL = 264
const RADIUS = DIAL / 2 - 26
const LABEL_RADIUS = DIAL / 2 - 52

export default function QiblaScreen({ navigate }) {
  const position = useDeviceLocation()
  const { heading, status, requestAccess } = useCompassHeading()

  const bearing = qiblaBearing(position)
  const distance = distanceToKaabaKm(position)
  const atKaaba = distance < AT_KAABA_RADIUS_KM
  const live = status === 'listening' && heading !== null

  // With a compass the dial turns under a fixed marker; without one the dial
  // stays north-up and the marker sits at the bearing itself.
  const dialRotation = live ? -heading : 0
  const markerAngle = bearing
  const alignment = live ? Math.abs(((bearing - heading + 540) % 360) - 180) : null
  const aligned = alignment !== null && alignment < 5

  // Nudge the device when it lines up: the jamaah is looking at the dial, not
  // reading numbers.
  useEffect(() => {
    if (aligned && navigator.vibrate) navigator.vibrate(40)
  }, [aligned])

  const markerPosition = (angleDeg, radius = RADIUS) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return {
      left: DIAL / 2 + radius * Math.cos(rad),
      top: DIAL / 2 + radius * Math.sin(rad),
    }
  }

  const kaaba = markerPosition(markerAngle)

  return (
    <div className="flex flex-col min-h-full bg-stone">
      <div className="canopy px-5 pt-14 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('home')}
            aria-label="Kembali"
            className="glass-control w-9 h-9 rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={16} color="white" />
          </button>
          <h2 className="text-white font-semibold text-lg">Arah Kiblat</h2>
        </div>

        <div className="glass-canopy rounded-[20px] p-4 mt-5 flex items-center gap-2.5">
          <MapPin size={15} color="#86EFAC" className="flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{position.label}</p>
            <p className="text-canopy-100/85 text-xs mt-0.5">
              {atKaaba
                ? 'Kamu sudah berada di Masjidil Haram'
                : `${Math.round(distance).toLocaleString('id-ID')} km ke Ka'bah`}
              {position.accuracy ? ` · ${formatAccuracy(position.accuracy)}` : ''}
            </p>
          </div>
          <button
            onClick={position.refresh}
            aria-label="Cari ulang lokasi"
            className="glass-control w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          >
            {position.status === 'locating'
              ? <Loader2 size={14} color="white" className="animate-spin" />
              : <LocateFixed size={14} color="white" />}
          </button>
        </div>
      </div>

      <div className="px-5 pt-8 pb-28 flex flex-col items-center">
        {/* Dial */}
        <div className="relative" style={{ width: DIAL, height: DIAL }}>
          <div
            className="absolute inset-0 rounded-full glass transition-transform duration-200 ease-out"
            style={{ transform: `rotate(${dialRotation}deg)` }}
          >
            {['U', 'T', 'S', 'B'].map((label, i) => {
              const at = markerPosition(i * 90, LABEL_RADIUS)
              return (
                <span
                  key={label}
                  className="absolute text-xs font-semibold -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: at.left,
                    top: at.top,
                    color: i === 0 ? 'var(--color-canopy-700)' : 'var(--color-ink-faint)',
                  }}
                >
                  {label}
                </span>
              )
            })}

            {/* The Kaaba marker rides the dial, so it keeps pointing at Makkah
                however the device is turned. */}
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
              style={{
                left: kaaba.left,
                top: kaaba.top,
                background: aligned
                  ? 'linear-gradient(150deg, #1B5E35, #2D7A4F)'
                  : 'linear-gradient(150deg, #B8944A, #D4A855)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 8px 20px -12px rgba(15,61,34,.9)',
              }}
            >
              <KaabaIcon size={24} />
            </span>
          </div>

          {/* Fixed sight line at the top of the device. */}
          <span
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: 6,
              width: 3,
              height: 16,
              background: aligned ? 'var(--color-canopy-700)' : 'var(--color-ink-faint)',
            }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-12 text-center">
            {atKaaba ? (
              <p className="text-[15px] font-medium text-ink leading-snug">
                Ka'bah ada di hadapanmu
              </p>
            ) : (
              <>
                <p className="text-4xl font-semibold text-ink tabular-nums">{Math.round(bearing)}°</p>
                <p className="text-sm text-ink-soft mt-0.5">{compassPoint(bearing)}</p>
              </>
            )}
          </div>
        </div>

        <div className="mt-7 w-full">
          {status === 'listening' && !live && (
            <p className="text-center text-sm text-ink-faint">Mencari arah utara…</p>
          )}

          {status === 'needs-permission' && (
            <button
              onClick={requestAccess}
              className="w-full py-4 rounded-[16px] text-white font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(150deg, #1B5E35, #2D7A4F)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.28)',
              }}
            >
              <Compass size={17} /> Nyalakan kompas
            </button>
          )}

          {live && (
            <p
              className="text-center text-[15px] font-medium"
              style={{ color: aligned ? 'var(--color-canopy-700)' : 'var(--color-ink-soft)' }}
            >
              {aligned ? 'Kamu sudah menghadap kiblat' : 'Putar badanmu sampai Ka’bah sejajar garis atas'}
            </p>
          )}

          {(status === 'unsupported' || status === 'denied' || status === 'no-signal') && (
            <div className="glass rounded-[16px] p-4 flex items-start gap-2.5">
              <Info size={15} color="var(--color-ink-soft)" className="flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink-soft leading-relaxed">
                {status === 'denied'
                  ? 'Izin kompas ditolak, jadi arah tidak bisa mengikuti gerakanmu. '
                  : 'Perangkat ini tidak punya kompas yang bisa dibaca aplikasi. '}
                {atKaaba
                  ? "Ka'bah ada tepat di hadapanmu, tidak perlu arah kompas."
                  : `Arahkan bagian atas ponsel ke utara, lalu putar ${Math.round(bearing)} derajat searah jarum jam ke arah ${compassPoint(bearing).toLowerCase()}.`}
              </p>
            </div>
          )}
        </div>

        {!position.precise && (
          <p className="text-xs text-ink-faint text-center mt-5 leading-relaxed">
            {position.status === 'locating'
              ? 'Sedang mencari lokasimu. Sementara ini arah dihitung dari Masjidil Haram.'
              : 'Arah dihitung dari Masjidil Haram karena lokasimu belum diizinkan. Aktifkan izin lokasi agar arahnya sesuai posisimu.'}
          </p>
        )}
      </div>
    </div>
  )
}
