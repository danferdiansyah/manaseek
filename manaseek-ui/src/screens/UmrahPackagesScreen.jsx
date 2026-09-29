import { useCallback } from 'react'
import { ArrowRight, CalendarDays, Hotel, Plane, ReceiptText } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'
import GlassIcon from '../components/GlassIcon'
import { UmrahDemoNotice } from '../components/UmrahDetails'
import { api } from '../lib/api'
import { useResource } from '../lib/useResource'
import { EmptyState, ErrorState, Loading } from '../lib/ui'
import { formatRupiah } from '../lib/format'
import { umrahDate } from '../lib/umrah'

export default function UmrahPackagesScreen({ navigate }) {
  const { status, data, error, reload } = useResource(useCallback(() => api.get('/umrah/packages'), []))
  return (
    <div className="app-page umrah-page bg-stone">
      <PageHeader title="Perjalanan ke Baitullah" eyebrow="Paket umroh" description="Pesawat, hotel, dan kebutuhan ibadah dalam satu paket." icon="umrah" onBack={() => navigate('home')}>
        <button className="umrah-header-link" onClick={() => navigate('umrah-orders')}><ReceiptText size={17} /> Pesanan saya <ArrowRight size={16} /></button>
      </PageHeader>
      <main className="umrah-content">
        <UmrahDemoNotice />
        {status === 'loading' && <Loading label="Menyiapkan pilihan paket…" />}
        {status === 'error' && <ErrorState message={error} onRetry={reload} />}
        {status === 'ready' && !data.items.length && <EmptyState title="Paket sedang disiapkan" description="Cek kembali pilihan perjalanan beberapa saat lagi." />}
        <div className="umrah-package-list">
          {data?.items.map((pkg, index) => {
            const departure = pkg.departures.find((item) => item.availableSeats > 0)
            return (
              <article className="umrah-package-card" key={pkg.id} data-package-slug={pkg.slug}>
                <div className={`umrah-package-cover umrah-cover-${index % 3}`}>
                  <div><span className="umrah-tag">{pkg.durationDays} hari · Paket demo</span><h2>{pkg.name}</h2><p>{pkg.summary}</p></div>
                  <GlassIcon name={index === 1 ? 'travel' : 'umrah'} size="hero" bare />
                </div>
                <div className="umrah-package-body">
                  <div className="umrah-package-facts"><span><Plane size={14} /> Pesawat PP</span><span><Hotel size={14} /> Hotel {pkg.details.hotels[0].stars}★</span><span><CalendarDays size={14} /> {pkg.departureCity}</span></div>
                  <p className="umrah-next-date">{departure ? `${umrahDate(departure.departureDate)} · ${departure.availableSeats} kursi tersedia` : 'Belum ada keberangkatan tersedia'}</p>
                  <div className="umrah-card-row"><div className="umrah-price"><small>Mulai dari / jamaah</small><strong>{formatRupiah(pkg.basePrice)}</strong></div><button className="umrah-primary umrah-compact" onClick={() => navigate('umrah-package', { slug: pkg.slug })}>Lihat paket <ArrowRight size={15} /></button></div>
                </div>
              </article>
            )
          })}
        </div>
      </main>
      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}
