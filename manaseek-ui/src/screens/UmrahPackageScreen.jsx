import { useCallback, useState } from 'react'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'
import UmrahDetails, { UmrahDemoNotice } from '../components/UmrahDetails'
import { api } from '../lib/api'
import { useResource } from '../lib/useResource'
import { ErrorState, Loading } from '../lib/ui'
import { formatRupiah } from '../lib/format'
import { ROOM_TYPES, umrahDate, umrahUnitPrice } from '../lib/umrah'

function PackageContent({ pkg, navigate }) {
  const [departureId, setDepartureId] = useState(() => pkg.departures.find((d) => d.availableSeats > 0)?.id ?? '')
  const [roomType, setRoomType] = useState('QUAD')
  const departure = pkg.departures.find((d) => d.id === departureId)
  return (
    <>
      <div className="umrah-content umrah-with-action">
        <UmrahDemoNotice />
        <section className="umrah-section"><p>{pkg.description}</p><p className="umrah-overline">{pkg.details.agency} · {pkg.durationDays} hari · Dari {pkg.departureCity}</p></section>
        <section className="umrah-section">
          <h2>Pilih keberangkatan</h2>
          <div className="umrah-departures">{pkg.departures.map((d) => (
            <button key={d.id} className="umrah-choice" aria-pressed={departureId === d.id} disabled={d.availableSeats === 0} onClick={() => setDepartureId(d.id)}>
              <strong>{umrahDate(d.departureDate)}</strong><span>Pulang {umrahDate(d.returnDate)}</span><small>{d.availableSeats > 0 ? `${d.availableSeats} kursi tersedia` : 'Kursi habis'}</small>
            </button>
          ))}</div>
          {!pkg.departures.length && <p>Belum ada jadwal tersedia. Silakan pilih paket lain.</p>}
          <h3 className="umrah-subheading">Pilihan kamar</h3>
          <div className="umrah-room-grid">{ROOM_TYPES.map((room) => (
            <button key={room.id} className="umrah-choice" aria-pressed={roomType === room.id} onClick={() => setRoomType(room.id)}>
              <strong>{room.label}</strong><span>{room.capacity} orang</span><small>{formatRupiah(umrahUnitPrice(pkg, room.id))}</small>
            </button>
          ))}</div>
          <p className="umrah-help">{pkg.details.roomNote}</p>
        </section>
        <UmrahDetails details={pkg.details} />
      </div>
      <div className="umrah-action"><div className="umrah-price"><small>Per jamaah</small><strong>{formatRupiah(umrahUnitPrice(pkg, roomType))}</strong></div><button className="umrah-primary" disabled={!departure || departure.availableSeats < 1} onClick={() => navigate('umrah-checkout', { slug: pkg.slug, departureId, roomType })}>Pesan paket</button></div>
    </>
  )
}

export default function UmrahPackageScreen({ navigate, params }) {
  const slug = params?.slug ?? ''
  const { status, data, error, reload } = useResource(useCallback(() => api.get(`/umrah/packages/${encodeURIComponent(slug)}`), [slug]))
  return (
    <div className="app-page umrah-page bg-stone">
      <PageHeader title={data?.name ?? 'Detail paket umroh'} eyebrow="Perjalanan pilihanmu" description={data?.summary} icon="umrah" onBack={() => navigate('umrah-packages')} />
      {status === 'loading' && <Loading />}
      {status === 'error' && <div className="umrah-content"><ErrorState message={error} onRetry={reload} /></div>}
      {status === 'ready' && <PackageContent key={data.id} pkg={data} navigate={navigate} />}
      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}
