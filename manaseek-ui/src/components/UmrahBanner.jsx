import makkah from '../assets/umrah/makkah-dawn.webp'
import madinah from '../assets/umrah/madinah-serenity.webp'
import premium from '../assets/umrah/premium-stay.webp'

const BANNERS = {
  makkah: { src: makkah, alt: 'Ilustrasi 3D Ka’bah dan pelataran Masjidil Haram saat matahari terbit' },
  madinah: { src: madinah, alt: 'Ilustrasi 3D kubah hijau dan pelataran Masjid Nabawi di Madinah' },
  premium: { src: premium, alt: 'Ilustrasi 3D teras hotel dengan pemandangan Makkah saat senja' },
}

const PACKAGE_BANNERS = {
  'umroh-hemat-9-hari': 'makkah',
  'umroh-nyaman-12-hari': 'madinah',
  'umroh-premium-15-hari': 'premium',
}

export default function UmrahBanner({ pkg, priority = false, decorative = false, className = '' }) {
  // Keep artwork stable when catalog ordering changes; new demo packages fall
  // back to their duration rather than an arbitrary position in the list.
  const name = PACKAGE_BANNERS[pkg?.slug] ?? (pkg?.durationDays >= 15 ? 'premium' : pkg?.durationDays >= 12 ? 'madinah' : 'makkah')
  const banner = BANNERS[name]
  return <img className={`umrah-banner ${className}`} src={banner.src} alt={decorative ? '' : banner.alt} width="1200" height="800" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" />
}
