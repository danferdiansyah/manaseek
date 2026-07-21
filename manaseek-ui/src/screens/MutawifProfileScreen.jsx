import { ArrowLeft, Bookmark, Star, CheckCircle, MapPin, Accessibility, ShieldAlert, Crown } from 'lucide-react'

const services = [
  { Icon: Star,         label: 'Pendampingan Ibadah',       price: 'Rp 350.000 / jam' },
  { Icon: Accessibility, label: 'Bantuan Mobilitas Lansia', price: 'Rp 400.000 / jam' },
  { Icon: ShieldAlert,  label: 'Penanganan Darurat',        price: 'Rp 500.000 / jam' },
  { Icon: Crown,        label: 'Pendampingan VIP Full Day', price: 'Rp 2.500.000 / hari' },
]

const reviews = [
  { name: 'Budi S.', rating: 5, text: 'Sangat sabar dan berpengetahuan luas. Beliau membantu ibu saya yang lansia dengan baik sekali.' },
  { name: 'Siti R.', rating: 5, text: 'Penjelasannya sangat jelas dan mudah dipahami. Sangat merekomendasikan!' },
]

export default function MutawifProfileScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Hero */}
      <div className="relative pt-14 pb-6 px-5" style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 50%, #2D7A4F 100%)' }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('mutawif')} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft size={16} color="white" />
          </button>
          <span className="text-green-200 text-sm flex-1">Detail Mutawif</span>
          <Bookmark size={20} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />
        </div>

        <div className="flex items-center gap-4">
          <img
            src="/mutawif-hasan.jpg"
            alt="Ustadz Hasan Al-Makki"
            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
            style={{ border: '2px solid rgba(255,255,255,0.35)' }}
          />
          <div>
            <h2 className="text-white text-lg font-bold">Ustadz Hasan Al-Makki</h2>
            <p className="text-green-200 text-xs mt-0.5 flex items-center gap-1">
              <MapPin size={11} /> 12 tahun pengalaman • Makkah
            </p>
            <div className="flex items-center gap-2 mt-2">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} color="#F59E0B" fill="#F59E0B" />)}
              <span className="text-white font-bold text-sm">4.9</span>
              <span className="text-green-200 text-xs">(134 ulasan)</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {[
            { label: 'Tersedia', dot: true },
            { label: 'Terverifikasi' },
            { label: 'Bahasa Indonesia' },
          ].map(({ label, dot }) => (
            <span key={label} className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
              {dot && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
              {!dot && <CheckCircle size={11} color="#86EFAC" />}
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Specialties */}
      <div className="mx-5 -mt-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-2 flex-wrap">
        {['Haji', 'Umrah', 'Lansia', 'Darurat'].map((t) => (
          <span key={t} className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: '#E8F3EC', color: '#1B5E35' }}>{t}</span>
        ))}
      </div>

      <div className="px-5 mt-4 space-y-5 mb-32">
        {/* Bio */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-bold text-gray-800 mb-2">Tentang</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Ustadz Hasan adalah pembimbing ibadah bersertifikat dengan pengalaman lebih dari 12 tahun mendampingi jamaah Indonesia. Beliau telah membantu lebih dari 500 jamaah, termasuk jamaah lansia dan jamaah berkebutuhan khusus.
          </p>
        </div>

        {/* Services */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-3">Layanan</p>
          <div className="space-y-2">
            {services.map(({ Icon, label, price }) => (
              <div key={label} className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E8F3EC' }}>
                  <Icon size={16} color="#1B5E35" strokeWidth={1.8} />
                </div>
                <p className="flex-1 text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs font-bold flex-shrink-0" style={{ color: '#1B5E35' }}>{price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-3">Ulasan Jamaah</p>
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-700">{r.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={11} color="#B8944A" fill="#B8944A" />)}
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[390px] bg-white border-t border-gray-100 px-5 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Mulai dari</p>
            <p className="text-lg font-bold" style={{ color: '#1B5E35' }}>Rp 350.000 / jam</p>
          </div>
          <button onClick={() => navigate('booking')} className="px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-sm" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
            Pesan Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}
