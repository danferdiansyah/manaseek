import { CheckCircle, Navigation, MessageCircle, Home } from 'lucide-react'

const orderDetails = [
  { label: 'ID Pesanan',   val: '#MNS-20250313' },
  { label: 'Mutawif',      val: 'Ustadz Hasan Al-Makki' },
  { label: 'Layanan',      val: 'Pendampingan Ibadah' },
  { label: 'Waktu',        val: 'Selasa, 13 Mar • 10:00 WAS' },
  { label: 'Lokasi',       val: 'Pintu King Fahd, Masjidil Haram' },
  { label: 'Total Bayar',  val: 'Rp 735.000' },
]

export default function BookingSuccessScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-white items-center justify-between px-6 py-12">
      <div />

      <div className="flex flex-col items-center text-center w-full">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl"
          style={{ background: 'linear-gradient(135deg, #1B5E35 0%, #2D7A4F 100%)' }}>
          <CheckCircle size={44} color="white" strokeWidth={1.8} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pemesanan Berhasil!</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Ustadz Hasan Al-Makki telah menerima pesananmu dan akan segera menuju lokasi.
        </p>

        {/* Order card */}
        <div className="mt-8 w-full rounded-2xl p-5 text-left" style={{ background: 'linear-gradient(135deg, #E8F3EC, #D1EBD8)' }}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Detail Pesanan</p>
          {orderDetails.map((r) => (
            <div key={r.label} className="flex justify-between py-1.5 border-b border-green-100 last:border-0">
              <span className="text-xs text-gray-500">{r.label}</span>
              <span className="text-xs font-semibold text-gray-700">{r.val}</span>
            </div>
          ))}
        </div>

        {/* Tracking */}
        <div className="mt-4 w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Status Mutawif</p>
              <p className="text-sm font-bold" style={{ color: '#1B5E35' }}>Sedang menuju lokasimu</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F3EC, #C3DFC9)' }}>
              <Navigation size={18} color="#1B5E35" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-3 bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full w-1/3" style={{ background: 'linear-gradient(90deg, #1B5E35, #2D7A4F)' }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Estimasi tiba: 8 menit</p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full space-y-3">
        <button onClick={() => navigate('home')} className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
          <Home size={18} /> Kembali ke Beranda
        </button>
        <button onClick={() => navigate('chatbot')} className="w-full py-4 rounded-2xl font-semibold border-2 text-sm flex items-center justify-center gap-2"
          style={{ borderColor: '#1B5E35', color: '#1B5E35' }}>
          <MessageCircle size={16} /> Chat dengan Mutawif
        </button>
      </div>
    </div>
  )
}
