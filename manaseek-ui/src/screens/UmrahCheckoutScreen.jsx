import { useCallback, useRef, useState } from 'react'
import { Loader2, Minus, Plus, WandSparkles } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { UmrahDemoNotice } from '../components/UmrahDetails'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { useResource } from '../lib/useResource'
import { ErrorState, Loading } from '../lib/ui'
import { formatRupiah } from '../lib/format'
import { ROOM_TYPES, umrahDate, umrahUnitPrice } from '../lib/umrah'

const newTraveler = () => ({ fullName: '', gender: 'MALE', birthDate: '' })

function CheckoutForm({ pkg, params, navigate }) {
  const { user } = useAuth()
  const [departureId, setDepartureId] = useState(params?.departureId ?? pkg.departures.find((d) => d.availableSeats > 0)?.id ?? '')
  const [roomType, setRoomType] = useState(ROOM_TYPES.some((r) => r.id === params?.roomType) ? params.roomType : 'QUAD')
  const [contact, setContact] = useState({ contactName: user?.name ?? '', contactEmail: user?.email ?? '', contactPhone: user?.phone ?? '' })
  const [travelers, setTravelers] = useState([{ ...newTraveler(), fullName: user?.name ?? '' }])
  const [acceptDemo, setAcceptDemo] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const [error, setError] = useState(null)
  const attempt = useRef(null)
  const sendLock = useRef(false)
  const departure = pkg.departures.find((d) => d.id === departureId)
  const unitPrice = umrahUnitPrice(pkg, roomType)
  const total = unitPrice * travelers.length
  const maxTravelers = Math.min(6, departure?.availableSeats ?? 0)
  const updateTraveler = (index, key, value) => setTravelers((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item))

  const fillDemo = () => {
    setContact({ contactName: 'Ahmad Demo', contactEmail: 'ahmad@example.com', contactPhone: '081234567890' })
    setTravelers((items) => items.map((_, i) => ({ fullName: i ? `Jamaah Demo ${i + 1}` : 'Ahmad Demo', gender: i % 2 ? 'FEMALE' : 'MALE', birthDate: '1990-01-01' })))
  }
  const submit = async (event) => {
    event.preventDefault()
    if (sendLock.current) return
    sendLock.current = true
    setSubmitting(true)
    setError(null)
    const dto = attempt.current ?? {
      requestId: crypto.randomUUID(), departureId, roomType, ...contact, travelers, acceptDemo,
    }
    attempt.current = dto
    try {
      const order = await api.post('/umrah/orders', dto)
      navigate('umrah-order', { orderId: order.id })
    } catch (failure) {
      const unknown = !failure.status || failure.status >= 500
      setUncertain(unknown)
      if (!unknown) attempt.current = null
      setError(unknown
        ? 'Status pesanan belum dapat dipastikan. Coba lagi dengan data yang sama, atau cek Pesanan saya.'
        : failure.message ?? 'Pesanan belum berhasil dibuat.')
    } finally {
      sendLock.current = false
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="Lengkapi perjalananmu" eyebrow="Pemesanan paket" description={pkg.name} onBack={submitting ? undefined : () => navigate('umrah-package', { slug: pkg.slug })} />
      <main className="umrah-content umrah-checkout">
        <UmrahDemoNotice />
        <form onSubmit={submit}>
          <fieldset disabled={submitting || uncertain}>
            <section className="umrah-section">
              <h2>Ringkasan perjalanan</h2>
              <label className="umrah-field">Jadwal keberangkatan<select value={departureId} onChange={(e) => setDepartureId(e.target.value)} required>
                <option value="" disabled>Pilih jadwal</option>{pkg.departures.map((d) => <option key={d.id} value={d.id} disabled={d.availableSeats === 0}>{umrahDate(d.departureDate)} · {d.availableSeats} kursi</option>)}
              </select></label>
              {departure && <p className="umrah-help">Pulang {umrahDate(departure.returnDate)} · {pkg.durationDays} hari · Dari {pkg.departureCity}</p>}
              <label className="umrah-field">Tipe kamar<select value={roomType} onChange={(e) => setRoomType(e.target.value)}>{ROOM_TYPES.map((room) => <option key={room.id} value={room.id}>{room.label} · {room.capacity} orang/kamar</option>)}</select></label>
              <p className="umrah-help">{pkg.details.roomNote}</p>
            </section>
            <section className="umrah-section">
              <div className="umrah-card-row"><h2>Kontak pemesan</h2><button className="umrah-demo-fill" type="button" onClick={fillDemo}><WandSparkles size={14} /> Isi data contoh</button></div>
              <label className="umrah-field">Nama pemesan<input name="contactName" value={contact.contactName} onChange={(e) => setContact({ ...contact, contactName: e.target.value })} required minLength={2} maxLength={100} autoComplete="name" /></label>
              <label className="umrah-field">Email<input name="contactEmail" type="email" value={contact.contactEmail} onChange={(e) => setContact({ ...contact, contactEmail: e.target.value })} required maxLength={254} autoComplete="email" /></label>
              <label className="umrah-field">Nomor WhatsApp<input name="contactPhone" type="tel" value={contact.contactPhone} onChange={(e) => setContact({ ...contact, contactPhone: e.target.value })} required pattern="[+]?[0-9]{8,15}" title="8–15 angka, boleh diawali +" autoComplete="tel" /></label>
            </section>
            <section className="umrah-section">
              <div className="umrah-card-row"><h2>Data jamaah</h2><div className="umrah-counter"><button type="button" aria-label="Kurangi jamaah" disabled={travelers.length === 1} onClick={() => setTravelers((items) => items.slice(0, -1))}><Minus size={16} /></button><span>{travelers.length}</span><button type="button" aria-label="Tambah jamaah" disabled={travelers.length >= maxTravelers} onClick={() => setTravelers((items) => [...items, newTraveler()])}><Plus size={16} /></button></div></div>
              <p className="umrah-help">Maksimal 6 jamaah dalam satu pesanan.</p>
              {travelers.map((traveler, index) => (
                <div className="umrah-traveler" key={index}>
                  <h3>Jamaah {index + 1}</h3>
                  <label className="umrah-field">Nama lengkap<input name={`traveler-${index}-name`} value={traveler.fullName} onChange={(e) => updateTraveler(index, 'fullName', e.target.value)} required minLength={2} maxLength={100} /></label>
                  <div className="umrah-field-pair">
                    <label className="umrah-field">Jenis kelamin<select value={traveler.gender} onChange={(e) => updateTraveler(index, 'gender', e.target.value)}><option value="MALE">Laki-laki</option><option value="FEMALE">Perempuan</option></select></label>
                    <label className="umrah-field">Tanggal lahir<input type="date" name={`traveler-${index}-birthDate`} value={traveler.birthDate} onChange={(e) => updateTraveler(index, 'birthDate', e.target.value)} min="1900-01-01" max={new Date().toISOString().slice(0, 10)} required /></label>
                  </div>
                </div>
              ))}
            </section>
            <section className="umrah-section">
              <h2>Rincian pembayaran</h2>
              <dl className="umrah-totals"><div><dt>Paket × {travelers.length} jamaah</dt><dd>{formatRupiah(Number(pkg.basePrice) * travelers.length)}</dd></div><div><dt>Tambahan kamar</dt><dd>{formatRupiah((unitPrice - Number(pkg.basePrice)) * travelers.length)}</dd></div><div><dt>Biaya layanan</dt><dd>{formatRupiah(0)}</dd></div><div className="umrah-total"><dt>Total</dt><dd>{formatRupiah(total)}</dd></div></dl>
              <p className="umrah-payment-method">Pembayaran dummy · Langsung berhasil</p>
              <label className="umrah-consent"><input type="checkbox" checked={acceptDemo} onChange={(e) => setAcceptDemo(e.target.checked)} required /><span>Saya memahami ini simulasi pembelian tanpa tagihan atau reservasi perjalanan sungguhan.</span></label>
            </section>
          </fieldset>
          {travelers.length > maxTravelers && <p className="umrah-form-error" role="alert">Kursi tidak mencukupi. Kurangi jamaah atau pilih jadwal lain.</p>}
          {error && <p className="umrah-form-error" role="alert">{error}</p>}
          <button type="submit" className="umrah-primary umrah-full" disabled={submitting || (!uncertain && (!acceptDemo || travelers.length > maxTravelers || !departure))}>
            {submitting ? <><Loader2 size={17} className="animate-spin" /> Menyimpan pesanan…</> : uncertain ? 'Cek & coba lagi' : 'Bayar dummy & pesan'}
          </button>
          <button type="button" className="umrah-secondary umrah-full" disabled={submitting} onClick={() => navigate('umrah-orders')}>Lihat pesanan saya</button>
        </form>
      </main>
    </>
  )
}

export default function UmrahCheckoutScreen({ navigate, params }) {
  const slug = params?.slug ?? ''
  const { status, data, error, reload } = useResource(useCallback(() => api.get(`/umrah/packages/${encodeURIComponent(slug)}`), [slug]))
  return <div className="app-page umrah-page bg-stone">{status === 'ready' ? <CheckoutForm key={data.id} pkg={data} params={params} navigate={navigate} /> : <><PageHeader title="Pemesanan paket" onBack={() => navigate('umrah-packages')} />{status === 'loading' ? <Loading /> : <div className="umrah-content"><ErrorState message={error} onRetry={reload} /></div>}</>}</div>
}
