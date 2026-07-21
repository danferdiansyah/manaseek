import { ArrowLeft, Star, CheckCircle, MapPin, Accessibility, ShieldAlert, CreditCard } from 'lucide-react'

const serviceOpts = [
  { Icon: Star,          label: 'Pendampingan Ibadah',  price: 'Rp 350.000/jam', selected: true },
  { Icon: Accessibility, label: 'Bantuan Mobilitas',    price: 'Rp 400.000/jam', selected: false },
  { Icon: ShieldAlert,   label: 'Penanganan Darurat',   price: 'Rp 500.000/jam', selected: false },
]

const times = ['08:00', '09:00', '10:00', '13:00', '14:00', '15:00']
const days  = [['Sen', '12'], ['Sel', '13'], ['Rab', '14'], ['Kam', '15'], ['Jum', '16']]
const durations = ['1 jam', '2 jam', '3 jam', '4 jam']

export default function BookingScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('mutawif-profile')} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#E8F3EC' }}>
            <ArrowLeft size={16} color="#1B5E35" />
          </button>
          <h2 className="font-bold text-gray-800 text-base">Konfirmasi Pemesanan</h2>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4 mb-32">
        {/* Mutawif card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Mutawif Dipilih</p>
          <div className="flex items-center gap-3">
            <img src="/mutawif-hasan.jpg" alt="Ustadz Hasan" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            <div>
              <p className="font-bold text-gray-800 text-sm">Ustadz Hasan Al-Makki</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={11} color="#B8944A" fill="#B8944A" />
                <span className="text-xs font-semibold" style={{ color: '#B8944A' }}>4.9</span>
                <span className="text-xs text-gray-300">•</span>
                <CheckCircle size={11} color="#1B5E35" />
                <span className="text-xs text-gray-500">Terverifikasi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service type */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Jenis Layanan</p>
          <div className="space-y-2">
            {serviceOpts.map(({ Icon, label, price, selected }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ borderColor: selected ? '#1B5E35' : '#E5E7EB', background: selected ? '#E8F3EC' : 'transparent' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: selected ? '#C3DFC9' : '#F3F4F6' }}>
                  <Icon size={14} color={selected ? '#1B5E35' : '#9CA3AF'} strokeWidth={1.8} />
                </div>
                <p className="flex-1 text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs font-bold" style={{ color: '#1B5E35' }}>{price}</p>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selected ? '#1B5E35' : '#D1D5DB' }}>
                  {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#1B5E35' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tanggal</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map(([d, n], i) => (
              <div key={d} className="flex-shrink-0 w-12 flex flex-col items-center py-2 rounded-xl text-xs font-semibold"
                style={i === 1 ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white' } : { background: '#F3F4F6', color: '#6B7280' }}>
                <span>{d}</span><span>{n}</span>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-3">Jam Mulai</p>
          <div className="grid grid-cols-3 gap-2">
            {times.map((t, i) => (
              <div key={t} className="py-2 rounded-xl text-xs font-semibold text-center"
                style={i === 2 ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white' } : { background: '#F3F4F6', color: '#6B7280' }}>
                {t}
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-3">Durasi</p>
          <div className="flex gap-2">
            {durations.map((d, i) => (
              <div key={d} className="flex-1 py-2 rounded-xl text-xs font-semibold text-center"
                style={i === 1 ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white' } : { background: '#F3F4F6', color: '#6B7280' }}>
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Lokasi Pertemuan</p>
          <div className="flex items-center gap-2">
            <MapPin size={18} color="#1B5E35" strokeWidth={1.8} />
            <div>
              <p className="text-sm font-semibold text-gray-800">Pintu King Fahd, Masjidil Haram</p>
              <p className="text-xs text-gray-400">Makkah Al-Mukarramah</p>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Rincian Biaya</p>
          <div className="space-y-2">
            {[
              { label: 'Pendampingan Ibadah (2 jam)', val: 'Rp 700.000' },
              { label: 'Biaya layanan aplikasi (5%)', val: 'Rp 35.000' },
            ].map((r) => (
              <div key={r.label} className="flex justify-between">
                <span className="text-sm text-gray-500">{r.label}</span>
                <span className="text-sm text-gray-700">{r.val}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
              <span className="text-sm font-bold text-gray-800">Total</span>
              <span className="text-sm font-bold" style={{ color: '#1B5E35' }}>Rp 735.000</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[390px] bg-white border-t border-gray-100 px-5 py-4 shadow-lg">
        <button onClick={() => navigate('booking-success')} className="w-full py-4 rounded-2xl text-white font-bold text-base" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
          Konfirmasi Pemesanan
        </button>
        <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
          <CreditCard size={11} color="#9CA3AF" /> Dana ditahan hingga layanan selesai
        </p>
      </div>
    </div>
  )
}
