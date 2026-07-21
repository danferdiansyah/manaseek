import { ArrowLeft, MapPin, Search, Star, CheckCircle, UserCheck } from 'lucide-react'
import { BottomNav } from './HomeScreen'

const mutawifList = [
  { name: 'Ustadz Hasan Al-Makki',  exp: '12 tahun pengalaman', rating: 4.9, reviews: 134, price: 'Rp 350.000 / jam', distance: '0.3 km', tags: ['Haji', 'Umrah', 'Lansia'], photo: '/mutawif-hasan.jpg', available: true },
  { name: 'Ustadz Zaid Ibrahim',     exp: '8 tahun pengalaman',  rating: 4.8, reviews: 97,  price: 'Rp 280.000 / jam', distance: '0.7 km', tags: ['Umrah', 'Darurat'],        photo: '/mutawif-zaid.jpg',  available: true },
  { name: 'Ustadz Malik Faruq',      exp: '5 tahun pengalaman',  rating: 4.6, reviews: 52,  price: 'Rp 200.000 / jam', distance: '1.2 km', tags: ['Umrah'],                   photo: '/mutawif-malik.jpg', available: false },
]

export default function MutawifListScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-5" style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 50%, #2D7A4F 100%)' }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('home')} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft size={16} color="white" />
          </button>
          <h2 className="text-white font-bold text-lg">Mutawif On-Demand</h2>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <MapPin size={15} color="#86EFAC" />
          <div className="flex-1">
            <p className="text-white text-xs font-semibold">Lokasi Kamu</p>
            <p className="text-green-200 text-xs">Masjidil Haram, Makkah</p>
          </div>
          <button className="text-green-200 text-xs underline">Ubah</button>
        </div>
      </div>

      {/* Map — Masjidil Haram area */}
      <div className="mx-5 -mt-3 rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative" style={{ height: 150 }}>
        <iframe
          title="Peta Masjidil Haram"
          src="https://www.openstreetmap.org/export/embed.html?bbox=39.820%2C21.415%2C39.833%2C21.430&layer=mapnik&marker=21.4225%2C39.8262"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          loading="eager"
        />
        {/* Pin overlay mutawif */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { top: 40, left: 60,  bg: '#1B5E35', label: 'H' },
            { top: 60, right: 50, bg: '#1B5E35', label: 'Z' },
            { bottom: 38, left: 110, bg: '#B8944A', label: 'M' },
          ].map((pin, i) => (
            <div key={i} className="absolute w-6 h-6 rounded-full flex items-center justify-center shadow-lg text-xs font-bold text-white border border-white"
              style={{ background: pin.bg, top: pin.top, left: pin.left, right: pin.right, bottom: pin.bottom }}>
              {pin.label}
            </div>
          ))}
          {/* User location dot */}
          <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg" style={{ background: '#2563EB' }} />
            <div className="w-10 h-10 rounded-full absolute -top-3 -left-3 opacity-20 animate-ping" style={{ background: '#2563EB' }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto">
        {['Semua', 'Tersedia', 'Terdekat', 'Rating Tertinggi', 'Lansia'].map((f, i) => (
          <span key={f} className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={i === 0
              ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white' }
              : { background: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }}>
            {f}
          </span>
        ))}
      </div>

      {/* List */}
      <div className="px-5 space-y-3 mb-24">
        <p className="text-xs text-gray-400 font-medium">3 mutawif ditemukan di sekitarmu</p>
        {mutawifList.map((m) => (
          <button key={m.name} onClick={() => navigate('mutawif-profile')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left">
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={m.photo}
                  alt={m.name}
                  className="rounded-xl object-cover"
                  style={{ width: 52, height: 52, filter: m.available ? 'none' : 'grayscale(1) opacity(0.6)' }}
                />
                {m.available && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-800 text-sm">{m.name}</p>
                  <span className="text-xs text-gray-400">{m.distance}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{m.exp}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={11} color="#B8944A" fill="#B8944A" />
                  <span className="text-xs font-semibold" style={{ color: '#B8944A' }}>{m.rating}</span>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs text-gray-400">{m.reviews} ulasan</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1 flex-wrap">
                    {m.tags.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#E8F3EC', color: '#1B5E35' }}>{t}</span>
                    ))}
                  </div>
                  <p className="text-xs font-bold" style={{ color: '#1B5E35' }}>{m.price}</p>
                </div>
              </div>
            </div>
            {!m.available && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">Sedang tidak tersedia</p>
              </div>
            )}
          </button>
        ))}
      </div>

      <BottomNav active="mutawif" navigate={navigate} />
    </div>
  )
}
