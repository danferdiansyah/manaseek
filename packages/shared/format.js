const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatRupiah(value) {
  if (value === null || value === undefined) return '—'
  return rupiah.format(Number(value))
}

export function formatDistance(km) {
  if (km === null || km === undefined) return ''
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

/** Times are shown in Saudi local time; that is where the service happens. */
export function formatSchedule(iso) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso))
}

export function initialsOf(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export const SERVICE_LABELS = {
  IBADAH_GUIDANCE: 'Pendampingan Ibadah',
  MOBILITY_ASSISTANCE: 'Bantuan Mobilitas',
  EMERGENCY: 'Penanganan Darurat',
}

export const BOOKING_STATUS_LABELS = {
  REQUESTED: 'Menunggu konfirmasi',
  ACCEPTED: 'Diterima mutawif',
  ONGOING: 'Sedang berlangsung',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kedaluwarsa',
}
