import { useCallback, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'
import GlassIcon from '../components/GlassIcon'
import { api } from '../lib/api'
import { useResource } from '../lib/useResource'
import { EmptyState, ErrorState, Loading } from '../lib/ui'
import { formatRupiah } from '../lib/format'
import { umrahDate } from '../lib/umrah'
import './umrah.css'

function OrderPage({ page, setPage, navigate }) {
  const { status, data, error, reload } = useResource(useCallback(() => api.get(`/umrah/orders?page=${page}&limit=10`), [page]))
  if (status === 'loading') return <Loading label="Memuat pesanan umroh…" />
  if (status === 'error') return <ErrorState message={error} onRetry={reload} />
  return <>
    {!data.items.length && <><EmptyState title="Belum ada pesanan umroh" description="Pilih paket perjalanan dan coba pembayaran dummy." /><button className="umrah-primary umrah-full" onClick={() => navigate('umrah-packages')}>Jelajahi paket</button></>}
    <div className="umrah-order-list">{data.items.map((order) => (
      <button className="umrah-order-card" key={order.id} onClick={() => navigate('umrah-order', { orderId: order.id })}>
        <div className="umrah-card-row"><small>{order.code}</small><span className="umrah-status">Lunas · Demo</span></div>
        <div className="umrah-order-title"><GlassIcon name="umrah" size="sm" /><div><h2>{order.packageSnapshot.name}</h2><p>{umrahDate(order.packageSnapshot.departureDate)} · {order.travelerCount} jamaah</p></div><ChevronRight size={16} /></div>
        <div className="umrah-card-row"><span>{umrahDate(order.createdAt)}</span><strong>{formatRupiah(order.totalAmount)}</strong></div>
      </button>
    ))}</div>
    {data.meta.totalPages > 1 && <div className="umrah-pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><span>{page} / {data.meta.totalPages}</span><button disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>Berikutnya</button></div>}
  </>
}

export default function UmrahOrdersScreen({ navigate }) {
  const [page, setPage] = useState(1)
  return <div className="app-page umrah-page bg-stone">
    <PageHeader title="Pesanan umroh saya" eyebrow="Perjalananmu" description="Detail perjalanan dan bukti pembayaran dalam satu tempat." icon="travel" onBack={() => navigate('umrah-packages')} />
    <main className="umrah-content"><OrderPage key={page} page={page} setPage={setPage} navigate={navigate} /></main>
    <BottomNav active="profile" navigate={navigate} />
  </div>
}
