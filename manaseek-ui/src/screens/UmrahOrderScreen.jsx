import { useCallback } from 'react'
import { CircleCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'
import UmrahDetails, { UmrahDemoNotice } from '../components/UmrahDetails'
import { api } from '../lib/api'
import { useResource } from '../lib/useResource'
import { ErrorState, Loading } from '../lib/ui'
import { formatRupiah } from '../lib/format'
import { ROOM_TYPES, umrahDate } from '../lib/umrah'

export default function UmrahOrderScreen({ navigate, params }) {
  const orderId = params?.orderId ?? ''
  const { status, data: order, error, reload } = useResource(useCallback(() => api.get(`/umrah/orders/${encodeURIComponent(orderId)}`), [orderId]))
  const snapshot = order?.packageSnapshot
  return <div className="app-page umrah-page bg-stone">
    <PageHeader title="Detail pesanan umroh" eyebrow="Perjalananmu" onBack={() => navigate('umrah-orders')} />
    <main className="umrah-content">
      {status === 'loading' && <Loading label="Memuat bukti pesanan…" />}
      {status === 'error' && <ErrorState message={error} onRetry={reload} />}
      {status === 'ready' && <>
        <section className="umrah-receipt">
          <CircleCheck size={48} aria-hidden="true" />
          <span className="umrah-status">Terkonfirmasi · Demo</span>
          <h2>Pembayaran simulasi berhasil</h2><p>Pesananmu sudah tercatat.</p><strong className="umrah-order-code">{order.code}</strong>
          <div className="umrah-receipt-total"><span>Total pembayaran dummy</span><strong>{formatRupiah(order.totalAmount)}</strong></div>
        </section>
        <UmrahDemoNotice />
        <section className="umrah-section"><h2>{snapshot.name}</h2>
          <dl className="umrah-totals"><div><dt>Berangkat</dt><dd>{umrahDate(snapshot.departureDate)}</dd></div><div><dt>Pulang</dt><dd>{umrahDate(snapshot.returnDate)}</dd></div><div><dt>Durasi</dt><dd>{snapshot.durationDays} hari</dd></div><div><dt>Kamar</dt><dd>{ROOM_TYPES.find((r) => r.id === order.roomType)?.label}</dd></div><div><dt>Jumlah jamaah</dt><dd>{order.travelerCount} orang</dd></div><div><dt>Harga / jamaah</dt><dd>{formatRupiah(order.unitPrice)}</dd></div></dl>
          <p className="umrah-help">{snapshot.details.roomNote}</p>
        </section>
        <section className="umrah-section"><h2>Kontak & data jamaah</h2><p>{order.contactName}</p><p>{order.contactEmail}</p><p>{order.contactPhone}</p>
          <ol className="umrah-traveler-list">{order.travelers.map((traveler) => <li key={traveler.id}><strong>{traveler.fullName}</strong><span>{traveler.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'} · {umrahDate(traveler.birthDate)}</span></li>)}</ol>
        </section>
        <section className="umrah-section"><h2>Bukti pembayaran</h2>
          <dl className="umrah-totals"><div><dt>Metode</dt><dd>Dummy</dd></div><div><dt>Status</dt><dd>Berhasil</dd></div><div><dt>Tanggal</dt><dd>{umrahDate(order.payment.paidAt)}</dd></div><div><dt>Jumlah</dt><dd>{formatRupiah(order.payment.amount)}</dd></div></dl>
          <p className="umrah-help umrah-payment-reference">Referensi: {order.payment.reference}</p>
        </section>
        <details className="umrah-saved-details"><summary>Lihat tiket, hotel & itinerary</summary><UmrahDetails details={snapshot.details} /></details>
        <button className="umrah-primary umrah-full" onClick={() => navigate('umrah-orders')}>Semua pesanan saya</button>
        <button className="umrah-secondary umrah-full" onClick={() => navigate('home')}>Kembali ke beranda</button>
      </>}
    </main>
    <BottomNav active="umrah-packages" navigate={navigate} />
  </div>
}
