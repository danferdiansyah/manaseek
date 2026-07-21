import {
  Bell, Home, BookOpen, MessageCircle, UserCheck, Settings,
  ChevronRight, FileText, Star,
  Layers, RotateCcw, ArrowRightLeft, Sunrise
} from 'lucide-react'

const NAV_TABS = [
  { id: 'home', label: 'Beranda', Icon: Home },
  { id: 'guidance', label: 'Panduan', Icon: BookOpen },
  { id: 'chatbot', label: 'AI Chat', Icon: MessageCircle },
  { id: 'mutawif', label: 'Mutawif', Icon: UserCheck },
  { id: 'profile', label: 'Profil', Icon: Settings },
]

export function BottomNav({ active, navigate }) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[390px] bg-white border-t border-gray-100 flex shadow-lg z-50">
      {NAV_TABS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            className="flex-1 flex flex-col items-center py-3 gap-0.5"
          >
            <Icon size={20} color={isActive ? '#1B5E35' : '#9ca3af'} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium" style={{ color: isActive ? '#1B5E35' : '#9ca3af' }}>
              {label}
            </span>
            {isActive && <div className="w-1 h-1 rounded-full" style={{ background: '#1B5E35' }} />}
          </button>
        )
      })}
    </div>
  )
}

const PHASES = [
  { label: 'Ihram',  Icon: Layers },
  { label: 'Tawaf',  Icon: RotateCcw },
  { label: "Sa'i",   Icon: ArrowRightLeft },
  { label: 'Wukuf',  Icon: Sunrise },
]

export default function HomeScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-6" style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 50%, #2D7A4F 100%)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-green-200 text-xs mb-0.5">Assalamu'alaikum</p>
            <h2 className="text-white text-xl font-bold">Ahmad Fauzi</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Bell size={18} color="white" strokeWidth={1.8} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-400 border border-white/50" />
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #B8944A 0%, #D4A855 100%)', color: 'white' }}
            >
              AF
            </div>
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-2xl p-4 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <p className="text-green-100 text-xs mb-1">Rencana Ibadah</p>
          <p className="text-white font-semibold">Umrah — Maret 2025</p>
          <div className="mt-3 bg-white/20 rounded-full h-1.5">
            <div className="h-1.5 rounded-full w-2/5" style={{ background: 'linear-gradient(90deg, #B8944A, #D4A855)' }} />
          </div>
          <p className="text-green-200 text-xs mt-1.5">Persiapan 40% selesai</p>
        </div>
      </div>

      {/* Main features */}
      <div className="px-5 -mt-3 z-10 relative">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Guidance\nMandiri', Icon: BookOpen, screen: 'guidance', grad: 'linear-gradient(135deg, #1B5E35 0%, #2D7A4F 100%)' },
            { label: 'Chatbot\nAI', Icon: MessageCircle, screen: 'chatbot', grad: 'linear-gradient(135deg, #B8944A 0%, #D4A855 100%)' },
            { label: 'Mutawif\nOn-Demand', Icon: UserCheck, screen: 'mutawif', grad: 'linear-gradient(135deg, #0f3d22 0%, #1B5E35 100%)' },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => navigate(f.screen)}
              className="flex flex-col items-center justify-center py-5 px-2 rounded-2xl shadow-md text-white"
              style={{ background: f.grad }}
            >
              <f.Icon size={26} color="white" strokeWidth={1.8} className="mb-2" />
              <span className="text-xs font-semibold text-center leading-tight whitespace-pre-line opacity-95">
                {f.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick phases */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">Panduan Ibadah</h3>
          <button onClick={() => navigate('guidance')} className="text-xs font-medium flex items-center gap-0.5" style={{ color: '#1B5E35' }}>
            Lihat semua <ChevronRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PHASES.map(({ label, Icon }) => (
            <button
              key={label}
              onClick={() => navigate('guidance-detail')}
              className="flex flex-col items-center py-3 rounded-xl bg-white shadow-sm border border-gray-100"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1" style={{ background: '#E8F3EC' }}>
                <Icon size={17} color="#1B5E35" strokeWidth={1.8} />
              </div>
              <span className="text-xs text-gray-600 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="px-5 mt-5 mb-24">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">Tips &amp; Informasi</h3>
        </div>
        <div className="space-y-3">
          {[
            { title: 'Doa Masuk Masjidil Haram', tag: 'Doa', time: '2 menit baca' },
            { title: 'Larangan Selama Berihram', tag: 'Panduan', time: '5 menit baca' },
          ].map((t) => (
            <div
              key={t.title}
              onClick={() => navigate('guidance-detail')}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E8F3EC, #C3DFC9)' }}>
                <FileText size={18} color="#1B5E35" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{t.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.time}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{ background: '#F5EDD8', color: '#B8944A' }}>
                {t.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}
