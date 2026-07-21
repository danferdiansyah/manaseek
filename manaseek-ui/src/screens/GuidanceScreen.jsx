import { ArrowLeft, Search, CheckSquare, ChevronRight, BookOpen, Scissors, Sunrise, Moon, Target, Heart, RotateCcw, ArrowRightLeft } from 'lucide-react'
import { BottomNav } from './HomeScreen'

const phases = [
  { Icon: BookOpen,  title: 'Ihram & Niat',       sub: 'Rukun pertama ibadah umrah',          tag: 'Wajib' },
  { Icon: RotateCcw,     title: 'Tawaf',               sub: "7 putaran mengelilingi Ka'bah",        tag: 'Rukun' },
  { Icon: ArrowRightLeft, title: "Sa'i",             sub: 'Berlari kecil antara Safa & Marwah',   tag: 'Rukun' },
  { Icon: Scissors,  title: 'Tahalul',              sub: 'Mencukur atau memotong rambut',        tag: 'Wajib' },
  { Icon: Sunrise,   title: 'Wukuf di Arafah',     sub: 'Puncak ibadah haji',                  tag: 'Haji'  },
  { Icon: Moon,      title: 'Mabit di Muzdalifah', sub: 'Bermalam & mengumpulkan batu',         tag: 'Haji'  },
  { Icon: Target,    title: 'Melontar Jumrah',      sub: 'Jumrah ula, wustha, aqabah',           tag: 'Haji'  },
  { Icon: Heart,     title: 'Doa & Dzikir',        sub: 'Kumpulan doa pilihan',                 tag: 'Umum'  },
]

const tagStyle = {
  Wajib: { bg: '#FFF4E5', color: '#B8944A' },
  Rukun: { bg: '#E8F3EC', color: '#1B5E35' },
  Haji:  { bg: '#EEF2FF', color: '#4F46E5' },
  Umum:  { bg: '#F3F4F6', color: '#6B7280' },
}

export default function GuidanceScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-5" style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 50%, #2D7A4F 100%)' }}>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate('home')} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft size={16} color="white" />
          </button>
          <h2 className="text-white font-bold text-lg">Guidance Mandiri</h2>
        </div>
        <div className="relative">
          <Search size={15} color="#9CA3AF" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input readOnly placeholder="Cari panduan ibadah..." className="w-full pl-9 pr-4 py-3 rounded-xl bg-white text-sm text-gray-500 outline-none" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto">
        {['Semua', 'Umrah', 'Haji', 'Doa', 'Checklist'].map((f, i) => (
          <span key={f} className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={i === 0
              ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white' }
              : { background: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }}>
            {f}
          </span>
        ))}
      </div>

      {/* Checklist banner */}
      <div className="mx-5 mb-4 rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #F5EDD8, #FFF4E5)' }}>
        <CheckSquare size={24} color="#B8944A" strokeWidth={1.8} />
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: '#8B6914' }}>Checklist Persiapan</p>
          <p className="text-xs" style={{ color: '#A07C2A' }}>3 dari 12 item selesai</p>
        </div>
        <button className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #B8944A, #D4A855)' }}>
          Buka
        </button>
      </div>

      {/* Phase list */}
      <div className="px-5 space-y-3 mb-24">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rangkaian Ibadah</p>
        {phases.map((p) => {
          const ts = tagStyle[p.tag]
          return (
            <button key={p.title} onClick={() => navigate('guidance-detail')}
              className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #E8F3EC, #C3DFC9)' }}>
                {p.Icon
                  ? <p.Icon size={22} color="#1B5E35" strokeWidth={1.8} />
                  : <span className="text-2xl">{p.icon}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{p.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{p.sub}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: ts.bg, color: ts.color }}>{p.tag}</span>
                <ChevronRight size={14} color="#D1D5DB" />
              </div>
            </button>
          )
        })}
      </div>

      <BottomNav active="guidance" navigate={navigate} />
    </div>
  )
}
